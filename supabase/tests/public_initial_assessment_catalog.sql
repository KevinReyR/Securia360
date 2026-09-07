-- Read-only regression checks for the public initial-assessment catalog.
begin;

do $$
begin
  if not has_function_privilege('anon', 'public.get_public_initial_assessment_catalog()', 'EXECUTE') then
    raise exception 'anon must be able to execute the narrow public catalog function';
  end if;

  if has_table_privilege('anon', 'public.minimum_standards', 'SELECT')
     or has_table_privilege('anon', 'public.standard_profile_versions', 'SELECT')
     or has_table_privilege('anon', 'public.assessment_scoring_rules', 'SELECT') then
    raise exception 'anon must not receive direct normative table access';
  end if;

end;
$$;

set local role anon;

do $$
declare
  payload jsonb;
begin
  select public.get_public_initial_assessment_catalog() into payload;

  if payload ->> 'schemaVersion' <> '1' or jsonb_typeof(payload -> 'profiles') <> 'array' then
    raise exception 'public catalog returned an invalid envelope';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(payload -> 'profiles') profile
    where profile ->> 'code' not in ('RES0312_P07', 'RES0312_P21', 'RES0312_P60')
       or jsonb_array_length(profile -> 'standards') not in (7, 21, 60)
       or (profile #>> '{scoring,multipliers,met}')::numeric <> 100
       or (profile #>> '{scoring,multipliers,notMet}')::numeric <> 0
  ) then
    raise exception 'public catalog exposed an unsupported or incomplete profile';
  end if;
end;
$$;

rollback;
