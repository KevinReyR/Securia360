-- Securia360 SaaS core: identity, multi-tenancy, RBAC and organization structure.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  middle_name text,
  last_name text,
  second_last_name text,
  phone text,
  avatar_path text,
  status text not null default 'active'
    constraint profiles_status_check check (status in ('active', 'inactive', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null constraint organizations_name_not_blank check (btrim(name) <> ''),
  slug text not null,
  nit text,
  country_code text not null default 'CO'
    constraint organizations_country_code_check check (country_code ~ '^[A-Z]{2}$'),
  timezone text not null default 'America/Bogota',
  status text not null default 'active'
    constraint organizations_status_check check (status in ('active', 'inactive', 'suspended')),
  settings jsonb not null default '{}'::jsonb
    constraint organizations_settings_object_check check (jsonb_typeof(settings) = 'object'),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_key unique (slug),
  constraint organizations_slug_format_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint organizations_nit_key unique (nit)
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active'
    constraint organization_members_status_check
    check (status in ('invited', 'active', 'inactive', 'suspended')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_organization_user_key unique (organization_id, user_id),
  constraint organization_members_tenant_identity_key unique (organization_id, id)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    constraint permissions_code_format_check check (code ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  module text not null,
  action text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint permissions_module_action_key unique (module, action)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  code text not null
    constraint roles_code_format_check check (code ~ '^[a-z][a-z0-9_]*$'),
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_system_scope_check
    check ((is_system and organization_id is null) or (not is_system and organization_id is not null)),
  constraint roles_tenant_identity_key unique (organization_id, id)
);

create unique index roles_system_code_key
  on public.roles (code) where organization_id is null;
create unique index roles_organization_code_key
  on public.roles (organization_id, code) where organization_id is not null;

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table public.legal_entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  legal_name text not null constraint legal_entities_legal_name_not_blank check (btrim(legal_name) <> ''),
  trade_name text,
  tax_id text not null,
  ciiu_code text,
  economic_activity text,
  legal_representative text,
  risk_class smallint constraint legal_entities_risk_class_check check (risk_class between 1 and 5),
  employee_count integer not null default 0
    constraint legal_entities_employee_count_check check (employee_count >= 0),
  status text not null default 'active'
    constraint legal_entities_status_check check (status in ('active', 'inactive')),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint legal_entities_organization_tax_id_key unique (organization_id, tax_id),
  constraint legal_entities_tenant_identity_key unique (organization_id, id)
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  legal_entity_id uuid not null,
  name text not null constraint sites_name_not_blank check (btrim(name) <> ''),
  code text not null,
  address text,
  city text,
  department text,
  risk_class smallint constraint sites_risk_class_check check (risk_class between 1 and 5),
  status text not null default 'active'
    constraint sites_status_check check (status in ('active', 'inactive')),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sites_organization_legal_entity_fkey
    foreign key (organization_id, legal_entity_id)
    references public.legal_entities (organization_id, id) on delete restrict,
  constraint sites_organization_code_key unique (organization_id, code),
  constraint sites_tenant_identity_key unique (organization_id, id)
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  site_id uuid not null,
  parent_area_id uuid,
  name text not null constraint areas_name_not_blank check (btrim(name) <> ''),
  code text not null,
  status text not null default 'active'
    constraint areas_status_check check (status in ('active', 'inactive')),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint areas_organization_site_fkey
    foreign key (organization_id, site_id)
    references public.sites (organization_id, id) on delete cascade,
  constraint areas_parent_fkey
    foreign key (organization_id, site_id, parent_area_id)
    references public.areas (organization_id, site_id, id)
    on delete set null (parent_area_id),
  constraint areas_not_self_parent_check check (parent_area_id is null or parent_area_id <> id),
  constraint areas_organization_site_code_key unique (organization_id, site_id, code),
  constraint areas_tenant_identity_key unique (organization_id, site_id, id)
);

create table public.member_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  organization_member_id uuid not null,
  role_id uuid not null references public.roles (id) on delete restrict,
  site_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint member_roles_organization_member_fkey
    foreign key (organization_id, organization_member_id)
    references public.organization_members (organization_id, id) on delete cascade,
  constraint member_roles_organization_site_fkey
    foreign key (organization_id, site_id)
    references public.sites (organization_id, id) on delete cascade,
  constraint member_roles_assignment_key
    unique nulls not distinct (organization_member_id, role_id, site_id)
);

create table public.organization_characteristics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  work_at_height boolean not null default false,
  confined_spaces boolean not null default false,
  chemical_exposure boolean not null default false,
  electrical_work boolean not null default false,
  transport_operations boolean not null default false,
  heavy_machinery boolean not null default false,
  night_work boolean not null default false,
  remote_work boolean not null default false,
  manual_load_handling boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

-- Foreign-key and policy lookup indexes.
create index organizations_created_by_idx on public.organizations (created_by);
create index organization_members_user_status_idx
  on public.organization_members (user_id, status, organization_id);
create index roles_organization_id_idx on public.roles (organization_id);
create index role_permissions_permission_id_idx on public.role_permissions (permission_id);
create index legal_entities_organization_id_idx on public.legal_entities (organization_id);
create index sites_legal_entity_id_idx on public.sites (legal_entity_id);
create index areas_site_id_idx on public.areas (site_id);
create index areas_parent_area_id_idx on public.areas (parent_area_id);
create index member_roles_organization_member_id_idx on public.member_roles (organization_member_id);
create index member_roles_role_id_idx on public.member_roles (role_id);
create index member_roles_site_id_idx on public.member_roles (site_id);
create index audit_log_organization_created_at_idx
  on public.audit_log (organization_id, created_at desc);
create index audit_log_actor_user_id_idx on public.audit_log (actor_user_id);

-- Authorization helpers live outside the exposed Data API schema.
create or replace function private.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id = p_organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
    );
$$;

create or replace function private.has_permission(
  p_organization_id uuid,
  p_permission_code text,
  p_site_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_members om
      join public.member_roles mr
        on mr.organization_id = om.organization_id
       and mr.organization_member_id = om.id
      join public.role_permissions rp on rp.role_id = mr.role_id
      join public.permissions p on p.id = rp.permission_id
      where om.organization_id = p_organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
        and p.code = p_permission_code
        and (mr.site_id is null or (p_site_id is not null and mr.site_id = p_site_id))
    );
$$;

create or replace function private.can_view_profile(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      p_user_id = (select auth.uid())
      or exists (
        select 1
        from public.organization_members mine
        join public.organization_members theirs
          on theirs.organization_id = mine.organization_id
         and theirs.status = 'active'
        where mine.user_id = (select auth.uid())
          and mine.status = 'active'
          and theirs.user_id = p_user_id
      )
    );
$$;

revoke all on function private.is_organization_member(uuid) from public, anon;
revoke all on function private.has_permission(uuid, text, uuid) from public, anon;
revoke all on function private.can_view_profile(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.has_permission(uuid, text, uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;

-- Timestamp, integrity and bootstrap triggers.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.prevent_organization_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id cannot be changed' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.validate_member_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  role_organization_id uuid;
begin
  if (select auth.uid()) is null
     and coalesce((select auth.jwt() ->> 'role'), '') <> 'service_role' then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  select r.organization_id into role_organization_id
  from public.roles r
  where r.id = new.role_id;

  if not found then
    raise exception 'role not found' using errcode = '23503';
  end if;

  if role_organization_id is not null and role_organization_id <> new.organization_id then
    raise exception 'role belongs to another organization' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, middle_name, last_name, second_last_name, phone)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'middle_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'second_last_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.bootstrap_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  membership_id uuid;
  admin_role_id uuid;
begin
  if new.created_by is null then
    return new;
  end if;

  if coalesce((select auth.jwt() ->> 'role'), '') <> 'service_role'
     and ((select auth.uid()) is null or new.created_by <> (select auth.uid())) then
    raise exception 'organization creator must match authenticated user' using errcode = '42501';
  end if;

  insert into public.organization_members (
    organization_id, user_id, status, joined_at
  ) values (
    new.id, new.created_by, 'active', now()
  ) returning id into membership_id;

  select r.id into admin_role_id
  from public.roles r
  where r.organization_id is null and r.code = 'organization_admin';

  if admin_role_id is null then
    raise exception 'organization_admin system role is not configured';
  end if;

  insert into public.member_roles (
    organization_id, organization_member_id, role_id, created_by
  ) values (
    new.id, membership_id, admin_role_id, new.created_by
  );

  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.prevent_organization_change() from public, anon, authenticated;
revoke all on function private.validate_member_role() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.bootstrap_organization() from public, anon, authenticated;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function private.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members
  for each row execute function private.set_updated_at();
create trigger roles_set_updated_at before update on public.roles
  for each row execute function private.set_updated_at();
create trigger legal_entities_set_updated_at before update on public.legal_entities
  for each row execute function private.set_updated_at();
create trigger sites_set_updated_at before update on public.sites
  for each row execute function private.set_updated_at();
create trigger areas_set_updated_at before update on public.areas
  for each row execute function private.set_updated_at();
create trigger organization_characteristics_set_updated_at
  before update on public.organization_characteristics
  for each row execute function private.set_updated_at();

create trigger organization_members_prevent_organization_change
  before update on public.organization_members
  for each row execute function private.prevent_organization_change();
create trigger legal_entities_prevent_organization_change
  before update on public.legal_entities
  for each row execute function private.prevent_organization_change();
create trigger sites_prevent_organization_change
  before update on public.sites
  for each row execute function private.prevent_organization_change();
create trigger areas_prevent_organization_change
  before update on public.areas
  for each row execute function private.prevent_organization_change();
create trigger member_roles_prevent_organization_change
  before update on public.member_roles
  for each row execute function private.prevent_organization_change();
create trigger organization_characteristics_prevent_organization_change
  before update on public.organization_characteristics
  for each row execute function private.prevent_organization_change();

create trigger member_roles_validate_scope
  before insert or update on public.member_roles
  for each row execute function private.validate_member_role();
create trigger auth_user_created_profile
  after insert on auth.users
  for each row execute function private.handle_new_user();
create trigger organization_created_bootstrap
  after insert on public.organizations
  for each row execute function private.bootstrap_organization();

-- System roles and permission catalog.
insert into public.roles (code, name, description, is_system) values
  ('organization_admin', 'Administrador de organización', 'Control total del tenant.', true),
  ('sst_manager', 'Responsable SST', 'Administra la operación del SG-SST.', true),
  ('manager', 'Gerente', 'Consulta gerencial y seguimiento.', true),
  ('worker', 'Trabajador', 'Acceso operativo básico.', true),
  ('sst_professional', 'Profesional SST', 'Ejecución profesional del SG-SST.', true),
  ('sst_coordinator', 'Coordinador SST', 'Coordinación del SG-SST.', true),
  ('hr_manager', 'Responsable de talento humano', 'Gestión de personas.', true),
  ('operations_manager', 'Responsable de operaciones', 'Gestión operativa.', true),
  ('site_manager', 'Responsable de sede', 'Gestión con alcance de sede.', true),
  ('auditor', 'Auditor', 'Consulta y auditoría.', true),
  ('contractor', 'Contratista', 'Acceso operativo restringido.', true),
  ('viewer', 'Consulta', 'Acceso de solo lectura.', true);

insert into public.permissions (code, module, action, description) values
  ('organization.read', 'organization', 'read', 'Consultar la organización.'),
  ('organization.update', 'organization', 'update', 'Actualizar la organización.'),
  ('members.read', 'members', 'read', 'Consultar miembros.'),
  ('members.create', 'members', 'create', 'Agregar o invitar miembros.'),
  ('members.update', 'members', 'update', 'Actualizar miembros.'),
  ('members.roles_manage', 'members', 'roles_manage', 'Asignar y retirar roles.'),
  ('legal_entities.read', 'legal_entities', 'read', 'Consultar razones sociales.'),
  ('legal_entities.create', 'legal_entities', 'create', 'Crear razones sociales.'),
  ('legal_entities.update', 'legal_entities', 'update', 'Actualizar razones sociales.'),
  ('legal_entities.delete', 'legal_entities', 'delete', 'Eliminar razones sociales.'),
  ('sites.read', 'sites', 'read', 'Consultar sedes.'),
  ('sites.create', 'sites', 'create', 'Crear sedes.'),
  ('sites.update', 'sites', 'update', 'Actualizar sedes.'),
  ('sites.delete', 'sites', 'delete', 'Eliminar sedes.'),
  ('areas.read', 'areas', 'read', 'Consultar áreas.'),
  ('areas.create', 'areas', 'create', 'Crear áreas.'),
  ('areas.update', 'areas', 'update', 'Actualizar áreas.'),
  ('areas.delete', 'areas', 'delete', 'Eliminar áreas.'),
  ('onboarding.manage', 'onboarding', 'manage', 'Gestionar la caracterización inicial.'),
  ('audit.read', 'audit', 'read', 'Consultar el registro de auditoría.');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r cross join public.permissions p
where r.code = 'organization_admin' and r.organization_id is null;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = any (array[
  'organization.read', 'members.read',
  'legal_entities.read', 'legal_entities.create', 'legal_entities.update',
  'sites.read', 'sites.create', 'sites.update',
  'areas.read', 'areas.create', 'areas.update',
  'onboarding.manage', 'audit.read'
])
where r.code in ('sst_manager', 'sst_professional', 'sst_coordinator')
  and r.organization_id is null;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = any (array[
  'organization.read', 'members.read', 'legal_entities.read',
  'sites.read', 'areas.read', 'audit.read'
])
where r.code in ('manager', 'auditor', 'viewer') and r.organization_id is null;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = any (array[
  'organization.read', 'members.read', 'legal_entities.read',
  'sites.read', 'sites.update', 'areas.read', 'areas.update'
])
where r.code in ('hr_manager', 'operations_manager', 'site_manager')
  and r.organization_id is null;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = any (array['organization.read', 'sites.read', 'areas.read'])
where r.code in ('worker', 'contractor') and r.organization_id is null;

-- Row Level Security and explicit Data API privileges.
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.legal_entities enable row level security;
alter table public.sites enable row level security;
alter table public.areas enable row level security;
alter table public.member_roles enable row level security;
alter table public.organization_characteristics enable row level security;
alter table public.audit_log enable row level security;

revoke all on all tables in schema public from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.organizations to authenticated;
grant select, insert, update on public.organization_members to authenticated;
grant select on public.permissions, public.roles, public.role_permissions to authenticated;
grant select, insert, update, delete on public.legal_entities to authenticated;
grant select, insert, update, delete on public.sites to authenticated;
grant select, insert, update, delete on public.areas to authenticated;
grant select, insert, update, delete on public.member_roles to authenticated;
grant select, insert, update on public.organization_characteristics to authenticated;
grant select on public.audit_log to authenticated;
grant all on all tables in schema public to service_role;

create policy profiles_select on public.profiles for select to authenticated
  using ((select private.can_view_profile(id)));
create policy profiles_update on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy organizations_select on public.organizations for select to authenticated
  using ((select private.is_organization_member(id)));
create policy organizations_insert on public.organizations for insert to authenticated
  with check ((select auth.uid()) is not null and created_by = (select auth.uid()));
create policy organizations_update on public.organizations for update to authenticated
  using ((select private.has_permission(id, 'organization.update')))
  with check ((select private.has_permission(id, 'organization.update')));

create policy organization_members_select on public.organization_members for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy organization_members_insert on public.organization_members for insert to authenticated
  with check ((select private.has_permission(organization_id, 'members.create')));
create policy organization_members_update on public.organization_members for update to authenticated
  using ((select private.has_permission(organization_id, 'members.update')))
  with check ((select private.has_permission(organization_id, 'members.update')));

create policy permissions_select on public.permissions for select to authenticated using (true);
create policy roles_select on public.roles for select to authenticated
  using (organization_id is null or (select private.is_organization_member(organization_id)));
create policy role_permissions_select on public.role_permissions for select to authenticated
  using (exists (
    select 1 from public.roles r
    where r.id = role_permissions.role_id
      and (r.organization_id is null or (select private.is_organization_member(r.organization_id)))
  ));

create policy legal_entities_select on public.legal_entities for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy legal_entities_insert on public.legal_entities for insert to authenticated
  with check ((select private.has_permission(organization_id, 'legal_entities.create')));
create policy legal_entities_update on public.legal_entities for update to authenticated
  using ((select private.has_permission(organization_id, 'legal_entities.update')))
  with check ((select private.has_permission(organization_id, 'legal_entities.update')));
create policy legal_entities_delete on public.legal_entities for delete to authenticated
  using ((select private.has_permission(organization_id, 'legal_entities.delete')));

create policy sites_select on public.sites for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy sites_insert on public.sites for insert to authenticated
  with check ((select private.has_permission(organization_id, 'sites.create')));
create policy sites_update on public.sites for update to authenticated
  using ((select private.has_permission(organization_id, 'sites.update', id)))
  with check ((select private.has_permission(organization_id, 'sites.update', id)));
create policy sites_delete on public.sites for delete to authenticated
  using ((select private.has_permission(organization_id, 'sites.delete', id)));

create policy areas_select on public.areas for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy areas_insert on public.areas for insert to authenticated
  with check ((select private.has_permission(organization_id, 'areas.create', site_id)));
create policy areas_update on public.areas for update to authenticated
  using ((select private.has_permission(organization_id, 'areas.update', site_id)))
  with check ((select private.has_permission(organization_id, 'areas.update', site_id)));
create policy areas_delete on public.areas for delete to authenticated
  using ((select private.has_permission(organization_id, 'areas.delete', site_id)));

create policy member_roles_select on public.member_roles for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy member_roles_insert on public.member_roles for insert to authenticated
  with check ((select private.has_permission(organization_id, 'members.roles_manage')));
create policy member_roles_update on public.member_roles for update to authenticated
  using ((select private.has_permission(organization_id, 'members.roles_manage')))
  with check ((select private.has_permission(organization_id, 'members.roles_manage')));
create policy member_roles_delete on public.member_roles for delete to authenticated
  using ((select private.has_permission(organization_id, 'members.roles_manage')));

create policy organization_characteristics_select on public.organization_characteristics
  for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy organization_characteristics_insert on public.organization_characteristics
  for insert to authenticated
  with check ((select private.has_permission(organization_id, 'onboarding.manage')));
create policy organization_characteristics_update on public.organization_characteristics
  for update to authenticated
  using ((select private.has_permission(organization_id, 'onboarding.manage')))
  with check ((select private.has_permission(organization_id, 'onboarding.manage')));

create policy audit_log_select on public.audit_log for select to authenticated
  using ((select private.has_permission(organization_id, 'audit.read')));

-- Private avatars. Object names must begin with the authenticated user's UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_select_own on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text);

comment on table public.organizations is 'Tenant principal de Securia360.';
comment on table public.organization_members is 'Relación multiempresa entre usuarios y organizaciones.';
comment on table public.member_roles is 'Asignación RBAC con alcance opcional por sede.';
comment on table public.organization_characteristics is 'Caracterización operativa inicial usada por futuros motores de aplicabilidad.';
comment on table public.audit_log is 'Patrón append-only para auditoría; la aplicación cliente solo tiene lectura autorizada.';
