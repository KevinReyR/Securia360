-- Internal commercial operators need the organization directory to attach
-- subscriptions and support sessions. This policy does not extend to tenant data.
create policy organizations_internal_saas_directory
on public.organizations
for select
to authenticated
using (private.is_saas_admin(true));

notify pgrst, 'reload schema';
