-- Harden future Data API objects and expose the centralized permission check.

alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on functions from public, anon, authenticated, service_role;

create or replace function public.can(
  p_organization_id uuid,
  p_permission_code text,
  p_site_id uuid default null
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    private.has_permission(p_organization_id, p_permission_code, p_site_id),
    false
  );
$$;

revoke all on function public.can(uuid, text, uuid) from public, anon;
grant execute on function public.can(uuid, text, uuid) to authenticated, service_role;

create or replace function private.prevent_membership_identity_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id
     or new.user_id is distinct from old.user_id then
    raise exception 'membership identity cannot be changed' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_membership_identity_change()
  from public, anon, authenticated, service_role;

drop trigger if exists organization_members_prevent_organization_change
  on public.organization_members;
create trigger organization_members_prevent_identity_change
  before update on public.organization_members
  for each row execute function private.prevent_membership_identity_change();

create or replace function private.capture_core_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  before_row jsonb;
  after_row jsonb;
  tenant_id uuid;
  record_id uuid;
begin
  before_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  after_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;

  tenant_id := coalesce(
    nullif(after_row ->> 'organization_id', '')::uuid,
    nullif(before_row ->> 'organization_id', '')::uuid,
    nullif(after_row ->> 'id', '')::uuid,
    nullif(before_row ->> 'id', '')::uuid
  );
  record_id := coalesce(
    nullif(after_row ->> 'id', '')::uuid,
    nullif(before_row ->> 'id', '')::uuid
  );

  insert into public.audit_log (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    ip_address
  ) values (
    tenant_id,
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    record_id,
    before_row,
    after_row,
    inet_client_addr()
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.capture_core_audit()
  from public, anon, authenticated, service_role;

create trigger organizations_capture_audit
  after insert or update on public.organizations
  for each row execute function private.capture_core_audit();
create trigger organization_members_capture_audit
  after insert or update on public.organization_members
  for each row execute function private.capture_core_audit();
create trigger legal_entities_capture_audit
  after insert or update or delete on public.legal_entities
  for each row execute function private.capture_core_audit();
create trigger sites_capture_audit
  after insert or update or delete on public.sites
  for each row execute function private.capture_core_audit();
create trigger areas_capture_audit
  after insert or update or delete on public.areas
  for each row execute function private.capture_core_audit();
create trigger member_roles_capture_audit
  after insert or update or delete on public.member_roles
  for each row execute function private.capture_core_audit();
create trigger organization_characteristics_capture_audit
  after insert or update on public.organization_characteristics
  for each row execute function private.capture_core_audit();

comment on function public.can(uuid, text, uuid) is
  'Centralized RBAC check for the authenticated user and optional site scope.';

notify pgrst, 'reload schema';
