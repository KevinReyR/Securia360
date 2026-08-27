-- Prevent a non-administrator with member-management permission from granting
-- or withdrawing the global organization administrator role.

create or replace function private.is_global_organization_admin(p_organization_id uuid)
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
       and mr.site_id is null
      join public.roles r on r.id = mr.role_id
      where om.organization_id = p_organization_id
        and om.user_id = (select auth.uid())
        and om.status = 'active'
        and r.code = 'organization_admin'
    );
$$;

create or replace function private.prevent_admin_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_role_code text;
  new_role_code text;
  target_organization_id uuid;
  target_site_id uuid;
  old_assignment_global boolean := false;
  new_assignment_global boolean := false;
begin
  if coalesce((select auth.jwt() ->> 'role'), '') = 'service_role' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    target_organization_id := old.organization_id;
    target_site_id := old.site_id;
    select r.code into old_role_code from public.roles r where r.id = old.role_id;
    old_assignment_global := old.site_id is null;
  else
    target_organization_id := new.organization_id;
    target_site_id := new.site_id;
    select r.code into new_role_code from public.roles r where r.id = new.role_id;
    new_assignment_global := new.site_id is null;
    if tg_op = 'UPDATE' then
      select r.code into old_role_code from public.roles r where r.id = old.role_id;
      old_assignment_global := old.site_id is null;
    end if;
  end if;

  if ((old_role_code = 'organization_admin' and old_assignment_global)
      or (new_role_code = 'organization_admin' and new_assignment_global))
     and not private.is_global_organization_admin(target_organization_id) then
    raise exception 'only a global organization administrator can manage organization_admin' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.is_global_organization_admin(uuid)
  from public, anon, authenticated, service_role;
revoke all on function private.prevent_admin_role_escalation()
  from public, anon, authenticated, service_role;

create trigger member_roles_prevent_admin_role_escalation
  before insert or update or delete on public.member_roles
  for each row execute function private.prevent_admin_role_escalation();

notify pgrst, 'reload schema';
