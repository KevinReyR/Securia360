alter table public.domain_events
  add column status text not null default 'pending' check (status in ('pending','processing','delivered','failed','discarded')),
  add column attempt_count integer not null default 0 check (attempt_count >= 0),
  add column available_at timestamptz not null default now(),
  add column locked_at timestamptz,
  add column locked_by text,
  add column processed_at timestamptz,
  add column last_error text check (last_error is null or length(last_error) <= 500),
  add constraint domain_events_delivery_state_check check (
    (status in ('pending','failed') and processed_at is null)
    or (status = 'processing' and locked_at is not null and locked_by is not null)
    or (status in ('delivered','discarded') and processed_at is not null)
  );
create index domain_events_consumer_idx on public.domain_events(status,available_at,occurred_at) where status in ('pending','failed');

create or replace function private.enqueue_domain_event(
  p_organization_id uuid, p_event_type text, p_aggregate_type text, p_aggregate_id uuid,
  p_payload jsonb default '{}'::jsonb, p_idempotency_key uuid default gen_random_uuid()
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if jsonb_typeof(p_payload) <> 'object' then raise exception 'event payload must be an object' using errcode='22023'; end if;
  insert into public.domain_events(organization_id,event_type,aggregate_type,aggregate_id,payload,idempotency_key,actor_user_id)
  values(p_organization_id,p_event_type,p_aggregate_type,p_aggregate_id,p_payload - 'secret' - 'token' - 'password',p_idempotency_key,(select auth.uid()))
  on conflict(idempotency_key) do update set idempotency_key=excluded.idempotency_key returning id into v_id;
  return v_id;
end; $$;
revoke all on function private.enqueue_domain_event(uuid,text,text,uuid,jsonb,uuid) from public,anon,authenticated,service_role;

create or replace function private.capture_domain_event() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'organizations' and tg_op = 'INSERT' then
    perform private.enqueue_domain_event(new.id,'organization.created','organization',new.id,jsonb_build_object('name',new.name));
  elsif tg_table_name = 'sites' and tg_op = 'INSERT' then
    perform private.enqueue_domain_event(new.organization_id,'site.created','site',new.id,jsonb_build_object('legal_entity_id',new.legal_entity_id));
  elsif tg_table_name = 'organization_members' and tg_op = 'INSERT' and new.status = 'invited' then
    perform private.enqueue_domain_event(new.organization_id,'member.invited','organization_member',new.id,jsonb_build_object('member_id',new.id));
  end if;
  return new;
end; $$;
revoke all on function private.capture_domain_event() from public,anon,authenticated,service_role;
create trigger organizations_enqueue_event after insert on public.organizations for each row execute function private.capture_domain_event();
create trigger sites_enqueue_event after insert on public.sites for each row execute function private.capture_domain_event();
create trigger organization_members_enqueue_event after insert on public.organization_members for each row execute function private.capture_domain_event();

create or replace function private.claim_domain_events(p_worker_id text, p_limit integer default 20)
returns setof public.domain_events language plpgsql security definer set search_path = '' as $$
begin
  if p_limit < 1 or p_limit > 100 then raise exception 'invalid batch size' using errcode='22023'; end if;
  return query with claimed as (
    select id from public.domain_events where status in ('pending','failed') and available_at <= now()
    order by available_at,occurred_at for update skip locked limit p_limit
  ) update public.domain_events e set status='processing',locked_at=now(),locked_by=p_worker_id,attempt_count=e.attempt_count+1
  from claimed where e.id=claimed.id returning e.*;
end; $$;
revoke all on function private.claim_domain_events(text,integer) from public,anon,authenticated,service_role;

comment on table public.domain_events is 'Transactional outbox; consumers claim with SKIP LOCKED and use idempotency_key for exactly-once effect semantics.';
notify pgrst,'reload schema';
