-- Re-inviting an existing account must not demote an active or suspended
-- membership back to invited. The explicit status actions remain authoritative.

create or replace function public.add_invited_member(
  p_organization_id uuid,
  p_user_id uuid,
  p_role_id uuid,
  p_site_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  membership_id uuid;
begin
  if not private.has_permission(p_organization_id, 'members.create')
     or not private.has_permission(p_organization_id, 'members.roles_manage') then
    raise exception 'insufficient member management permission' using errcode = '42501';
  end if;

  insert into public.organization_members (
    organization_id,
    user_id,
    status,
    joined_at
  ) values (
    p_organization_id,
    p_user_id,
    'invited',
    null
  )
  on conflict (organization_id, user_id) do update
    set updated_at = excluded.updated_at
  returning id into membership_id;

  insert into public.member_roles (
    organization_id,
    organization_member_id,
    role_id,
    site_id,
    created_by
  ) values (
    p_organization_id,
    membership_id,
    p_role_id,
    p_site_id,
    (select auth.uid())
  )
  on conflict on constraint member_roles_assignment_key do nothing;

  return membership_id;
end;
$$;

revoke all on function public.add_invited_member(uuid, uuid, uuid, uuid)
  from public, anon;
grant execute on function public.add_invited_member(uuid, uuid, uuid, uuid)
  to authenticated, service_role;

notify pgrst, 'reload schema';
