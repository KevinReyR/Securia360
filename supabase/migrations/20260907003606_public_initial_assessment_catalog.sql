-- Public, read-only catalog for the browser-only initial SG-SST assessment.
-- The function deliberately returns a narrow projection of reviewed content.
-- It does not expose tenant data, review decisions or formal assessments.

create or replace function public.get_public_initial_assessment_catalog()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'schemaVersion', 1,
    'generatedAt', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'profiles', coalesce(jsonb_agg(profile_payload order by profile_code), '[]'::jsonb)
  )
  from (
    select
      p.code as profile_code,
      jsonb_build_object(
        'code', p.code,
        'name', p.name,
        'description', p.description,
        'versionCode', pv.version_code,
        'source', jsonb_build_object(
          'title', ns.title,
          'versionCode', nsv.version_code,
          'officialReference', nsv.official_reference,
          'officialUrl', nsv.official_url
        ),
        'scoring', jsonb_build_object(
          'code', sr.code,
          'versionNumber', sr.version_number,
          'multipliers', jsonb_build_object(
            'met', (sr.response_multipliers ->> 'met')::numeric,
            'notMet', (sr.response_multipliers ->> 'not_met')::numeric
          )
        ),
        'standards', jsonb_agg(
          jsonb_build_object(
            'code', ms.code,
            'title', ms.functional_description,
            'phvaCycle', ms.phva_cycle,
            'criterion', ms.criterion,
            'expectedEvidence', ms.expected_evidence,
            'weight', ps.weight
          )
          order by string_to_array(ms.code, '.')::integer[]
        )
      ) as profile_payload
    from public.standard_profiles p
    cross join lateral (
      select candidate.*
      from public.standard_profile_versions candidate
      where candidate.standard_profile_id = p.id
        and candidate.status = 'published'
        and candidate.expert_review_status = 'reviewed'
      order by candidate.effective_from desc nulls last, candidate.created_at desc
      limit 1
    ) pv
    cross join lateral (
      select candidate.*
      from public.assessment_scoring_rules candidate
      where candidate.standard_profile_version_id = pv.id
        and candidate.status = 'approved'
        and candidate.expert_review_status = 'reviewed'
        and (candidate.response_multipliers ->> 'met')::numeric = 100
        and (candidate.response_multipliers ->> 'not_met')::numeric = 0
      order by candidate.version_number desc
      limit 1
    ) sr
    join public.profile_standards ps on ps.standard_profile_version_id = pv.id
    join public.minimum_standards ms
      on ms.id = ps.minimum_standard_id
     and ms.status = 'active'
     and ms.expert_review_status = 'reviewed'
    join public.normative_source_versions nsv
      on nsv.id = ms.normative_source_version_id
     and nsv.status = 'published'
     and nsv.expert_review_status = 'reviewed'
    join public.normative_sources ns
      on ns.id = nsv.source_id
     and ns.status = 'active'
     and ns.code = 'RESOLUCION_0312_2019'
    where p.status = 'active'
      and p.code in ('RES0312_P07', 'RES0312_P21', 'RES0312_P60')
    group by
      p.code,
      p.name,
      p.description,
      pv.version_code,
      ns.title,
      nsv.version_code,
      nsv.official_reference,
      nsv.official_url,
      sr.code,
      sr.version_number,
      sr.response_multipliers
    having count(*) in (7, 21, 60)
       and sum(ps.weight) = 100
  ) published_profiles;
$$;

revoke all on function public.get_public_initial_assessment_catalog() from public, anon, authenticated, service_role;
grant execute on function public.get_public_initial_assessment_catalog() to anon, authenticated;

comment on function public.get_public_initial_assessment_catalog() is
  'Returns only reviewed and published Resolution 0312 catalog content for the browser-only public assessment. No user or tenant data is accepted or returned.';

notify pgrst, 'reload schema';
