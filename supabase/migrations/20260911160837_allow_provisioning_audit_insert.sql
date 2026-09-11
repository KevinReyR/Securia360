-- The provisioning RPC is intentionally callable by an authenticated SaaS
-- administrator. Its audit write must therefore retain a narrowly-scoped
-- INSERT path when PostgREST executes the RPC with the caller role.
grant insert on table public.saas_admin_audit to authenticated;

create policy saas_admin_audit_provisioning_insert
on public.saas_admin_audit
for insert
to authenticated
with check (
  private.is_saas_admin(false)
  and actor_user_id = (select auth.uid())
  and current_setting('securia.saas_provisioning', true) = '1'
);
