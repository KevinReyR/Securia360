-- Repair invitations whose Auth link was accepted while the application still
-- had a different user's cookie session. A sign-in after the membership was
-- created is the durable evidence that the invite or a subsequent login was
-- completed by that Auth user.
update public.organization_members om
set status = 'active',
    joined_at = coalesce(om.joined_at, u.last_sign_in_at, now())
from auth.users u
where om.user_id = u.id
  and om.status = 'invited'
  and u.email_confirmed_at is not null
  and u.last_sign_in_at is not null
  and u.last_sign_in_at >= om.created_at;
