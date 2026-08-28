-- Declarative automation: no SQL, code, webhooks or arbitrary payload interpolation.
alter table public.automation_rules
  add column activated_at timestamptz,
  add column emergency_stopped_at timestamptz,
  add column emergency_stopped_by uuid references auth.users(id) on delete set null;

alter table public.automation_rule_versions
  drop constraint if exists automation_rule_versions_conditions_check,
  add constraint automation_rule_versions_conditions_object_check check (jsonb_typeof(conditions) = 'object');

alter table public.automation_executions
  drop constraint if exists automation_executions_idempotency_key_key,
  drop constraint if exists automation_executions_automation_rule_version_id_domain_event_id_key,
  drop constraint if exists automation_executions_status_check,
  add column attempt_count integer not null default 0 check (attempt_count between 0 and 4),
  add column available_at timestamptz not null default now(),
  add column locked_at timestamptz,
  add column locked_by text,
  add column last_error text check (last_error is null or length(last_error) <= 500),
  add constraint automation_executions_status_check check (status in ('pending','processing','skipped','completed','failed','rate_limited','discarded')),
  add constraint automation_executions_once_per_mode_key unique (automation_rule_version_id, domain_event_id, dry_run);
create index automation_executions_worker_idx on public.automation_executions(status, available_at, created_at) where status in ('pending','failed','rate_limited');

revoke insert, update, delete on public.automation_executions from authenticated;
drop policy if exists automation_executions_write on public.automation_executions;

create or replace function private.validate_automation_definition(p_conditions jsonb, p_action jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_operator text := coalesce(p_conditions->>'operator',''); v_field text := p_conditions->>'field'; v_type text := p_action->>'type';
begin
  if jsonb_typeof(p_conditions) <> 'object' or jsonb_typeof(p_action) <> 'object' then raise exception 'automation definition must be an object' using errcode='22023'; end if;
  if v_operator not in ('always','exists','equals') then raise exception 'unsupported automation condition' using errcode='22023'; end if;
  if v_operator in ('exists','equals') and (v_field is null or v_field !~ '^[a-z][a-z0-9_]{1,79}$') then raise exception 'unsupported automation payload field' using errcode='22023'; end if;
  if v_operator = 'equals' and not (p_conditions ? 'value') then raise exception 'equals condition requires a value' using errcode='22023'; end if;
  if v_type = 'record_only' and p_action = jsonb_build_object('type','record_only') then return; end if;
  if v_type = 'create_task' and jsonb_typeof(p_action) = 'object' and coalesce(length(btrim(p_action->>'title')),0) between 3 and 180 and coalesce(p_action->>'priority','medium') in ('low','medium','high','critical') and (p_action->>'description' is null or length(p_action->>'description') <= 2000) then return; end if;
  raise exception 'unsupported automation action' using errcode='22023';
end; $$;

create or replace function private.automation_conditions_match(p_conditions jsonb, p_payload jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_operator text := p_conditions->>'operator'; v_field text := p_conditions->>'field';
begin
  if v_operator = 'always' then return true; end if;
  if v_operator = 'exists' then return p_payload ? v_field; end if;
  if v_operator = 'equals' then return p_payload -> v_field = p_conditions -> 'value'; end if;
  return false;
end; $$;

create or replace function private.validate_automation_row()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'automation_rule_versions' then
    perform private.validate_automation_definition(new.conditions, new.action);
    if tg_op = 'UPDATE' and old.status in ('approved','archived') then raise exception 'approved or archived automation versions are immutable' using errcode='23514'; end if;
    if new.status = 'approved' and not private.has_permission(new.organization_id,'automations.approve') then raise exception 'automation approval permission is required' using errcode='42501'; end if;
    if new.status = 'approved' then new.approved_at := now(); new.approved_by := (select auth.uid()); end if;
  elsif tg_table_name = 'automation_rules' then
    if tg_op = 'UPDATE' and new.organization_id <> old.organization_id then raise exception 'automation organization is immutable' using errcode='23514'; end if;
    if new.status = 'emergency_stopped' and old.status <> 'emergency_stopped' then
      if not private.has_permission(new.organization_id,'automations.approve') then raise exception 'emergency stop approval permission is required' using errcode='42501'; end if;
      new.emergency_stopped_at := now(); new.emergency_stopped_by := (select auth.uid());
    end if;
    if new.status = 'active' and old.status <> 'active' then new.activated_at := now(); end if;
  end if;
  return new;
end; $$;

drop trigger if exists automation_versions_validate_definition on public.automation_rule_versions;
drop trigger if exists automation_rules_validate_transition on public.automation_rules;
create trigger automation_versions_validate_definition before insert or update on public.automation_rule_versions for each row execute function private.validate_automation_row();
create trigger automation_rules_validate_transition before update on public.automation_rules for each row execute function private.validate_automation_row();
create trigger automation_rules_audit after insert or update on public.automation_rules for each row execute function private.capture_core_audit();
create trigger automation_versions_audit after insert or update on public.automation_rule_versions for each row execute function private.capture_core_audit();

create or replace function private.claim_automation_executions(p_worker_id text, p_limit integer default 50)
returns setof public.automation_executions language plpgsql security definer set search_path = '' as $$
begin
  if p_limit < 1 or p_limit > 100 then raise exception 'invalid automation batch size' using errcode='22023'; end if;
  update public.automation_executions set status='failed', available_at=now(), locked_at=null, locked_by=null, last_error='worker lease expired'
  where status='processing' and locked_at < now() - interval '15 minutes';
  return query with claimed as (
    select id from public.automation_executions where status in ('pending','failed','rate_limited') and available_at <= now() and dry_run=false order by available_at, created_at for update skip locked limit p_limit
  ) update public.automation_executions e set status='processing', locked_at=now(), locked_by=p_worker_id, attempt_count=e.attempt_count+1, started_at=now() from claimed where e.id=claimed.id returning e.*;
end; $$;

create or replace function private.run_automation_execution(p_execution_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare x public.automation_executions%rowtype; r public.automation_rule_versions%rowtype; rule public.automation_rules%rowtype; e public.domain_events%rowtype; v_count integer; v_task uuid;
begin
  select * into x from public.automation_executions where id=p_execution_id for update;
  if not found or x.status <> 'processing' then raise exception 'automation execution is not claimed' using errcode='23514'; end if;
  select * into r from public.automation_rule_versions where id=x.automation_rule_version_id;
  select * into rule from public.automation_rules where id=r.automation_rule_id for update;
  select * into e from public.domain_events where id=x.domain_event_id;
  if rule.status <> 'active' or r.status <> 'approved' or r.event_type <> e.event_type or not private.automation_conditions_match(r.conditions,e.payload) then
    update public.automation_executions set status='skipped', completed_at=now(), locked_at=null, locked_by=null, result=jsonb_build_object('reason','rule_not_applicable') where id=x.id; return x.id;
  end if;
  select count(*) into v_count from public.automation_executions where automation_rule_version_id=r.id and started_at >= date_trunc('hour',now()) and status in ('processing','completed','pending','failed','rate_limited');
  if v_count > rule.max_executions_per_hour then
    update public.automation_executions set status='rate_limited', available_at=date_trunc('hour',now()) + interval '1 hour', locked_at=null, locked_by=null, last_error='hourly limit reached' where id=x.id; return x.id;
  end if;
  if r.action->>'type' = 'create_task' then
    insert into public.tasks(organization_id,title,description,priority,created_by)
    values(rule.organization_id,r.action->>'title',nullif(r.action->>'description',''),coalesce(r.action->>'priority','medium'),r.approved_by) returning id into v_task;
  end if;
  update public.automation_executions set status='completed', completed_at=now(), locked_at=null, locked_by=null, last_error=null, result=jsonb_build_object('action',r.action->>'type','task_id',v_task) where id=x.id;
  return x.id;
exception when others then
  update public.automation_executions set status=case when attempt_count >= 4 then 'discarded' else 'failed' end, available_at=case attempt_count when 1 then now()+interval '1 minute' when 2 then now()+interval '5 minutes' else now()+interval '30 minutes' end, completed_at=case when attempt_count >= 4 then now() else null end, locked_at=null, locked_by=null, last_error=left(sqlerrm,500) where id=p_execution_id;
  return p_execution_id;
end; $$;

create or replace function private.enqueue_automation_executions(p_limit integer default 100)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_inserted integer;
begin
  insert into public.automation_executions(organization_id,automation_rule_version_id,domain_event_id,idempotency_key,dry_run,status,result)
  select r.organization_id,v.id,e.id,gen_random_uuid(),false,'pending','{}'::jsonb
  from public.domain_events e join public.automation_rule_versions v on v.organization_id=e.organization_id and v.event_type=e.event_type and v.status='approved'
  join public.automation_rules r on r.id=v.automation_rule_id and r.status='active'
  where e.occurred_at >= coalesce(r.activated_at,now()) and private.automation_conditions_match(v.conditions,e.payload)
  order by e.occurred_at limit p_limit on conflict(automation_rule_version_id,domain_event_id,dry_run) do nothing;
  get diagnostics v_inserted = row_count; return v_inserted;
end; $$;

create or replace function private.process_automation_executions(p_limit integer default 50)
returns integer language plpgsql security definer set search_path = '' as $$
declare x public.automation_executions%rowtype; v_total integer := 0;
begin
  perform private.enqueue_automation_executions(p_limit * 2);
  for x in select * from private.claim_automation_executions('automation-cron',p_limit) loop perform private.run_automation_execution(x.id); v_total := v_total + 1; end loop;
  return v_total;
end; $$;

create or replace function public.list_automation_event_candidates(p_organization_id uuid, p_limit integer default 30)
returns table(id uuid,event_type text,occurred_at timestamptz) language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not private.has_permission(p_organization_id,'automations.manage') then raise exception 'automation management permission is required' using errcode='42501'; end if;
  return query select e.id,e.event_type,e.occurred_at from public.domain_events e where e.organization_id=p_organization_id order by e.occurred_at desc limit least(greatest(p_limit,1),100);
end; $$;

create or replace function public.request_automation_dry_run(p_rule_version_id uuid, p_event_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r public.automation_rule_versions%rowtype; e public.domain_events%rowtype; x uuid;
begin
  select * into r from public.automation_rule_versions where id=p_rule_version_id; select * into e from public.domain_events where id=p_event_id;
  if not found or r.organization_id <> e.organization_id or (select auth.uid()) is null or not private.has_permission(r.organization_id,'automations.manage') then raise exception 'automation dry-run is not authorized' using errcode='42501'; end if;
  if r.status <> 'approved' then raise exception 'only approved automation versions can be tested' using errcode='23514'; end if;
  insert into public.automation_executions(organization_id,automation_rule_version_id,domain_event_id,idempotency_key,dry_run,status,result,completed_at)
  values(r.organization_id,r.id,e.id,gen_random_uuid(),true,'skipped',jsonb_build_object('dry_run',true,'matched',r.event_type=e.event_type and private.automation_conditions_match(r.conditions,e.payload),'action',r.action->>'type'),now())
  on conflict(automation_rule_version_id,domain_event_id,dry_run) do update set result=excluded.result,started_at=now(),completed_at=now() returning id into x;
  return x;
end; $$;

create or replace function public.retry_automation_execution(p_execution_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare x public.automation_executions%rowtype;
begin
  select * into x from public.automation_executions where id=p_execution_id for update;
  if not found or (select auth.uid()) is null or not private.has_permission(x.organization_id,'automations.approve') then raise exception 'automation retry is not authorized' using errcode='42501'; end if;
  if x.dry_run or x.status not in ('failed','rate_limited','discarded') then raise exception 'automation execution cannot be retried' using errcode='23514'; end if;
  update public.automation_executions set status='pending',attempt_count=0,available_at=now(),completed_at=null,last_error=null,locked_at=null,locked_by=null where id=x.id;
end; $$;

grant execute on function public.list_automation_event_candidates(uuid,integer), public.request_automation_dry_run(uuid,uuid), public.retry_automation_execution(uuid) to authenticated;
revoke all on function private.validate_automation_definition(jsonb,jsonb), private.automation_conditions_match(jsonb,jsonb), private.validate_automation_row(), private.claim_automation_executions(text,integer), private.run_automation_execution(uuid), private.enqueue_automation_executions(integer), private.process_automation_executions(integer) from public,anon,authenticated,service_role;
revoke all on function public.list_automation_event_candidates(uuid,integer), public.request_automation_dry_run(uuid,uuid), public.retry_automation_execution(uuid) from anon;

do $$ begin
  if not exists(select 1 from cron.job where jobname='securia360-process-automations') then perform cron.schedule('securia360-process-automations','*/5 * * * *',$cron$select private.process_automation_executions(50);$cron$); end if;
end $$;
notify pgrst,'reload schema';
