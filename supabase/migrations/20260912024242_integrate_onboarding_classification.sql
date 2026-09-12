-- Use the reviewed CIIU catalog as the onboarding classification source and
-- create the first current organization classification atomically.

alter table public.onboarding_progress drop constraint onboarding_progress_current_step_check;

update public.onboarding_progress
set current_step = case when completed_at is not null then 7 when current_step <= 2 then current_step else 3 end,
    draft_data = case when completed_at is null then draft_data - 'economic_activity' - 'ciiu' - 'risk' else draft_data end;

alter table public.onboarding_progress add constraint onboarding_progress_current_step_check check (current_step between 1 and 7);

create or replace function private.save_organization_onboarding_step(p_organization_id uuid, p_step smallint, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := (select auth.uid()); v_section text; v_progress public.onboarding_progress%rowtype;
begin
  if v_user_id is null then raise exception 'authenticated user required' using errcode = '42501'; end if;
  if not private.has_permission(p_organization_id, 'onboarding.manage') then raise exception 'insufficient onboarding permission' using errcode = '42501'; end if;
  if p_step not between 1 and 7 then raise exception 'onboarding step must be between 1 and 7' using errcode = '22023'; end if;
  v_section := (array['organization','legal_entity','classification','workforce','sites','responsible','characteristics'])[p_step];
  if (p_step = 5 and jsonb_typeof(p_data) <> 'array') or (p_step <> 5 and jsonb_typeof(p_data) <> 'object') then
    raise exception 'invalid onboarding step payload' using errcode = '22023';
  end if;
  insert into public.onboarding_progress(organization_id,current_step,draft_data,created_by,updated_by)
  values(p_organization_id,least(p_step + 1,7),jsonb_build_object(v_section,p_data),v_user_id,v_user_id)
  on conflict(organization_id) do update set
    current_step=greatest(public.onboarding_progress.current_step,excluded.current_step),
    draft_data=public.onboarding_progress.draft_data || excluded.draft_data,
    updated_by=excluded.updated_by
  where public.onboarding_progress.completed_at is null returning * into v_progress;
  if not found then raise exception 'onboarding is already completed' using errcode = '23505'; end if;
  return jsonb_build_object('current_step',v_progress.current_step,'draft_data',v_progress.draft_data);
end; $$;

create or replace function private.complete_organization_onboarding(p_organization_id uuid, p_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_progress public.onboarding_progress%rowtype;
  v_draft jsonb; v_organization jsonb; v_legal_entity jsonb; v_classification jsonb; v_workforce jsonb;
  v_responsible jsonb; v_characteristics jsonb; v_sites jsonb; v_site jsonb;
  v_site_id uuid; v_legal_entity_id uuid; v_responsible_member_id uuid; v_sst_role_id uuid;
  v_catalog_entry_id uuid; v_catalog_entry record; v_employee_count integer; v_profile_code text;
  v_standard_profile_id uuid; v_evaluator_version_id uuid;
  v_current_classification public.organization_classifications%rowtype; v_classification_id uuid;
  v_result jsonb; v_site_ids jsonb := '[]'::jsonb;
begin
  if v_user_id is null then raise exception 'authenticated user required' using errcode = '42501'; end if;
  if p_idempotency_key is null then raise exception 'idempotency key is required' using errcode = '22023'; end if;
  if not private.has_permission(p_organization_id,'onboarding.manage') then raise exception 'insufficient onboarding permission' using errcode = '42501'; end if;

  select * into v_progress from public.onboarding_progress where organization_id=p_organization_id for update;
  if not found then raise exception 'onboarding draft not found' using errcode = 'P0002'; end if;
  if v_progress.completed_at is not null then return v_progress.completion_result; end if;

  v_draft:=v_progress.draft_data; v_organization:=v_draft->'organization'; v_legal_entity:=v_draft->'legal_entity';
  v_classification:=v_draft->'classification'; v_workforce:=v_draft->'workforce'; v_sites:=v_draft->'sites';
  v_responsible:=v_draft->'responsible'; v_characteristics:=v_draft->'characteristics';
  if jsonb_typeof(v_organization)<>'object' or jsonb_typeof(v_legal_entity)<>'object'
     or jsonb_typeof(v_classification)<>'object' or jsonb_typeof(v_workforce)<>'object'
     or jsonb_typeof(v_sites)<>'array' or jsonb_array_length(v_sites)<1 or jsonb_array_length(v_sites)>50
     or jsonb_typeof(v_responsible)<>'object' or jsonb_typeof(v_characteristics)<>'object' then
    raise exception 'onboarding draft is incomplete' using errcode='22023';
  end if;
  if nullif(btrim(v_organization->>'name'),'') is null or nullif(btrim(v_organization->>'nit'),'') is null
     or nullif(btrim(v_legal_entity->>'legal_name'),'') is null or nullif(btrim(v_legal_entity->>'tax_id'),'') is null
     or length(btrim(v_organization->>'name'))>160 or length(btrim(v_organization->>'nit'))>40
     or length(btrim(v_legal_entity->>'legal_name'))>180 or length(btrim(v_legal_entity->>'tax_id'))>40 then
    raise exception 'onboarding source data is invalid' using errcode='22023';
  end if;
  begin
    v_catalog_entry_id:=nullif(btrim(v_classification->>'entry_id'),'')::uuid;
    v_employee_count:=(v_workforce->>'employee_count')::integer;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'onboarding classification source is invalid' using errcode='22023';
  end;
  if v_catalog_entry_id is null or v_employee_count<0 or v_employee_count>10000000 then
    raise exception 'onboarding classification source is invalid' using errcode='22023';
  end if;

  select e.id,e.display_code,e.risk_class,e.activity,cv.version_code as catalog_version,
         nsv.official_reference as source_reference,nsv.expert_review_status as source_review_status
  into v_catalog_entry
  from public_catalog.economic_activity_catalog_entries e
  join public_catalog.economic_activity_catalog_versions cv on cv.id=e.catalog_version_id
  join public.normative_source_versions nsv on nsv.id=cv.normative_source_version_id
  where e.id=v_catalog_entry_id and cv.status='active' and nsv.expert_review_status='reviewed';
  if not found then raise exception 'economic activity is not available in the reviewed active catalog' using errcode='22023'; end if;
  if (v_classification->>'ciiu_code') is distinct from v_catalog_entry.display_code
     or (v_classification->>'activity') is distinct from v_catalog_entry.activity
     or (v_classification->>'risk_class')::smallint is distinct from v_catalog_entry.risk_class
     or (v_classification->>'catalog_version') is distinct from v_catalog_entry.catalog_version
     or (v_classification->>'source_reference') is distinct from v_catalog_entry.source_reference
     or (v_classification->>'source_review_status') is distinct from v_catalog_entry.source_review_status then
    raise exception 'economic activity payload does not match the reviewed catalog' using errcode='22023';
  end if;
  if (select count(*)<>count(distinct upper(btrim(value->>'code'))) from jsonb_array_elements(v_sites)) then
    raise exception 'site codes must be unique' using errcode='23505';
  end if;
  begin v_responsible_member_id:=(v_responsible->>'member_id')::uuid;
  exception when invalid_text_representation then raise exception 'SST responsible is invalid' using errcode='22023'; end;
  if not exists(select 1 from public.organization_members om where om.id=v_responsible_member_id and om.organization_id=p_organization_id and om.status='active') then
    raise exception 'SST responsible must be an active organization member' using errcode='23503';
  end if;

  v_profile_code:=case
    when v_catalog_entry.risk_class between 1 and 3 and v_employee_count<=10 then 'RES0312_P07'
    when v_catalog_entry.risk_class between 1 and 3 and v_employee_count between 11 and 50 then 'RES0312_P21'
    else 'RES0312_P60' end;
  select sp.id into v_standard_profile_id from public.standard_profiles sp
  where sp.code=v_profile_code and sp.status='active' and exists(
    select 1 from public.standard_profile_versions spv
    join public.assessment_scoring_rules asr on asr.standard_profile_version_id=spv.id
      and asr.status='approved' and asr.expert_review_status='reviewed'
    where spv.standard_profile_id=sp.id and spv.status='published' and spv.expert_review_status='reviewed'
      and (spv.effective_from is null or spv.effective_from<=current_date)
      and (spv.effective_to is null or spv.effective_to>=current_date));
  if v_standard_profile_id is null then raise exception 'reviewed standard profile and scoring rule are not configured' using errcode='55000'; end if;
  select cev.id into v_evaluator_version_id from public.classification_evaluator_versions cev
  join public.classification_evaluators ce on ce.id=cev.evaluator_id
  where ce.code='SOURCE_DATA_REVIEW' and ce.status='active' and cev.expert_review_status='reviewed'
    and (cev.effective_from is null or cev.effective_from<=current_date)
    and (cev.effective_to is null or cev.effective_to>=current_date)
  order by cev.effective_from desc nulls last,cev.created_at desc limit 1;
  if v_evaluator_version_id is null then raise exception 'reviewed classification evaluator is not configured' using errcode='55000'; end if;

  update public.organizations set name=btrim(v_organization->>'name'),nit=btrim(v_organization->>'nit'),updated_by=v_user_id where id=p_organization_id;
  insert into public.legal_entities(organization_id,legal_name,trade_name,tax_id,ciiu_code,economic_activity,employee_count,risk_class,created_by,updated_by)
  values(p_organization_id,btrim(v_legal_entity->>'legal_name'),nullif(btrim(v_legal_entity->>'trade_name'),''),btrim(v_legal_entity->>'tax_id'),
         v_catalog_entry.display_code,v_catalog_entry.activity,v_employee_count,v_catalog_entry.risk_class,v_user_id,v_user_id)
  on conflict(organization_id,tax_id) do update set legal_name=excluded.legal_name,trade_name=excluded.trade_name,ciiu_code=excluded.ciiu_code,
    economic_activity=excluded.economic_activity,employee_count=excluded.employee_count,risk_class=excluded.risk_class,updated_by=excluded.updated_by
  returning id into v_legal_entity_id;

  for v_site in select value from jsonb_array_elements(v_sites) loop
    if nullif(btrim(v_site->>'name'),'') is null or nullif(btrim(v_site->>'code'),'') is null
       or length(btrim(v_site->>'name'))>140 or length(btrim(v_site->>'code'))>30 then
      raise exception 'site name and code are required' using errcode='22023';
    end if;
    insert into public.sites(organization_id,legal_entity_id,name,code,address,city,department,risk_class,created_by,updated_by)
    values(p_organization_id,v_legal_entity_id,btrim(v_site->>'name'),upper(btrim(v_site->>'code')),nullif(btrim(v_site->>'address'),''),
      nullif(btrim(v_site->>'city'),''),nullif(btrim(v_site->>'department'),''),v_catalog_entry.risk_class,v_user_id,v_user_id)
    on conflict(organization_id,code) do update set legal_entity_id=excluded.legal_entity_id,name=excluded.name,address=excluded.address,
      city=excluded.city,department=excluded.department,risk_class=excluded.risk_class,updated_by=excluded.updated_by returning id into strict v_site_id;
    v_site_ids:=v_site_ids||jsonb_build_array(v_site_id);
  end loop;

  insert into public.organization_characteristics(organization_id,work_at_height,confined_spaces,chemical_exposure,electrical_work,
    transport_operations,heavy_machinery,night_work,remote_work,manual_load_handling,created_by,updated_by)
  values(p_organization_id,coalesce((v_characteristics->>'work_at_height')::boolean,false),coalesce((v_characteristics->>'confined_spaces')::boolean,false),
    coalesce((v_characteristics->>'chemical_exposure')::boolean,false),coalesce((v_characteristics->>'electrical_work')::boolean,false),
    coalesce((v_characteristics->>'transport_operations')::boolean,false),coalesce((v_characteristics->>'heavy_machinery')::boolean,false),
    coalesce((v_characteristics->>'night_work')::boolean,false),coalesce((v_characteristics->>'remote_work')::boolean,false),
    coalesce((v_characteristics->>'manual_load_handling')::boolean,false),v_user_id,v_user_id)
  on conflict(organization_id) do update set work_at_height=excluded.work_at_height,confined_spaces=excluded.confined_spaces,
    chemical_exposure=excluded.chemical_exposure,electrical_work=excluded.electrical_work,transport_operations=excluded.transport_operations,
    heavy_machinery=excluded.heavy_machinery,night_work=excluded.night_work,remote_work=excluded.remote_work,
    manual_load_handling=excluded.manual_load_handling,updated_by=excluded.updated_by;

  select id into v_sst_role_id from public.roles where organization_id is null and code='sst_manager';
  if v_sst_role_id is null then raise exception 'sst_manager system role is not configured'; end if;
  insert into public.member_roles(organization_id,organization_member_id,role_id,created_by)
  values(p_organization_id,v_responsible_member_id,v_sst_role_id,v_user_id)
  on conflict on constraint member_roles_assignment_key do nothing;

  select * into v_current_classification from public.organization_classifications
  where organization_id=p_organization_id and scope_key='organization' and effective_to is null for update;
  if found then
    if v_current_classification.employee_count is distinct from v_employee_count
       or v_current_classification.risk_class is distinct from v_catalog_entry.risk_class
       or v_current_classification.ciiu_code is distinct from v_catalog_entry.display_code
       or v_current_classification.economic_activity is distinct from v_catalog_entry.activity
       or v_current_classification.standard_profile_id is distinct from v_standard_profile_id then
      raise exception 'current classification conflicts with onboarding data' using errcode='23505';
    end if;
    v_classification_id:=v_current_classification.id;
  else
    insert into public.organization_classifications(organization_id,scope_key,employee_count,risk_class,ciiu_code,economic_activity,
      standard_profile_id,evaluator_version_id,explanation,effective_from,change_reason,confirmed_by,confirmed_at)
    values(p_organization_id,'organization',v_employee_count,v_catalog_entry.risk_class,v_catalog_entry.display_code,v_catalog_entry.activity,
      v_standard_profile_id,v_evaluator_version_id,jsonb_build_object('source','organization_onboarding','economic_activity_entry_id',v_catalog_entry.id,
      'catalog_version',v_catalog_entry.catalog_version,'source_reference',v_catalog_entry.source_reference,
      'source_review_status',v_catalog_entry.source_review_status,'profile_rule',v_profile_code,'employee_count',v_employee_count,
      'risk_class',v_catalog_entry.risk_class,'ciiu_code',v_catalog_entry.display_code),current_date,'onboarding_completed',v_user_id,now())
    returning id into v_classification_id;
  end if;

  perform private.enqueue_domain_event(p_organization_id,'classification.changed','organization_classification',v_classification_id,
    jsonb_build_object('scope_key','organization','reason','onboarding_completed','standard_profile_code',v_profile_code,
      'economic_activity_entry_id',v_catalog_entry.id,'requires_human_review',false),p_idempotency_key);
  v_result:=jsonb_build_object('organization_id',p_organization_id,'legal_entity_id',v_legal_entity_id,'site_ids',v_site_ids,
    'responsible_member_id',v_responsible_member_id,'classification_id',v_classification_id,'standard_profile_code',v_profile_code,'completed_at',now());
  update public.onboarding_progress set current_step=7,completion_idempotency_key=p_idempotency_key,completion_result=v_result,
    completed_at=now(),completed_by=v_user_id,updated_by=v_user_id where organization_id=p_organization_id;
  return v_result;
end; $$;

revoke all on function private.save_organization_onboarding_step(uuid,smallint,jsonb) from public,anon;
revoke all on function private.complete_organization_onboarding(uuid,uuid) from public,anon;
grant execute on function private.save_organization_onboarding_step(uuid,smallint,jsonb) to authenticated,service_role;
grant execute on function private.complete_organization_onboarding(uuid,uuid) to authenticated,service_role;
comment on function private.complete_organization_onboarding(uuid,uuid) is 'Completes onboarding and creates the reviewed, current initial classification atomically.';
notify pgrst,'reload schema';
