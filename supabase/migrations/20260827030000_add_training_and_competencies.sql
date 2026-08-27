-- ETAPA 20: planning, delivery and traceability of training without duplicating personal data.
create table public.training_catalog (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,80}$'),
  title text not null check (btrim(title) <> ''),
  description text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  validity_days integer check (validity_days is null or validity_days > 0),
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  year integer not null check (year between 2000 and 2200),
  title text not null check (btrim(title) <> ''),
  description text,
  requirement_id uuid references public.requirements(id) on delete restrict,
  minimum_standard_id uuid references public.minimum_standards(id) on delete restrict,
  target_group_label text,
  status text not null default 'draft' check (status in ('draft','active','completed','archived')),
  owner_user_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  training_plan_id uuid not null references public.training_plans(id) on delete restrict,
  training_catalog_id uuid references public.training_catalog(id) on delete set null,
  title text not null check (btrim(title) <> ''),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  capacity integer check (capacity is null or capacity > 0),
  instructor_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','cancelled')),
  evidence_document_version_id uuid references public.document_versions(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  training_session_id uuid not null references public.training_sessions(id) on delete restrict,
  organization_member_id uuid not null references public.organization_members(id) on delete restrict,
  status text not null default 'invited' check (status in ('invited','confirmed','declined','cancelled')),
  invited_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (training_session_id, organization_member_id)
);

create table public.training_attendances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  training_enrollment_id uuid not null references public.training_enrollments(id) on delete restrict,
  status text not null check (status in ('present','absent','excused')),
  checked_at timestamptz not null default now(),
  checked_by uuid references auth.users(id) on delete set null,
  evidence_document_version_id uuid references public.document_versions(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (training_enrollment_id)
);

create table public.training_evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  training_enrollment_id uuid not null references public.training_enrollments(id) on delete restrict,
  score numeric(8,2) not null check (score >= 0),
  maximum_score numeric(8,2) not null check (maximum_score > 0 and score <= maximum_score),
  passed boolean not null,
  evaluated_at timestamptz not null default now(),
  evaluated_by uuid references auth.users(id) on delete set null,
  evidence_document_version_id uuid references public.document_versions(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (training_enrollment_id)
);

create table public.training_certificates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  training_enrollment_id uuid not null references public.training_enrollments(id) on delete restrict,
  certificate_code text not null check (btrim(certificate_code) <> ''),
  issued_at date not null default current_date,
  expires_at date,
  evidence_document_version_id uuid references public.document_versions(id) on delete restrict,
  issued_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (expires_at is null or expires_at >= issued_at),
  unique (organization_id, certificate_code),
  unique (training_enrollment_id)
);

create index training_catalog_org_status_idx on public.training_catalog(organization_id, status);
create index training_plans_org_year_status_idx on public.training_plans(organization_id, year, status);
create index training_sessions_org_start_idx on public.training_sessions(organization_id, starts_at);
create index training_enrollments_org_session_idx on public.training_enrollments(organization_id, training_session_id, status);
create index training_enrollments_member_idx on public.training_enrollments(organization_member_id);
create index training_attendances_enrollment_idx on public.training_attendances(training_enrollment_id);
create index training_evaluations_enrollment_idx on public.training_evaluations(training_enrollment_id);
create index training_certificates_org_expiry_idx on public.training_certificates(organization_id, expires_at) where expires_at is not null;
create index training_plans_requirement_id_idx on public.training_plans(requirement_id);
create index training_plans_minimum_standard_id_idx on public.training_plans(minimum_standard_id);
create index training_plans_owner_user_id_idx on public.training_plans(owner_user_id);
create index training_sessions_plan_id_idx on public.training_sessions(training_plan_id);
create index training_sessions_catalog_id_idx on public.training_sessions(training_catalog_id);
create index training_sessions_instructor_user_id_idx on public.training_sessions(instructor_user_id);
create index training_sessions_evidence_document_version_id_idx on public.training_sessions(evidence_document_version_id);
create index training_attendances_evidence_document_version_id_idx on public.training_attendances(evidence_document_version_id);
create index training_evaluations_evidence_document_version_id_idx on public.training_evaluations(evidence_document_version_id);
create index training_certificates_enrollment_id_idx on public.training_certificates(training_enrollment_id);
create index training_certificates_evidence_document_version_id_idx on public.training_certificates(evidence_document_version_id);

insert into public.permissions(code,module,action,description) values
  ('training.read','training','read','Consultar planes, sesiones y resultados agregados de capacitación.'),
  ('training.manage','training','manage','Gestionar catálogo, planes, sesiones y convocatorias.'),
  ('training.validate','training','validate','Registrar asistencia, evaluación y certificados de capacitación.')
on conflict(code) do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on p.code in ('training.read','training.manage','training.validate')
where r.code='organization_admin' and r.organization_id is null on conflict do nothing;

create or replace function private.validate_training_tenant_links()
returns trigger language plpgsql security definer set search_path='' as $$
declare linked_org uuid;
begin
  if tg_table_name='training_sessions' then
    select organization_id into linked_org from public.training_plans where id=new.training_plan_id;
    if linked_org is null or linked_org<>new.organization_id then raise exception 'training plan belongs to another organization' using errcode='23514'; end if;
    if new.training_catalog_id is not null and not exists(select 1 from public.training_catalog where id=new.training_catalog_id and organization_id=new.organization_id) then raise exception 'training catalog item belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='training_enrollments' then
    if not exists(select 1 from public.training_sessions where id=new.training_session_id and organization_id=new.organization_id) or not exists(select 1 from public.organization_members where id=new.organization_member_id and organization_id=new.organization_id and status='active') then raise exception 'training enrollment belongs to another organization or inactive member' using errcode='23514'; end if;
  elsif tg_table_name in ('training_attendances','training_evaluations','training_certificates') then
    if not exists(select 1 from public.training_enrollments where id=new.training_enrollment_id and organization_id=new.organization_id) then raise exception 'training result belongs to another organization' using errcode='23514'; end if;
  end if;
  if tg_table_name in ('training_sessions','training_attendances','training_evaluations','training_certificates') and new.evidence_document_version_id is not null and not exists(select 1 from public.document_versions where id=new.evidence_document_version_id and organization_id=new.organization_id) then raise exception 'training evidence belongs to another organization' using errcode='23514'; end if;
  return new;
end; $$;
revoke all on function private.validate_training_tenant_links() from public,anon,authenticated,service_role;

alter table public.training_catalog enable row level security;
alter table public.training_plans enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_enrollments enable row level security;
alter table public.training_attendances enable row level security;
alter table public.training_evaluations enable row level security;
alter table public.training_certificates enable row level security;
grant select,insert,update on public.training_catalog,public.training_plans,public.training_sessions,public.training_enrollments to authenticated;
grant select,insert on public.training_attendances,public.training_evaluations,public.training_certificates to authenticated;

create policy training_catalog_read on public.training_catalog for select to authenticated using((select private.has_permission(organization_id,'training.read')));
create policy training_catalog_write on public.training_catalog for all to authenticated using((select private.has_permission(organization_id,'training.manage'))) with check((select private.has_permission(organization_id,'training.manage')));
create policy training_plans_read on public.training_plans for select to authenticated using((select private.has_permission(organization_id,'training.read')));
create policy training_plans_write on public.training_plans for all to authenticated using((select private.has_permission(organization_id,'training.manage'))) with check((select private.has_permission(organization_id,'training.manage')));
create policy training_sessions_read on public.training_sessions for select to authenticated using((select private.has_permission(organization_id,'training.read')));
create policy training_sessions_write on public.training_sessions for all to authenticated using((select private.has_permission(organization_id,'training.manage'))) with check((select private.has_permission(organization_id,'training.manage')));
create policy training_enrollments_read on public.training_enrollments for select to authenticated using((select private.has_permission(organization_id,'training.read')));
create policy training_enrollments_write on public.training_enrollments for all to authenticated using((select private.has_permission(organization_id,'training.manage'))) with check((select private.has_permission(organization_id,'training.manage')));
create policy training_attendances_read on public.training_attendances for select to authenticated using((select private.has_permission(organization_id,'training.read')));
create policy training_attendances_insert on public.training_attendances for insert to authenticated with check((select private.has_permission(organization_id,'training.validate')));
create policy training_evaluations_read on public.training_evaluations for select to authenticated using((select private.has_permission(organization_id,'training.read')));
create policy training_evaluations_insert on public.training_evaluations for insert to authenticated with check((select private.has_permission(organization_id,'training.validate')));
create policy training_certificates_read on public.training_certificates for select to authenticated using((select private.has_permission(organization_id,'training.read')));
create policy training_certificates_insert on public.training_certificates for insert to authenticated with check((select private.has_permission(organization_id,'training.validate')));

create trigger training_sessions_validate_links before insert or update on public.training_sessions for each row execute function private.validate_training_tenant_links();
create trigger training_enrollments_validate_links before insert or update on public.training_enrollments for each row execute function private.validate_training_tenant_links();
create trigger training_attendances_validate_links before insert on public.training_attendances for each row execute function private.validate_training_tenant_links();
create trigger training_evaluations_validate_links before insert on public.training_evaluations for each row execute function private.validate_training_tenant_links();
create trigger training_certificates_validate_links before insert on public.training_certificates for each row execute function private.validate_training_tenant_links();
create trigger training_catalog_updated before update on public.training_catalog for each row execute function private.set_updated_at();
create trigger training_plans_updated before update on public.training_plans for each row execute function private.set_updated_at();
create trigger training_sessions_updated before update on public.training_sessions for each row execute function private.set_updated_at();
create trigger training_enrollments_updated before update on public.training_enrollments for each row execute function private.set_updated_at();
create trigger training_catalog_audit after insert or update on public.training_catalog for each row execute function private.capture_core_audit();
create trigger training_plans_audit after insert or update on public.training_plans for each row execute function private.capture_core_audit();
create trigger training_sessions_audit after insert or update on public.training_sessions for each row execute function private.capture_core_audit();
create trigger training_enrollments_audit after insert or update on public.training_enrollments for each row execute function private.capture_core_audit();
create trigger training_attendances_audit after insert on public.training_attendances for each row execute function private.capture_core_audit();
create trigger training_evaluations_audit after insert on public.training_evaluations for each row execute function private.capture_core_audit();
create trigger training_certificates_audit after insert on public.training_certificates for each row execute function private.capture_core_audit();

create view public.training_plan_indicators with (security_invoker=true) as
select p.id as training_plan_id,p.organization_id,
  count(distinct e.id) as enrolled_count,
  count(distinct a.id) filter(where a.status='present') as attended_count,
  count(distinct ev.id) as evaluated_count,
  count(distinct ev.id) filter(where ev.passed) as passed_count,
  round(100.0 * count(distinct a.id) filter(where a.status='present') / nullif(count(distinct e.id),0),2) as coverage_percent,
  round(100.0 * count(distinct ev.id) filter(where ev.passed) / nullif(count(distinct ev.id),0),2) as effectiveness_percent
from public.training_plans p
left join public.training_sessions s on s.training_plan_id=p.id
left join public.training_enrollments e on e.training_session_id=s.id
left join public.training_attendances a on a.training_enrollment_id=e.id
left join public.training_evaluations ev on ev.training_enrollment_id=e.id
group by p.id,p.organization_id;
grant select on public.training_plan_indicators to authenticated;
notify pgrst,'reload schema';
