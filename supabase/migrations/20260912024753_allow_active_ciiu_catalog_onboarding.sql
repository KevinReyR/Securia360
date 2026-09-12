-- The active Decreto 768 catalog is already the operational source used by the
-- public initial assessment. Preserve its expert-review status in the
-- classification explanation without blocking onboarding while that review is
-- pending. Profiles, scoring rules and the classification evaluator remain
-- restricted to reviewed versions.

do $$
declare
  v_definition text;
  v_review_predicate constant text := 'and nsv.expert_review_status=''reviewed''';
begin
  select pg_get_functiondef(p.oid) into v_definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'complete_organization_onboarding'
    and pg_get_function_identity_arguments(p.oid) = 'p_organization_id uuid, p_idempotency_key uuid';

  if v_definition is null then
    raise exception 'private.complete_organization_onboarding(uuid, uuid) was not found';
  end if;

  if position(v_review_predicate in v_definition) = 0 then
    raise exception 'expected CIIU source review predicate was not found';
  end if;

  execute replace(v_definition, v_review_predicate, '');
end;
$$;

comment on function private.complete_organization_onboarding(uuid, uuid) is
  'Completes onboarding from the active CIIU catalog and creates a reviewed current classification atomically.';

notify pgrst, 'reload schema';
