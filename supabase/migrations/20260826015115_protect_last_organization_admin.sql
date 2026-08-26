-- Prevent direct Data API writes from leaving a tenant without an active admin.

create or replace function private.protect_last_active_admin_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'active' and new.status <> 'active'
     and exists (
       select 1
       from public.member_roles mr
       join public.roles r on r.id = mr.role_id
       where mr.organization_id = old.organization_id
         and mr.organization_member_id = old.id
         and mr.site_id is null
         and r.code = 'organization_admin'
     )
     and not exists (
       select 1
       from public.organization_members om
       join public.member_roles mr
         on mr.organization_id = om.organization_id
        and mr.organization_member_id = om.id
       join public.roles r on r.id = mr.role_id
       where om.organization_id = old.organization_id
         and om.id <> old.id
         and om.status = 'active'
         and mr.site_id is null
         and r.code = 'organization_admin'
     ) then
    raise exception 'organization must keep an active administrator' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function private.protect_last_active_admin_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_role_code text;
begin
  select code into old_role_code from public.roles where id = old.role_id;
  if old_role_code = 'organization_admin'
     and old.site_id is null
     and (tg_op = 'DELETE' or new.role_id is distinct from old.role_id or new.site_id is not null)
     and not exists (
       select 1
       from public.organization_members om
       join public.member_roles mr
         on mr.organization_id = om.organization_id
        and mr.organization_member_id = om.id
       join public.roles r on r.id = mr.role_id
       where om.organization_id = old.organization_id
         and om.status = 'active'
         and mr.id <> old.id
         and mr.site_id is null
         and r.code = 'organization_admin'
     ) then
    raise exception 'organization must keep an active administrator' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.protect_last_active_admin_membership()
  from public, anon, authenticated, service_role;
revoke all on function private.protect_last_active_admin_role()
  from public, anon, authenticated, service_role;

create trigger organization_members_protect_last_admin
  before update of status on public.organization_members
  for each row execute function private.protect_last_active_admin_membership();
create trigger member_roles_protect_last_admin
  before update or delete on public.member_roles
  for each row execute function private.protect_last_active_admin_role();
