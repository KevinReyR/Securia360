create or replace function private.create_organization_standard_snapshot(
  p_organization_id uuid,
  p_snapshot_type text,
  p_reason text default null,
  p_snapshot_date date default current_date,
  p_classification_id uuid default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_snapshot_id uuid;
  v_classification_id uuid;
  v_profile_version_id uuid;
  v_actor uuid := (select auth.uid());
  v_item record;
begin
  if v_actor is null or not private.has_permission(p_organization_id, 'snapshots.create') then
    raise exception 'insufficient snapshot permission' using errcode = '42501';
  end if;
  if p_snapshot_type not in ('CURRENT_STATE','MONTHLY_SNAPSHOT','MANUAL_SNAPSHOT','CLASSIFICATION_CHANGE_SNAPSHOT') then
    raise exception 'invalid snapshot type' using errcode = '23514';
  end if;
  if p_snapshot_type = 'MANUAL_SNAPSHOT' and length(btrim(coalesce(p_reason, ''))) < 3 then
    raise exception 'manual snapshot requires a reason' using errcode = '23514';
  end if;
  select oc.id into v_classification_id
  from public.organization_classifications oc
  where oc.organization_id = p_organization_id
    and oc.id = coalesce(p_classification_id, oc.id)
    and oc.effective_to is null
  order by oc.effective_from desc limit 1;
  select spv.id into v_profile_version_id
  from public.standard_profile_versions spv
  where spv.standard_profile_id = (select oc.standard_profile_id from public.organization_classifications oc where oc.id = v_classification_id)
    and spv.status = 'published' and spv.expert_review_status = 'reviewed'
  order by spv.effective_from desc nulls last, spv.created_at desc limit 1;
  if v_classification_id is null or v_profile_version_id is null then
    raise exception 'snapshot requires current classification and reviewed published profile' using errcode = '23514';
  end if;
  insert into public.organization_standard_snapshots(
    organization_id,snapshot_type,snapshot_date,classification_id,standard_profile_version_id,
    rules_snapshot,source_snapshot,reason,created_by
  ) values (
    p_organization_id,p_snapshot_type,
    case when p_snapshot_type = 'MONTHLY_SNAPSHOT' then date_trunc('month',p_snapshot_date)::date else p_snapshot_date end,
    v_classification_id,v_profile_version_id,
    coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'code',r.rule_code,'version',r.version_number)) from public.applicability_rules r where r.status='active' and r.expert_review_status='reviewed'),'[]'::jsonb),
    jsonb_build_object('classification_id',v_classification_id,'profile_version_id',v_profile_version_id),
    nullif(btrim(coalesce(p_reason,'')),''),v_actor
  ) returning id into v_snapshot_id;
  for v_item in
    select ms.id,ms.code,ms.functional_description,ms.phva_cycle,ms.criterion,ms.expected_evidence,ps.weight
    from public.profile_standards ps
    join public.minimum_standards ms on ms.id=ps.minimum_standard_id
    where ps.standard_profile_version_id=v_profile_version_id
  loop
    insert into public.organization_standard_snapshot_items(
      snapshot_id,minimum_standard_id,organization_requirement_id,item_type,item_code,applicability_result,item_snapshot
    ) values (
      v_snapshot_id,v_item.id,null,'MINIMUM_STANDARD',v_item.code,'review_required',
      jsonb_build_object('minimum_standard_id',v_item.id,'code',v_item.code,'functional_description',v_item.functional_description,'phva_cycle',v_item.phva_cycle,'criterion',v_item.criterion,'expected_evidence',v_item.expected_evidence,'weight',v_item.weight,'standard_profile_version_id',v_profile_version_id)
    );
  end loop;
  for v_item in
    select r.id,r.code,r.title,r.summary,orq.id as organization_requirement_id,orq.result
    from public.organization_requirements orq join public.requirements r on r.id=orq.requirement_id
    where orq.organization_id=p_organization_id and orq.is_current
  loop
    insert into public.organization_standard_snapshot_items(
      snapshot_id,requirement_id,organization_requirement_id,item_type,item_code,applicability_result,item_snapshot
    ) values (
      v_snapshot_id,v_item.id,v_item.organization_requirement_id,'REQUIREMENT',v_item.code,v_item.result,
      jsonb_build_object('requirement_id',v_item.id,'code',v_item.code,'title',v_item.title,'summary',v_item.summary,'result',v_item.result)
    );
  end loop;
  return v_snapshot_id;
end;
$$;

create or replace function private.start_or_resume_initial_assessment(p_organization_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := (select auth.uid());
  v_classification_id uuid;
  v_profile_version_id uuid;
  v_scoring_rule_id uuid;
  v_snapshot_id uuid;
  v_assessment_id uuid;
begin
  if v_actor is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;
  if not private.has_permission(p_organization_id, 'assessments.manage')
     or not private.has_permission(p_organization_id, 'snapshots.create') then
    raise exception 'insufficient initial assessment permission' using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('initial-assessment:' || p_organization_id::text, 0)
  );

  select oc.id into v_classification_id
  from public.organization_classifications oc
  where oc.organization_id = p_organization_id and oc.effective_to is null
  order by oc.effective_from desc limit 1;
  if v_classification_id is null then
    raise exception 'current classification required' using errcode = '23514';
  end if;

  select spv.id into v_profile_version_id
  from public.organization_classifications oc
  join public.standard_profile_versions spv on spv.standard_profile_id = oc.standard_profile_id
  where oc.id = v_classification_id
    and spv.status = 'published'
    and spv.expert_review_status = 'reviewed'
  order by spv.effective_from desc nulls last, spv.created_at desc limit 1;
  if v_profile_version_id is null then
    raise exception 'reviewed published profile required' using errcode = '23514';
  end if;

  select sr.id into v_scoring_rule_id
  from public.assessment_scoring_rules sr
  where sr.standard_profile_version_id = v_profile_version_id
    and sr.status = 'approved'
    and sr.expert_review_status = 'reviewed'
  order by sr.version_number desc, sr.created_at desc limit 1;
  if v_scoring_rule_id is null then
    raise exception 'reviewed approved scoring rule required' using errcode = '23514';
  end if;

  select a.id into v_assessment_id
  from public.assessments a
  join public.organization_standard_snapshots s on s.id = a.snapshot_id
  where a.organization_id = p_organization_id
    and a.status in ('draft', 'in_progress')
    and a.standard_profile_version_id = v_profile_version_id
    and a.scoring_rule_id = v_scoring_rule_id
    and s.classification_id = v_classification_id
    and not exists (
      select 1 from public.assessment_items ai
      join public.organization_standard_snapshot_items si on si.id = ai.snapshot_item_id
      where ai.assessment_id = a.id
        and (si.item_type <> 'MINIMUM_STANDARD' or ai.response not in ('pending','met','not_met'))
    )
  order by a.created_at desc limit 1;
  if v_assessment_id is not null then return v_assessment_id; end if;

  v_snapshot_id := private.create_organization_standard_snapshot(
    p_organization_id, 'CURRENT_STATE', null, current_date, v_classification_id
  );
  insert into public.assessments (
    organization_id, snapshot_id, standard_profile_version_id,
    scoring_rule_id, responsible_user_id, status
  ) values (
    p_organization_id, v_snapshot_id, v_profile_version_id,
    v_scoring_rule_id, v_actor, 'draft'
  ) returning id into v_assessment_id;

  insert into public.assessment_items (assessment_id, snapshot_item_id)
  select v_assessment_id, si.id
  from public.organization_standard_snapshot_items si
  where si.snapshot_id = v_snapshot_id and si.item_type = 'MINIMUM_STANDARD';
  if not exists (select 1 from public.assessment_items ai where ai.assessment_id = v_assessment_id) then
    raise exception 'assessment requires snapshot items' using errcode = '23514';
  end if;
  return v_assessment_id;
end;
$$;

create or replace function private.save_initial_assessment_response(
  p_assessment_id uuid, p_item_id uuid, p_response text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := (select auth.uid());
  v_assessment public.assessments%rowtype;
begin
  select * into v_assessment from public.assessments
  where id = p_assessment_id for update;
  if not found then raise exception 'assessment not found' using errcode = 'P0002'; end if;
  if v_actor is null or not private.has_permission(v_assessment.organization_id, 'assessments.manage') then
    raise exception 'insufficient assessment permission' using errcode = '42501';
  end if;
  if v_assessment.status not in ('draft', 'in_progress') then
    raise exception 'assessment cannot be changed' using errcode = '55000';
  end if;
  if p_response not in ('met', 'not_met') then
    raise exception 'initial assessment response must be met or not_met' using errcode = '23514';
  end if;
  update public.assessment_items
  set response = p_response, updated_at = now()
  where id = p_item_id and assessment_id = p_assessment_id;
  if not found then raise exception 'assessment item not found' using errcode = 'P0002'; end if;
  if v_assessment.status = 'draft' then
    update public.assessments set status = 'in_progress' where id = p_assessment_id;
  end if;
  return p_item_id;
end;
$$;

create or replace function private.complete_initial_assessment(p_assessment_id uuid)
returns numeric language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := (select auth.uid());
  v_organization_id uuid;
begin
  select a.organization_id into v_organization_id
  from public.assessments a where a.id = p_assessment_id;
  if v_organization_id is null then raise exception 'assessment not found' using errcode = 'P0002'; end if;
  if v_actor is null or not private.has_permission(v_organization_id, 'assessments.manage') then
    raise exception 'insufficient assessment permission' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.assessment_items ai
    where ai.assessment_id = p_assessment_id and ai.response not in ('met', 'not_met')
  ) then
    raise exception 'all initial assessment responses are required' using errcode = '23514';
  end if;
  return private.complete_assessment(p_assessment_id);
end;
$$;

revoke all on function private.start_or_resume_initial_assessment(uuid) from public, anon, authenticated, service_role;
revoke all on function private.save_initial_assessment_response(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function private.complete_initial_assessment(uuid) from public, anon, authenticated, service_role;
grant execute on function private.start_or_resume_initial_assessment(uuid) to authenticated;
grant execute on function private.save_initial_assessment_response(uuid, uuid, text) to authenticated;
grant execute on function private.complete_initial_assessment(uuid) to authenticated;

create or replace function public.start_or_resume_initial_assessment(p_organization_id uuid)
returns uuid language sql security invoker set search_path = '' as $$
  select private.start_or_resume_initial_assessment(p_organization_id);
$$;
create or replace function public.save_initial_assessment_response(
  p_assessment_id uuid, p_item_id uuid, p_response text
)
returns uuid language sql security invoker set search_path = '' as $$
  select private.save_initial_assessment_response(p_assessment_id, p_item_id, p_response);
$$;
create or replace function public.complete_initial_assessment(p_assessment_id uuid)
returns numeric language sql security invoker set search_path = '' as $$
  select private.complete_initial_assessment(p_assessment_id);
$$;
revoke all on function public.start_or_resume_initial_assessment(uuid) from public, anon;
revoke all on function public.save_initial_assessment_response(uuid, uuid, text) from public, anon;
revoke all on function public.complete_initial_assessment(uuid) from public, anon;
grant execute on function public.start_or_resume_initial_assessment(uuid) to authenticated;
grant execute on function public.save_initial_assessment_response(uuid, uuid, text) to authenticated;
grant execute on function public.complete_initial_assessment(uuid) to authenticated;

create or replace view public.workspace_due_items with (security_invoker = true) as
select t.organization_id, 'task'::text as item_type, t.id as item_id, t.title,
  t.priority, t.due_at, t.status
from public.tasks t
where t.status not in ('completed', 'cancelled') and t.due_at is not null
union all
select a.organization_id, 'improvement'::text, a.id, a.title, a.priority,
  (a.target_date::timestamp at time zone 'America/Bogota'), a.status
from public.improvement_actions a
where a.status not in ('verified', 'cancelled') and a.target_date is not null
union all
select d.organization_id, 'document'::text, d.id, d.title, 'high'::text,
  d.expires_at, d.status
from public.documents d
where d.status = 'active' and d.expires_at is not null;
revoke all on public.workspace_due_items from public, anon;
grant select on public.workspace_due_items to authenticated;

notify pgrst, 'reload schema';
