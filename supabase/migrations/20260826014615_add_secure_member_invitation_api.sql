-- Atomic membership invitation and self-acceptance APIs.

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
    set status = 'invited', updated_at = now()
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

create or replace function private.accept_my_invitations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  if (select auth.uid()) is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  update public.organization_members
  set status = 'active', joined_at = coalesce(joined_at, now())
  where user_id = (select auth.uid()) and status = 'invited';
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function private.accept_my_invitations()
  from public, anon, authenticated, service_role;
grant execute on function private.accept_my_invitations() to authenticated;

create or replace function public.accept_my_invitations()
returns integer
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.accept_my_invitations();
$$;

revoke all on function public.accept_my_invitations() from public, anon;
grant execute on function public.accept_my_invitations() to authenticated;

notify pgrst, 'reload schema';
