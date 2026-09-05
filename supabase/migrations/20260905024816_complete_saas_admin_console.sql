-- Complete the internal commercial console without coupling commercial state to tenant RBAC.

-- The legacy audit trigger treated a global plan id as an organization id. Remove it
-- before backfilling versions; it is replaced below by the internal audit ledger.
drop trigger if exists billing_plans_audit on public.billing_plans;
drop trigger if exists billing_plan_immutable on public.billing_plans;

create table public.billing_plan_versions (
  id uuid primary key default gen_random_uuid(),
  billing_plan_id uuid not null references public.billing_plans(id) on delete restrict,
  version integer not null check (version > 0),
  name_snapshot text not null check (length(trim(name_snapshot)) between 2 and 120),
  limits jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object'),
  feature_flags jsonb not null default '{}'::jsonb check (jsonb_typeof(feature_flags) = 'object'),
  status text not null default 'draft' check (status in ('draft','published','superseded','archived')),
  created_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (billing_plan_id, version),
  unique (id, billing_plan_id),
  check ((status = 'published' and published_at is not null and published_by is not null) or status <> 'published')
);

create unique index billing_plan_versions_one_draft_idx
  on public.billing_plan_versions(billing_plan_id) where status = 'draft';
create unique index billing_plan_versions_one_published_idx
  on public.billing_plan_versions(billing_plan_id) where status = 'published';
create index billing_plan_versions_status_idx on public.billing_plan_versions(status, created_at desc);

alter table public.billing_plans add column current_version_id uuid;
alter table public.billing_subscriptions add column billing_plan_version_id uuid;

insert into public.billing_plan_versions(
  billing_plan_id, version, name_snapshot, limits, feature_flags, status,
  created_by, published_by, published_at
)
select id, version, name, limits, feature_flags,
  case when status = 'active' then 'published' else status end,
  null,
  case when status = 'active' then (
    select user_id from public.saas_admin_roles
    where role = 'saas_admin' and status = 'active' order by created_at limit 1
  ) else null end,
  case when status = 'active' then created_at else null end
from public.billing_plans;

-- A published version requires an attributable human. If an old active plan predates
-- the internal role ledger, preserve it as a draft until a real administrator publishes it.
update public.billing_plan_versions
set status = 'draft', published_at = null
where status = 'published' and published_by is null;

update public.billing_plans p
set current_version_id = v.id
from public.billing_plan_versions v
where v.billing_plan_id = p.id
  and v.version = p.version;

update public.billing_subscriptions s
set billing_plan_version_id = p.current_version_id
from public.billing_plans p
where p.id = s.billing_plan_id;

alter table public.billing_plans
  add constraint billing_plans_current_version_fk
  foreign key (current_version_id, id)
  references public.billing_plan_versions(id, billing_plan_id)
  on delete restrict;

alter table public.billing_subscriptions
  alter column billing_plan_version_id set not null,
  add constraint billing_subscriptions_plan_version_fk
  foreign key (billing_plan_version_id, billing_plan_id)
  references public.billing_plan_versions(id, billing_plan_id)
  on delete restrict;

create table public.billing_reconciliations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  billing_subscription_id uuid not null references public.billing_subscriptions(id) on delete restrict,
  reference text not null check (length(trim(reference)) between 2 and 160),
  occurred_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','matched','exception','voided')),
  note text check (note is null or length(note) <= 2000),
  recorded_by uuid not null references auth.users(id) on delete restrict,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference),
  check (
    (status in ('matched','voided') and resolved_by is not null and resolved_at is not null)
    or (status in ('pending','exception') and resolved_by is null and resolved_at is null)
  )
);

create index billing_reconciliations_queue_idx
  on public.billing_reconciliations(status, occurred_at desc);
create index billing_reconciliations_subscription_idx
  on public.billing_reconciliations(billing_subscription_id, created_at desc);

create or replace function private.validate_saas_commercial_links()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'billing_reconciliations' and not exists (
    select 1 from public.billing_subscriptions s
    where s.id = new.billing_subscription_id and s.organization_id = new.organization_id
  ) then
    raise exception 'reconciliation belongs to another organization' using errcode = '23514';
  end if;
  return new;
end; $$;

create or replace function private.validate_billing_links()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'billing_usage_periods' and not exists (
    select 1 from public.billing_subscriptions
    where id = new.billing_subscription_id and organization_id = new.organization_id
  ) then
    raise exception 'billing period belongs to another organization' using errcode = '23514';
  end if;
  if tg_table_name = 'saas_support_sessions' and not exists (
    select 1 from public.saas_admin_roles
    where user_id = new.reinova_admin_user_id and status = 'active'
      and role in ('saas_admin','saas_support')
  ) then
    raise exception 'support user is not an active internal operator' using errcode = '42501';
  end if;
  return new;
end; $$;

create or replace function private.prevent_saas_history_mutation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'commercial history is immutable' using errcode = '55000';
  end if;
  if tg_table_name = 'billing_plan_versions' and old.status <> 'draft' then
    if not (
      old.status = 'published' and new.status = 'superseded'
      and new.billing_plan_id = old.billing_plan_id
      and new.version = old.version
      and new.name_snapshot = old.name_snapshot
      and new.limits = old.limits
      and new.feature_flags = old.feature_flags
      and new.created_by is not distinct from old.created_by
      and new.published_by is not distinct from old.published_by
      and new.published_at is not distinct from old.published_at
    ) then
      raise exception 'published plan version is immutable' using errcode = '55000';
    end if;
  end if;
  if tg_table_name = 'billing_reconciliations' and old.status in ('matched','voided') then
    raise exception 'resolved reconciliation is immutable' using errcode = '55000';
  end if;
  return new;
end; $$;

create or replace function private.capture_saas_commercial_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_new jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_old jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_id uuid := coalesce((v_new->>'id')::uuid, (v_old->>'id')::uuid);
begin
  insert into public.saas_admin_audit(actor_user_id, action, entity_type, entity_id, before_data, after_data)
  values (auth.uid(), lower(tg_op), tg_table_name, v_id, v_old, v_new);
  return coalesce(new, old);
end; $$;

create or replace function private.assert_saas_json(p_limits jsonb, p_flags jsonb)
returns void language plpgsql immutable set search_path = '' as $$
declare v_key text; v_value jsonb;
begin
  if jsonb_typeof(p_limits) <> 'object' or jsonb_typeof(p_flags) <> 'object' then
    raise exception 'limits and feature flags must be objects' using errcode = '22023';
  end if;
  for v_key, v_value in select * from jsonb_each(p_limits) loop
    if v_key not in ('members','sites','storage_mb')
      or jsonb_typeof(v_value) <> 'number'
      or (v_value #>> '{}')::numeric < 0
      or trunc((v_value #>> '{}')::numeric) <> (v_value #>> '{}')::numeric then
      raise exception 'unsupported or invalid plan limit' using errcode = '22023';
    end if;
  end loop;
  for v_key, v_value in select * from jsonb_each(p_flags) loop
    if v_key not in ('copilot','automations','imports','analytics','mobile')
      or jsonb_typeof(v_value) <> 'boolean' then
      raise exception 'unsupported or invalid feature flag' using errcode = '22023';
    end if;
  end loop;
end; $$;

create or replace function public.create_saas_billing_plan(
  p_code text, p_name text, p_limits jsonb default '{}'::jsonb,
  p_feature_flags jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_plan_id uuid; v_version_id uuid;
begin
  if not private.is_saas_admin(false) then
    raise exception 'saas administration access required' using errcode = '42501';
  end if;
  if coalesce(trim(p_code),'') !~ '^[A-Z0-9][A-Z0-9_-]{1,29}$'
    or length(trim(coalesce(p_name,''))) not between 2 and 120 then
    raise exception 'invalid plan identity' using errcode = '22023';
  end if;
  perform private.assert_saas_json(p_limits, p_feature_flags);
  insert into public.billing_plans(code,name,status,limits,feature_flags,version)
  values(upper(trim(p_code)),trim(p_name),'draft',p_limits,p_feature_flags,1)
  returning id into v_plan_id;
  insert into public.billing_plan_versions(
    billing_plan_id,version,name_snapshot,limits,feature_flags,status,created_by
  ) values(v_plan_id,1,trim(p_name),p_limits,p_feature_flags,'draft',auth.uid())
  returning id into v_version_id;
  update public.billing_plans set current_version_id=v_version_id where id=v_plan_id;
  return v_plan_id;
end; $$;

create or replace function public.create_saas_billing_plan_version(
  p_plan_id uuid, p_name text, p_limits jsonb, p_feature_flags jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_version integer; v_id uuid;
begin
  if not private.is_saas_admin(false) then
    raise exception 'saas administration access required' using errcode = '42501';
  end if;
  if not exists(select 1 from public.billing_plans where id=p_plan_id and status <> 'archived')
    or length(trim(coalesce(p_name,''))) not between 2 and 120 then
    raise exception 'invalid plan version' using errcode = '22023';
  end if;
  perform private.assert_saas_json(p_limits,p_feature_flags);
  select coalesce(max(version),0)+1 into v_version
  from public.billing_plan_versions where billing_plan_id=p_plan_id;
  insert into public.billing_plan_versions(
    billing_plan_id,version,name_snapshot,limits,feature_flags,status,created_by
  ) values(p_plan_id,v_version,trim(p_name),p_limits,p_feature_flags,'draft',auth.uid())
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.publish_saas_billing_plan_version(p_version_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_version public.billing_plan_versions%rowtype;
begin
  if not private.is_saas_admin(false) then
    raise exception 'saas administration access required' using errcode = '42501';
  end if;
  select * into v_version from public.billing_plan_versions where id=p_version_id for update;
  if v_version.id is null or v_version.status <> 'draft' then
    raise exception 'only a draft version can be published' using errcode = '23514';
  end if;
  update public.billing_plan_versions set status='superseded',updated_at=now()
  where billing_plan_id=v_version.billing_plan_id and status='published';
  update public.billing_plan_versions
  set status='published',published_by=auth.uid(),published_at=now(),updated_at=now()
  where id=p_version_id;
  update public.billing_plans
  set name=v_version.name_snapshot,limits=v_version.limits,feature_flags=v_version.feature_flags,
      version=v_version.version,status='active',current_version_id=p_version_id,updated_at=now()
  where id=v_version.billing_plan_id;
  return p_version_id;
end; $$;

create or replace function public.archive_saas_billing_plan(p_plan_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_saas_admin(false) then
    raise exception 'saas administration access required' using errcode = '42501';
  end if;
  update public.billing_plans set status='archived',updated_at=now()
  where id=p_plan_id and status <> 'archived';
  if not found then raise exception 'plan cannot be archived' using errcode='23514'; end if;
  return p_plan_id;
end; $$;

create or replace function public.manage_saas_subscription_v2(
  p_organization_id uuid, p_plan_version_id uuid, p_status text,
  p_trial_ends_at timestamptz, p_period_start timestamptz, p_period_end timestamptz,
  p_customer_reference text default null, p_subscription_reference text default null,
  p_note text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_plan_id uuid;
begin
  if not private.is_saas_admin(false) then
    raise exception 'saas administration access required' using errcode = '42501';
  end if;
  select billing_plan_id into v_plan_id from public.billing_plan_versions
  where id=p_plan_version_id and status='published';
  if v_plan_id is null or p_status not in ('trialing','active','past_due','suspended','cancelled') then
    raise exception 'invalid commercial subscription' using errcode='22023';
  end if;
  if p_period_start is not null and (p_period_end is null or p_period_end <= p_period_start) then
    raise exception 'invalid billing period' using errcode='22023';
  end if;
  insert into public.billing_subscriptions(
    organization_id,billing_plan_id,billing_plan_version_id,status,trial_ends_at,
    current_period_start,current_period_end,provider_customer_reference,
    provider_subscription_reference,commercial_note
  ) values(
    p_organization_id,v_plan_id,p_plan_version_id,p_status,p_trial_ends_at,
    p_period_start,p_period_end,nullif(left(trim(coalesce(p_customer_reference,'')),160),''),
    nullif(left(trim(coalesce(p_subscription_reference,'')),160),''),
    nullif(left(trim(coalesce(p_note,'')),2000),'')
  ) on conflict(organization_id) do update set
    billing_plan_id=excluded.billing_plan_id,
    billing_plan_version_id=excluded.billing_plan_version_id,
    status=excluded.status,trial_ends_at=excluded.trial_ends_at,
    current_period_start=excluded.current_period_start,current_period_end=excluded.current_period_end,
    provider_customer_reference=excluded.provider_customer_reference,
    provider_subscription_reference=excluded.provider_subscription_reference,
    commercial_note=excluded.commercial_note,updated_at=now()
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.record_saas_reconciliation(
  p_subscription_id uuid, p_reference text, p_occurred_at timestamptz,
  p_status text default 'pending', p_note text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_organization_id uuid;
begin
  if not private.is_saas_admin(false) then
    raise exception 'saas administration access required' using errcode='42501';
  end if;
  select organization_id into v_organization_id from public.billing_subscriptions where id=p_subscription_id;
  if v_organization_id is null or p_status not in ('pending','exception')
    or length(trim(coalesce(p_reference,''))) not between 2 and 160 then
    raise exception 'invalid reconciliation' using errcode='22023';
  end if;
  insert into public.billing_reconciliations(
    organization_id,billing_subscription_id,reference,occurred_at,status,note,recorded_by
  ) values(v_organization_id,p_subscription_id,trim(p_reference),p_occurred_at,p_status,
    nullif(left(trim(coalesce(p_note,'')),2000),''),auth.uid()) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.resolve_saas_reconciliation(
  p_reconciliation_id uuid, p_status text, p_note text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not private.is_saas_admin(false) then
    raise exception 'saas administration access required' using errcode='42501';
  end if;
  if p_status not in ('matched','voided') or length(trim(coalesce(p_note,''))) < 3 then
    raise exception 'invalid reconciliation resolution' using errcode='22023';
  end if;
  update public.billing_reconciliations set status=p_status,note=left(trim(p_note),2000),
    resolved_by=auth.uid(),resolved_at=now(),updated_at=now()
  where id=p_reconciliation_id and status in ('pending','exception') returning id into v_id;
  if v_id is null then raise exception 'reconciliation transition is invalid' using errcode='23514'; end if;
  return v_id;
end; $$;

alter table public.billing_plan_versions enable row level security;
alter table public.billing_reconciliations enable row level security;

drop policy if exists billing_plans_read on public.billing_plans;
create policy billing_plans_read on public.billing_plans for select to authenticated using (
  private.is_saas_admin(true) or exists (
    select 1 from public.billing_subscriptions s
    where s.billing_plan_id=billing_plans.id and private.has_permission(s.organization_id,'billing.read')
  )
);
create policy billing_plan_versions_read on public.billing_plan_versions for select to authenticated using (
  private.is_saas_admin(true) or exists (
    select 1 from public.billing_subscriptions s
    where s.billing_plan_version_id=billing_plan_versions.id
      and private.has_permission(s.organization_id,'billing.read')
  )
);
create policy billing_reconciliations_admin_read on public.billing_reconciliations
  for select to authenticated using (private.is_saas_admin(false));

revoke all on public.billing_plan_versions, public.billing_reconciliations from public,anon,authenticated;
grant select on public.billing_plan_versions to authenticated;
grant select on public.billing_reconciliations to authenticated;

create trigger billing_plan_immutable before update on public.billing_plans
  for each row execute function private.prevent_billing_history_mutation();
create trigger billing_plan_versions_immutable before update or delete on public.billing_plan_versions
  for each row execute function private.prevent_saas_history_mutation();
create trigger billing_reconciliations_immutable before update or delete on public.billing_reconciliations
  for each row execute function private.prevent_saas_history_mutation();
create trigger billing_reconciliations_links before insert or update on public.billing_reconciliations
  for each row execute function private.validate_saas_commercial_links();
create trigger billing_plan_versions_updated before update on public.billing_plan_versions
  for each row execute function private.set_updated_at();
create trigger billing_reconciliations_updated before update on public.billing_reconciliations
  for each row execute function private.set_updated_at();

create trigger billing_plans_internal_audit after insert or update on public.billing_plans
  for each row execute function private.capture_saas_commercial_audit();
create trigger billing_plan_versions_internal_audit after insert or update on public.billing_plan_versions
  for each row execute function private.capture_saas_commercial_audit();
create trigger billing_subscriptions_internal_audit after insert or update on public.billing_subscriptions
  for each row execute function private.capture_saas_commercial_audit();
create trigger billing_reconciliations_internal_audit after insert or update on public.billing_reconciliations
  for each row execute function private.capture_saas_commercial_audit();
create trigger billing_support_internal_audit after insert or update on public.saas_support_sessions
  for each row execute function private.capture_saas_commercial_audit();

revoke all on function private.validate_saas_commercial_links(),
  private.prevent_saas_history_mutation(),private.capture_saas_commercial_audit(),
  private.assert_saas_json(jsonb,jsonb) from public,anon,authenticated,service_role;

revoke all on function public.manage_saas_subscription(uuid,uuid,text,timestamptz,timestamptz,timestamptz,text)
  from public,anon,authenticated;
revoke all on function public.create_saas_billing_plan(text,text,jsonb,jsonb),
  public.create_saas_billing_plan_version(uuid,text,jsonb,jsonb),
  public.publish_saas_billing_plan_version(uuid),public.archive_saas_billing_plan(uuid),
  public.manage_saas_subscription_v2(uuid,uuid,text,timestamptz,timestamptz,timestamptz,text,text,text),
  public.record_saas_reconciliation(uuid,text,timestamptz,text,text),
  public.resolve_saas_reconciliation(uuid,text,text) from public,anon;
grant execute on function public.create_saas_billing_plan(text,text,jsonb,jsonb),
  public.create_saas_billing_plan_version(uuid,text,jsonb,jsonb),
  public.publish_saas_billing_plan_version(uuid),public.archive_saas_billing_plan(uuid),
  public.manage_saas_subscription_v2(uuid,uuid,text,timestamptz,timestamptz,timestamptz,text,text,text),
  public.record_saas_reconciliation(uuid,text,timestamptz,text,text),
  public.resolve_saas_reconciliation(uuid,text,text) to authenticated;

notify pgrst, 'reload schema';
