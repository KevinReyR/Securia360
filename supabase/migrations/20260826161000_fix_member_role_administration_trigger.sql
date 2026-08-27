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
  old_assignment_global boolean := false;
  new_assignment_global boolean := false;
begin
  if coalesce((select auth.jwt() ->> 'role'), '') = 'service_role' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    target_organization_id := old.organization_id;
    old_assignment_global := old.site_id is null;
    select r.code into old_role_code from public.roles r where r.id = old.role_id;
  else
    target_organization_id := new.organization_id;
    new_assignment_global := new.site_id is null;
    select r.code into new_role_code from public.roles r where r.id = new.role_id;
    if tg_op = 'UPDATE' then
      old_assignment_global := old.site_id is null;
      select r.code into old_role_code from public.roles r where r.id = old.role_id;
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

notify pgrst, 'reload schema';
