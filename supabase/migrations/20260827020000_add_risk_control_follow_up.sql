-- ETAPA 18: structured, tenant-safe follow-up for the hierarchy of risk controls.
alter table public.risk_controls
  add column task_id uuid references public.tasks(id) on delete set null,
  add column improvement_action_id uuid references public.improvement_actions(id) on delete set null,
  add column next_verification_at date,
  add column last_verified_at timestamptz,
  add column last_verified_by uuid references auth.users(id) on delete set null,
  add column verification_status text not null default 'pending'
    check (verification_status in ('pending','effective','partially_effective','ineffective'));

alter table public.risk_controls
  add constraint risk_controls_effectiveness_check
  check (effectiveness is null or effectiveness in ('effective','partially_effective','ineffective'));

create table public.risk_control_verifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  risk_control_id uuid not null references public.risk_controls(id) on delete restrict,
  effectiveness text not null check (effectiveness in ('effective','partially_effective','ineffective')),
  verification_note text not null check (btrim(verification_note) <> ''),
  evidence_document_version_id uuid references public.document_versions(id) on delete restrict,
  next_verification_at date,
  verified_at timestamptz not null default now(),
  verified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.risk_control_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  risk_control_id uuid not null references public.risk_controls(id) on delete restrict,
  alert_type text not null check (alert_type in ('overdue','ineffective')),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (risk_control_id, alert_type)
);

create index risk_controls_org_follow_up_idx
  on public.risk_controls(organization_id, status, target_date, next_verification_at);
create index risk_control_verifications_org_control_idx
  on public.risk_control_verifications(organization_id, risk_control_id, verified_at desc);
create index risk_control_alerts_org_open_idx
  on public.risk_control_alerts(organization_id, alert_type, detected_at desc)
  where resolved_at is null;

create or replace function private.validate_risk_control_follow_up()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'risk_controls' then
    if new.task_id is not null and not exists (
      select 1 from public.tasks where id = new.task_id and organization_id = new.organization_id
    ) then
      raise exception 'risk control task belongs to another organization' using errcode = '23514';
    end if;
    if new.improvement_action_id is not null and not exists (
      select 1 from public.improvement_actions where id = new.improvement_action_id and organization_id = new.organization_id
    ) then
      raise exception 'risk control improvement action belongs to another organization' using errcode = '23514';
    end if;
  elsif tg_table_name = 'risk_control_verifications' then
    if not exists (
      select 1 from public.risk_controls where id = new.risk_control_id and organization_id = new.organization_id
    ) then
      raise exception 'risk control verification belongs to another organization' using errcode = '23514';
    end if;
    if new.evidence_document_version_id is not null and not exists (
      select 1 from public.document_versions where id = new.evidence_document_version_id and organization_id = new.organization_id
    ) then
      raise exception 'risk control verification evidence belongs to another organization' using errcode = '23514';
    end if;
    if not private.has_permission(new.organization_id, 'risks.validate') then
      raise exception 'insufficient permission to verify risk controls' using errcode = '42501';
    end if;
    if new.verified_by is null then
      new.verified_by := (select auth.uid());
    elsif new.verified_by is distinct from (select auth.uid()) then
      raise exception 'a verification must identify the authenticated verifier' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.protect_risk_control_verification_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'risk control verifications are append-only' using errcode = '42501';
end;
$$;

create or replace function private.prevent_direct_risk_control_verification_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.effectiveness is not null then
    raise exception 'record effectiveness through a risk control verification' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE'
    and pg_trigger_depth() = 1
    and (
      new.effectiveness is distinct from old.effectiveness
      or new.verification_status is distinct from old.verification_status
      or new.last_verified_at is distinct from old.last_verified_at
      or new.last_verified_by is distinct from old.last_verified_by
    ) then
    raise exception 'record verification state through a risk control verification' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.refresh_risk_control_alerts(
  p_risk_control_id uuid,
  p_as_of date default current_date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  control_row public.risk_controls%rowtype;
  alert_kind text;
  should_be_open boolean;
begin
  select * into control_row from public.risk_controls where id = p_risk_control_id;
  if not found then return; end if;

  foreach alert_kind in array array['overdue', 'ineffective'] loop
    should_be_open := case alert_kind
      when 'overdue' then control_row.target_date is not null
        and control_row.target_date < p_as_of
        and control_row.status not in ('retired')
      else control_row.effectiveness = 'ineffective' or control_row.verification_status = 'ineffective'
    end;

    if should_be_open then
      insert into public.risk_control_alerts (organization_id, risk_control_id, alert_type, detected_at, resolved_at)
      values (control_row.organization_id, control_row.id, alert_kind, now(), null)
      on conflict (risk_control_id, alert_type) do update
        set detected_at = case when public.risk_control_alerts.resolved_at is null then public.risk_control_alerts.detected_at else excluded.detected_at end,
            resolved_at = null,
            updated_at = now();
    else
      update public.risk_control_alerts
      set resolved_at = coalesce(resolved_at, now()), updated_at = now()
      where risk_control_id = control_row.id and alert_type = alert_kind and resolved_at is null;
    end if;
  end loop;
end;
$$;

create or replace function private.apply_risk_control_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.risk_controls
  set effectiveness = new.effectiveness,
      verification_status = new.effectiveness,
      last_verified_at = new.verified_at,
      last_verified_by = new.verified_by,
      next_verification_at = new.next_verification_at,
      status = case when new.effectiveness = 'ineffective' then 'ineffective' else 'implemented' end
  where id = new.risk_control_id and organization_id = new.organization_id;
  perform private.refresh_risk_control_alerts(new.risk_control_id);
  return new;
end;
$$;

create or replace function private.refresh_risk_control_alerts_on_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.refresh_risk_control_alerts(new.id);
  return new;
end;
$$;

revoke all on function private.validate_risk_control_follow_up(), private.protect_risk_control_verification_history(), private.prevent_direct_risk_control_verification_state(), private.refresh_risk_control_alerts(uuid, date), private.apply_risk_control_verification(), private.refresh_risk_control_alerts_on_change() from public, anon, authenticated, service_role;

alter table public.risk_control_verifications enable row level security;
alter table public.risk_control_alerts enable row level security;
grant select, insert on public.risk_control_verifications to authenticated;
grant select on public.risk_control_alerts to authenticated;

create policy risk_control_verifications_read on public.risk_control_verifications for select to authenticated
  using ((select private.has_permission(organization_id, 'risks.read')));
create policy risk_control_verifications_insert on public.risk_control_verifications for insert to authenticated
  with check ((select private.has_permission(organization_id, 'risks.validate')));
create policy risk_control_alerts_read on public.risk_control_alerts for select to authenticated
  using ((select private.has_permission(organization_id, 'risks.read')));

create trigger risk_controls_validate_follow_up
  before insert or update on public.risk_controls
  for each row execute function private.validate_risk_control_follow_up();
create trigger risk_controls_protect_verification_state
  before insert or update on public.risk_controls
  for each row execute function private.prevent_direct_risk_control_verification_state();
create trigger risk_controls_refresh_alerts
  after insert or update on public.risk_controls
  for each row execute function private.refresh_risk_control_alerts_on_change();
create trigger risk_control_verifications_validate_links
  before insert on public.risk_control_verifications
  for each row execute function private.validate_risk_control_follow_up();
create trigger risk_control_verifications_immutable
  before update or delete on public.risk_control_verifications
  for each row execute function private.protect_risk_control_verification_history();
create trigger risk_control_verifications_apply
  after insert on public.risk_control_verifications
  for each row execute function private.apply_risk_control_verification();
create trigger risk_control_verifications_audit
  after insert on public.risk_control_verifications
  for each row execute function private.capture_core_audit();
create trigger risk_control_alerts_updated
  before update on public.risk_control_alerts
  for each row execute function private.set_updated_at();
create trigger risk_control_alerts_audit
  after insert or update on public.risk_control_alerts
  for each row execute function private.capture_core_audit();

notify pgrst, 'reload schema';
