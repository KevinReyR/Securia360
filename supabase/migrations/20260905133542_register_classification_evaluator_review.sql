-- Register the classification evaluator as a separately reviewable artifact.
-- Approval is performed through public.decide_normative_review after this migration.

alter table public.normative_review_artifacts
  add column if not exists classification_evaluator_version_id uuid
    references public.classification_evaluator_versions(id) on delete restrict;

alter table public.normative_review_artifacts
  drop constraint if exists normative_review_artifacts_artifact_type_check;

alter table public.normative_review_artifacts
  add constraint normative_review_artifacts_artifact_type_check
  check (artifact_type in (
    'NORMATIVE_SOURCE_VERSION','REQUIREMENT','MINIMUM_STANDARD',
    'STANDARD_PROFILE_VERSION','PROFILE_STANDARD','APPLICABILITY_RULE',
    'ASSESSMENT_SCORING_RULE','CLASSIFICATION_EVALUATOR_VERSION',
    'RISK_METHODOLOGY_VERSION','RISK_METHODOLOGY_FORMULA',
    'RISK_METHODOLOGY_INTERPRETATION_RULE','UI_TEXT','ASSUMPTION','TEST_CASE'
  ));

alter table public.normative_review_artifacts
  drop constraint if exists normative_review_artifacts_check;

alter table public.normative_review_artifacts
  add constraint normative_review_artifacts_check
  check (
    (artifact_type in ('UI_TEXT','ASSUMPTION','TEST_CASE')
      and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,
        standard_profile_version_id,profile_standard_id,applicability_rule_id,
        assessment_scoring_rule_id,classification_evaluator_version_id,
        risk_methodology_version_id,risk_methodology_formula_id,
        risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'NORMATIVE_SOURCE_VERSION' and normative_source_version_id is not null and num_nonnulls(requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,classification_evaluator_version_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'REQUIREMENT' and requirement_id is not null and num_nonnulls(normative_source_version_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,classification_evaluator_version_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'MINIMUM_STANDARD' and minimum_standard_id is not null and num_nonnulls(normative_source_version_id,requirement_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,classification_evaluator_version_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'STANDARD_PROFILE_VERSION' and standard_profile_version_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,classification_evaluator_version_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'PROFILE_STANDARD' and profile_standard_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,applicability_rule_id,assessment_scoring_rule_id,classification_evaluator_version_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'APPLICABILITY_RULE' and applicability_rule_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,assessment_scoring_rule_id,classification_evaluator_version_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'ASSESSMENT_SCORING_RULE' and assessment_scoring_rule_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,classification_evaluator_version_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'CLASSIFICATION_EVALUATOR_VERSION' and classification_evaluator_version_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'RISK_METHODOLOGY_VERSION' and risk_methodology_version_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,classification_evaluator_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'RISK_METHODOLOGY_FORMULA' and risk_methodology_formula_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,classification_evaluator_version_id,risk_methodology_version_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'RISK_METHODOLOGY_INTERPRETATION_RULE' and risk_methodology_interpretation_rule_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,classification_evaluator_version_id,risk_methodology_version_id,risk_methodology_formula_id) = 0)
  );

create index if not exists normative_review_artifacts_classification_evaluator_idx
  on public.normative_review_artifacts(classification_evaluator_version_id);

create or replace function private.sync_classification_evaluator_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.artifact_type = 'CLASSIFICATION_EVALUATOR_VERSION'
     and new.classification_evaluator_version_id is not null
     and new.review_status is distinct from old.review_status then
    update public.classification_evaluator_versions
    set expert_review_status = case
      when new.review_status = 'approved' then 'reviewed'
      when new.review_status = 'reviewed' then 'reviewed'
      when new.review_status = 'rejected' then 'pending'
      else expert_review_status
    end
    where id = new.classification_evaluator_version_id;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_classification_evaluator_review() from public, anon, authenticated, service_role;

drop trigger if exists normative_review_artifacts_sync_classification_evaluator
  on public.normative_review_artifacts;
create trigger normative_review_artifacts_sync_classification_evaluator
  after update of review_status on public.normative_review_artifacts
  for each row execute function private.sync_classification_evaluator_review();

insert into public.normative_review_artifacts(
  artifact_type, artifact_key, title, source_path, content_snapshot,
  classification_evaluator_version_id, created_by
)
select
  'CLASSIFICATION_EVALUATOR_VERSION',
  'classification-evaluator-version:' || v.id,
  e.code || ' · ' || v.version_code,
  'classification_evaluator_versions',
  jsonb_build_object(
    'evaluator_code', e.code,
    'evaluator_name', e.name,
    'version_code', v.version_code,
    'rules_summary', v.rules_summary,
    'notice', 'La aprobación requiere criterio humano; no declara cumplimiento legal.'
  ),
  v.id,
  r.user_id
from public.classification_evaluator_versions v
join public.classification_evaluators e on e.id = v.evaluator_id
cross join lateral (
  select user_id
  from public.normative_reviewer_roles
  where role = 'review_admin' and status = 'active'
  order by granted_at
  limit 1
) r
where e.code = 'SOURCE_DATA_REVIEW'
  and v.version_code = 'v1'
  and not exists (
    select 1 from public.normative_review_artifacts a
    where a.classification_evaluator_version_id = v.id
  );

do $$
begin
  if not exists (
    select 1
    from public.normative_review_artifacts a
    join public.classification_evaluator_versions v
      on v.id = a.classification_evaluator_version_id
    join public.classification_evaluators e on e.id = v.evaluator_id
    where a.artifact_type = 'CLASSIFICATION_EVALUATOR_VERSION'
      and e.code = 'SOURCE_DATA_REVIEW'
      and v.version_code = 'v1'
  ) then
    raise exception 'classification evaluator review artifact was not registered';
  end if;
end;
$$;

notify pgrst, 'reload schema';
