-- Accept only the authenticated user's invitation for the requested tenant.
-- Returning the membership and role in the same transaction avoids an RLS
-- visibility race between accepting the invitation and rendering activation.
create function public.accept_my_organization_invitation(p_organization_id uuid)
returns table (
  organization_member_id uuid,
  is_organization_admin boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_membership_id uuid;
begin
  if v_user_id is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  select om.id
  into v_membership_id
  from public.organization_members om
  join public.organizations o on o.id = om.organization_id
  where om.organization_id = p_organization_id
    and om.user_id = v_user_id
    and om.status in ('invited', 'active')
    and o.status = 'active'
  for update of om;

  if v_membership_id is null then
    raise exception 'invitation does not grant access to this organization'
      using errcode = '42501';
  end if;

  update public.organization_members
  set status = 'active',
      joined_at = coalesce(joined_at, now())
  where id = v_membership_id
    and status = 'invited';

  return query
  select
    v_membership_id,
    exists (
      select 1
      from public.member_roles mr
      join public.roles r on r.id = mr.role_id
      where mr.organization_id = p_organization_id
        and mr.organization_member_id = v_membership_id
        and mr.site_id is null
        and r.code = 'organization_admin'
    );
end;
$$;

revoke all on function public.accept_my_organization_invitation(uuid)
  from public, anon;
grant execute on function public.accept_my_organization_invitation(uuid)
  to authenticated;

comment on function public.accept_my_organization_invitation(uuid) is
  'Activates the current user membership for one explicitly requested organization and returns its onboarding role.';

notify pgrst, 'reload schema';
