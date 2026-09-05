-- Transactional regression test for Resolution 0312 review synchronization.
-- Run only against a database that has an active normative reviewer.
-- Every mutation is rolled back.

begin;

select set_config(
  'request.jwt.claim.sub',
  (
    select user_id::text
    from public.normative_reviewer_roles
    where status = 'active'
    order by case role when 'review_admin' then 0 else 1 end, granted_at
    limit 1
  ),
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

-- Approving only the profile version must not publish an incomplete profile.
select public.decide_normative_review(
  a.id,
  'approved',
  'Transactional partial-approval regression test.'
)
from public.normative_review_artifacts a
join public.standard_profile_versions pv on pv.id = a.standard_profile_version_id
join public.standard_profiles p on p.id = pv.standard_profile_id
where p.code = 'RES0312_P07'
  and pv.version_code = '1.0.0';

do $$
begin
  if exists(
    select 1
    from public.standard_profile_versions pv
    join public.standard_profiles p on p.id = pv.standard_profile_id
    where p.code = 'RES0312_P07'
      and pv.version_code = '1.0.0'
      and pv.status <> 'draft'
  ) then
    raise exception 'partial approval published RES0312_P07 unexpectedly';
  end if;
end;
$$;

-- Approve the seven standards and their seven profile associations.
select public.decide_normative_review(
  a.id,
  'approved',
  'Transactional standard approval regression test.'
)
from public.normative_review_artifacts a
join public.minimum_standards ms on ms.id = a.minimum_standard_id
join public.profile_standards ps on ps.minimum_standard_id = ms.id
join public.standard_profile_versions pv on pv.id = ps.standard_profile_version_id
join public.standard_profiles p on p.id = pv.standard_profile_id
where p.code = 'RES0312_P07'
  and pv.version_code = '1.0.0';

select public.decide_normative_review(
  a.id,
  'approved',
  'Transactional association approval regression test.'
)
from public.normative_review_artifacts a
join public.profile_standards ps on ps.id = a.profile_standard_id
join public.standard_profile_versions pv on pv.id = ps.standard_profile_version_id
join public.standard_profiles p on p.id = pv.standard_profile_id
where p.code = 'RES0312_P07'
  and pv.version_code = '1.0.0';

do $$
begin
  if not exists(
    select 1
    from public.standard_profile_versions pv
    join public.standard_profiles p on p.id = pv.standard_profile_id
    where p.code = 'RES0312_P07'
      and pv.version_code = '1.0.0'
      and pv.status = 'published'
      and pv.expert_review_status = 'reviewed'
  ) then
    raise exception 'complete approval did not publish RES0312_P07';
  end if;

  if exists(
    select 1
    from public.standard_profile_versions pv
    join public.standard_profiles p on p.id = pv.standard_profile_id
    where p.code in ('RES0312_P21', 'RES0312_P60')
      and pv.version_code = '1.0.0'
      and pv.status <> 'draft'
  ) then
    raise exception 'approval leaked to a different profile';
  end if;
end;
$$;

-- Scoring approval synchronizes its operational state independently.
select public.decide_normative_review(
  a.id,
  'approved',
  'Transactional scoring approval regression test.'
)
from public.normative_review_artifacts a
join public.assessment_scoring_rules r on r.id = a.assessment_scoring_rule_id
where r.code = 'RES0312_P07_SCORING'
  and r.version_number = 1;

do $$
begin
  if not exists(
    select 1
    from public.assessment_scoring_rules
    where code = 'RES0312_P07_SCORING'
      and version_number = 1
      and status = 'approved'
      and expert_review_status = 'reviewed'
  ) then
    raise exception 'scoring approval did not synchronize operational state';
  end if;
end;
$$;

rollback;
