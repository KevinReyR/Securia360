-- RLS still decides which role rows are visible. These grants only make the
-- table and its private authorization predicate usable by authenticated calls.
grant select on table public.saas_admin_roles to authenticated;
grant execute on function private.is_saas_admin(boolean) to authenticated;

notify pgrst, 'reload schema';
