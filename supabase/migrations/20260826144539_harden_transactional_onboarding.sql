-- Keep privileged implementations outside the exposed Data API schema (UTC migration version).

alter function public.save_organization_onboarding_step(uuid, smallint, jsonb)
  set schema private;
alter function public.complete_organization_onboarding(uuid, uuid)
  set schema private;

revoke all on function private.save_organization_onboarding_step(uuid, smallint, jsonb)
  from public, anon;
revoke all on function private.complete_organization_onboarding(uuid, uuid)
  from public, anon;
grant execute on function private.save_organization_onboarding_step(uuid, smallint, jsonb)
  to authenticated, service_role;
grant execute on function private.complete_organization_onboarding(uuid, uuid)
  to authenticated, service_role;

create function public.save_organization_onboarding_step(
  p_organization_id uuid,
  p_step smallint,
  p_data jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.save_organization_onboarding_step(
    p_organization_id,
    p_step,
    p_data
  );
$$;

create function public.complete_organization_onboarding(
  p_organization_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.complete_organization_onboarding(
    p_organization_id,
    p_idempotency_key
  );
$$;

revoke all on function public.save_organization_onboarding_step(uuid, smallint, jsonb)
  from public, anon;
revoke all on function public.complete_organization_onboarding(uuid, uuid)
  from public, anon;
grant execute on function public.save_organization_onboarding_step(uuid, smallint, jsonb)
  to authenticated, service_role;
grant execute on function public.complete_organization_onboarding(uuid, uuid)
  to authenticated, service_role;

-- Domain events are internal. This explicit deny policy documents that the
-- authenticated Data API role has no direct row access even if grants change.
create policy domain_events_no_direct_access on public.domain_events
  for all to authenticated
  using (false)
  with check (false);

comment on function public.save_organization_onboarding_step(uuid, smallint, jsonb) is
  'Invoker wrapper for the private, tenant-authorized onboarding step operation.';
comment on function public.complete_organization_onboarding(uuid, uuid) is
  'Invoker wrapper for the private, tenant-authorized atomic onboarding completion.';

notify pgrst, 'reload schema';
