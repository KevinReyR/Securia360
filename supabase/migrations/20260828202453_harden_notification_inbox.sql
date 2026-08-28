-- Private inbox consumer. Domain event status remains untouched because other consumers share the outbox.
create table public.notification_event_consumptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  domain_event_id uuid not null unique references public.domain_events(id) on delete restrict,
  idempotency_key uuid not null unique,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','discarded')),
  attempt_count integer not null default 0 check (attempt_count >= 0 and attempt_count <= 8),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  completed_at timestamptz,
  last_error text check (last_error is null or length(last_error) <= 500),
  created_at timestamptz not null default now(),
  check ((status in ('pending','failed') and completed_at is null) or (status = 'processing' and locked_at is not null and locked_by is not null) or (status in ('completed','discarded') and completed_at is not null))
);
create index notification_event_consumptions_worker_idx on public.notification_event_consumptions(status, available_at, created_at) where status in ('pending','failed');

alter table public.notification_event_consumptions enable row level security;
revoke all on public.notification_event_consumptions from anon, authenticated;
create policy notification_event_consumptions_no_direct_access on public.notification_event_consumptions for all to authenticated using(false) with check(false);

create or replace function private.notification_quiet_until(p_timezone text, p_start time, p_end time)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_local timestamp;
  v_date date;
begin
  if p_start is null or p_end is null then return null; end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    raise exception 'invalid notification timezone' using errcode = '22023';
  end if;
  v_local := now() at time zone p_timezone;
  v_date := v_local::date;
  if p_start < p_end and v_local::time >= p_start and v_local::time < p_end then
    return (v_date::timestamp + p_end) at time zone p_timezone;
  elsif p_start > p_end and (v_local::time >= p_start or v_local::time < p_end) then
    if v_local::time >= p_start then v_date := v_date + 1; end if;
    return (v_date::timestamp + p_end) at time zone p_timezone;
  elsif p_start = p_end then
    return null;
  end if;
  return null;
end;
$$;

create or replace function private.validate_notification_preference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'invalid notification timezone' using errcode = '22023';
  end if;
  return new;
end;
$$;

create or replace function private.lock_notification_preference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.organization_id <> old.organization_id or new.user_id <> old.user_id) then
    raise exception 'notification preference ownership is immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.lock_notification_recipient_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.organization_id <> old.organization_id or new.domain_event_id <> old.domain_event_id or new.recipient_user_id <> old.recipient_user_id or new.channel <> old.channel or new.priority <> old.priority or new.title <> old.title or new.body <> old.body or new.safe_link is distinct from old.safe_link or new.created_at <> old.created_at then
    raise exception 'notification content is immutable' using errcode = '23514';
  end if;
  if (select auth.uid()) is null or new.recipient_user_id <> (select auth.uid()) then
    raise exception 'only the notification recipient can update it' using errcode = '42501';
  end if;
  if new.status not in ('delivered','read') or (old.status = 'read' and new.status <> 'read') then
    raise exception 'notification status transition is invalid' using errcode = '23514';
  end if;
  if new.status = 'read' and new.read_at is null then new.read_at := now(); end if;
  if new.status = 'delivered' and new.read_at is not null then raise exception 'unread notification cannot have read_at' using errcode = '23514'; end if;
  return new;
end;
$$;

create or replace function private.lock_notification_template()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.status in ('approved','archived') then
    raise exception 'approved or archived notification templates are immutable' using errcode = '23514';
  end if;
  if new.status = 'approved' and (select auth.uid()) is not null then
    if not private.has_permission(new.organization_id, 'notifications.templates_approve') then
      raise exception 'notification template approval permission is required' using errcode = '42501';
    end if;
    new.approved_by := (select auth.uid()); new.approved_at := now();
  end if;
  return new;
end;
$$;

create or replace function private.claim_notification_event_consumptions(p_worker_id text, p_limit integer default 50)
returns setof public.notification_event_consumptions
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 100 then raise exception 'invalid notification batch size' using errcode = '22023'; end if;
  return query with claimed as (
    select id from public.notification_event_consumptions
    where status in ('pending','failed') and available_at <= now()
    order by available_at, created_at for update skip locked limit p_limit
  ) update public.notification_event_consumptions c
    set status='processing', locked_at=now(), locked_by=p_worker_id, attempt_count=c.attempt_count+1
    from claimed where c.id=claimed.id returning c.*;
end;
$$;

create or replace function private.consume_notification_event(p_consumption_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.notification_event_consumptions%rowtype;
  e public.domain_events%rowtype;
  m record;
  p public.notification_preferences%rowtype;
  t public.notification_templates%rowtype;
  v_title text;
  v_body text;
  v_priority text;
  v_link text;
  v_email_notification uuid;
  v_quiet_until timestamptz;
  v_total integer := 0;
begin
  select * into c from public.notification_event_consumptions where id=p_consumption_id for update;
  if not found or c.status <> 'processing' then raise exception 'notification consumption is not claimed' using errcode = '23514'; end if;
  select * into e from public.domain_events where id=c.domain_event_id;
  if not found or e.organization_id <> c.organization_id then raise exception 'notification event belongs to another organization' using errcode = '23514'; end if;
  v_priority := case when e.event_type like '%.overdue' then 'high' when e.event_type in ('assessment.completed','risk.changed') then 'normal' else 'low' end;
  v_link := '/org/' || e.organization_id || '/dashboard';
  select * into t from public.notification_templates where organization_id=e.organization_id and event_type=e.event_type and channel='in_app' and status='approved' order by version_number desc limit 1;
  v_title := coalesce(t.title_template, 'Actualización en Securia360');
  v_body := coalesce(t.body_template, 'Hay una actualización disponible en tu organización.');
  for m in select user_id from public.organization_members where organization_id=e.organization_id and status='active' loop
    select * into p from public.notification_preferences where organization_id=e.organization_id and user_id=m.user_id;
    if coalesce(p.in_app_enabled, true) then
      insert into public.notifications(organization_id,domain_event_id,recipient_user_id,channel,priority,title,body,safe_link,status)
      values(e.organization_id,e.id,m.user_id,'in_app',v_priority,v_title,v_body,v_link,'delivered')
      on conflict(domain_event_id,recipient_user_id,channel) do nothing;
      v_total := v_total + 1;
    end if;
    if coalesce(p.email_enabled, false) then
      select * into t from public.notification_templates where organization_id=e.organization_id and event_type=e.event_type and channel='email' and status='approved' order by version_number desc limit 1;
      v_quiet_until := private.notification_quiet_until(coalesce(p.timezone, 'America/Bogota'), p.quiet_hours_start, p.quiet_hours_end);
      insert into public.notifications(organization_id,domain_event_id,recipient_user_id,channel,priority,title,body,safe_link,status)
      values(e.organization_id,e.id,m.user_id,'email',v_priority,coalesce(t.title_template, v_title),coalesce(t.body_template, v_body),v_link,'queued')
      on conflict(domain_event_id,recipient_user_id,channel) do update set id=public.notifications.id
      returning id into v_email_notification;
      if v_email_notification is not null then
        insert into public.notification_deliveries(notification_id,organization_id,channel,status,available_at)
        values(v_email_notification,e.organization_id,'email','pending',coalesce(v_quiet_until,now()))
        on conflict(notification_id) do nothing;
      end if;
    end if;
  end loop;
  update public.notification_event_consumptions set status='completed', completed_at=now(), locked_at=null, locked_by=null, last_error=null where id=c.id;
  return v_total;
exception when others then
  update public.notification_event_consumptions set status=case when attempt_count >= 8 then 'discarded' else 'failed' end, available_at=now() + make_interval(mins => least(60, power(2, attempt_count)::integer)), completed_at=case when attempt_count >= 8 then now() else null end, locked_at=null, locked_by=null, last_error=left(sqlerrm,500) where id=p_consumption_id;
  return 0;
end;
$$;

create or replace function private.process_notification_events(p_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare c public.notification_event_consumptions%rowtype; v_total integer := 0;
begin
  insert into public.notification_event_consumptions(organization_id,domain_event_id,idempotency_key)
  select e.organization_id,e.id,e.id from public.domain_events e
  where e.event_type in ('organization.created','member.invited','site.created','classification.changed','assessment.completed','risk.changed','document.expiring','task.overdue')
  on conflict(domain_event_id) do nothing;
  for c in select * from private.claim_notification_event_consumptions('notification-cron', p_limit) loop
    v_total := v_total + private.consume_notification_event(c.id);
  end loop;
  return v_total;
end;
$$;

drop policy if exists notification_preferences_read on public.notification_preferences;
drop policy if exists notification_preferences_write on public.notification_preferences;
create policy notification_preferences_owner_read on public.notification_preferences for select to authenticated using (user_id=(select auth.uid()));
create policy notification_preferences_owner_write on public.notification_preferences for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create trigger notification_preferences_timezone before insert or update on public.notification_preferences for each row execute function private.validate_notification_preference();
create trigger notification_preferences_owner_lock before update on public.notification_preferences for each row execute function private.lock_notification_preference();
create trigger notifications_recipient_lock before update on public.notifications for each row execute function private.lock_notification_recipient_update();
create trigger notification_templates_lock before insert or update on public.notification_templates for each row execute function private.lock_notification_template();
create trigger notification_preferences_audit after insert or update on public.notification_preferences for each row execute function private.capture_core_audit();

revoke all on function private.notification_quiet_until(text,time,time), private.validate_notification_preference(), private.lock_notification_preference(), private.lock_notification_recipient_update(), private.lock_notification_template(), private.claim_notification_event_consumptions(text,integer), private.consume_notification_event(uuid), private.process_notification_events(integer) from public,anon,authenticated,service_role;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (select 1 from cron.job where jobname='securia360-process-notification-events') then
    perform cron.schedule('securia360-process-notification-events', '*/5 * * * *', $cron$select private.process_notification_events(50);$cron$);
  end if;
end $$;
notify pgrst, 'reload schema';
