-- RLS already limits rows to active SaaS administrators. The explicit table
-- grant is also required for PostgREST to evaluate that SELECT policy.
grant select on table public.saas_admin_audit to authenticated;
