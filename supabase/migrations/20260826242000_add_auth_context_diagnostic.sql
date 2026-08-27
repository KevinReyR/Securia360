-- Temporary-safe diagnostics for confirming the identity seen by PostgREST.
-- The function is SECURITY INVOKER and returns only the caller's own claims.

create or replace function public.get_request_auth_context()
returns table (user_id uuid, role text)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (select auth.uid()) as user_id,
    coalesce((select auth.jwt() ->> 'role'), '') as role;
$$;

revoke all on function public.get_request_auth_context() from public, anon;
grant execute on function public.get_request_auth_context() to authenticated;

comment on function public.get_request_auth_context() is
  'Returns only the caller identity as observed by PostgREST for safe SSR diagnostics.';

notify pgrst, 'reload schema';
