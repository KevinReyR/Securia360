-- Close integrity gaps in normative tenant workflows. All privileged logic stays
-- in private; public RPC wrappers are security-invoker entry points for Data API.

create or replace function private.capture_snapshot_item_audit()
returns trigger language plpgsql security definer set search_path='' as $$
declare tenant_id uuid;
begin
  select organization_id into tenant_id from public.organization_standard_snapshots where id = coalesce(new.snapshot_id, old.snapshot_id);
  insert into public.audit_log(organization_id,actor_user_id,action,entity_type,entity_id,before_data,after_data,ip_address)
  values(tenant_id,(select auth.uid()),lower(tg_op),tg_table_name,coalesce(new.id,old.id),case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end,inet_client_addr());
  if tg_op='DELETE' then return old; end if;
  return new;
end; $$;

create or replace function private.capture_assessment_item_audit()
returns trigger language plpgsql security definer set search_path='' as $$
declare tenant_id uuid;
begin
  select organization_id into tenant_id from public.assessments where id = coalesce(new.assessment_id, old.assessment_id);
  insert into public.audit_log(organization_id,actor_user_id,action,entity_type,entity_id,before_data,after_data,ip_address)
  values(tenant_id,(select auth.uid()),lower(tg_op),tg_table_name,coalesce(new.id,old.id),case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end,inet_client_addr());
  if tg_op='DELETE' then return old; end if;
  return new;
end; $$;

create or replace function private.validate_assessment_links()
returns trigger language plpgsql security definer set search_path='' as $$
declare snapshot_org uuid; snapshot_profile uuid;
begin
  select organization_id, standard_profile_version_id into snapshot_org, snapshot_profile from public.organization_standard_snapshots where id=new.snapshot_id;
  if snapshot_org is null or snapshot_org <> new.organization_id then raise exception 'assessment snapshot must belong to organization' using errcode='23514'; end if;
  if snapshot_profile is null or snapshot_profile <> new.standard_profile_version_id then raise exception 'assessment profile must match snapshot' using errcode='23514'; end if;
  if not exists(select 1 from public.assessment_scoring_rules where id=new.scoring_rule_id and standard_profile_version_id=new.standard_profile_version_id) then raise exception 'assessment scoring rule must match profile' using errcode='23514'; end if;
  return new;
end; $$;

create or replace function private.validate_assessment_item_links()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not exists (
    select 1 from public.assessments a
    join public.organization_standard_snapshot_items i on i.snapshot_id=a.snapshot_id
    where a.id=new.assessment_id and i.id=new.snapshot_item_id
  ) then raise exception 'assessment item must belong to assessment snapshot' using errcode='23514'; end if;
  return new;
end; $$;

create or replace function private.reject_classification_change(p_proposal_id uuid, p_note text)
returns uuid language plpgsql security definer set search_path='' as $$
declare proposal public.classification_change_proposals%rowtype; actor uuid := (select auth.uid());
begin
  select * into proposal from public.classification_change_proposals where id=p_proposal_id for update;
  if not found then raise exception 'proposal not found' using errcode='P0002'; end if;
  if actor is null or not private.has_permission(proposal.organization_id,'classifications.manage') then raise exception 'insufficient classification permission' using errcode='42501'; end if;
  if proposal.status <> 'pending_review' then raise exception 'proposal already reviewed' using errcode='23505'; end if;
  if length(btrim(coalesce(p_note,''))) < 3 then raise exception 'review note is required' using errcode='23514'; end if;
  update public.classification_change_proposals set status='rejected',reviewed_by=actor,reviewed_at=now(),review_note=p_note where id=proposal.id;
  return proposal.id;
end; $$;

create or replace function private.create_organization_standard_snapshot(p_organization_id uuid,p_snapshot_type text,p_reason text default null,p_snapshot_date date default current_date,p_classification_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare snapshot_id uuid; classification_id uuid; profile_version_id uuid; actor uuid := (select auth.uid()); item record;
begin
  if actor is null or not private.has_permission(p_organization_id,'snapshots.create') then raise exception 'insufficient snapshot permission' using errcode='42501'; end if;
  if p_snapshot_type not in ('CURRENT_STATE','MONTHLY_SNAPSHOT','MANUAL_SNAPSHOT','CLASSIFICATION_CHANGE_SNAPSHOT') then raise exception 'invalid snapshot type' using errcode='23514'; end if;
  if p_snapshot_type='MANUAL_SNAPSHOT' and length(btrim(coalesce(p_reason,''))) < 3 then raise exception 'manual snapshot requires a reason' using errcode='23514'; end if;
  select id into classification_id from public.organization_classifications where organization_id=p_organization_id and id=coalesce(p_classification_id,id) and effective_to is null order by effective_from desc limit 1;
  select spv.id into profile_version_id from public.standard_profile_versions spv where spv.standard_profile_id=(select standard_profile_id from public.organization_classifications where id=classification_id) and spv.status='published' and spv.expert_review_status='reviewed' order by spv.effective_from desc nulls last limit 1;
  if classification_id is null or profile_version_id is null then raise exception 'snapshot requires current classification and reviewed published profile' using errcode='23514'; end if;
  insert into public.organization_standard_snapshots(organization_id,snapshot_type,snapshot_date,classification_id,standard_profile_version_id,rules_snapshot,source_snapshot,reason,created_by)
  values(p_organization_id,p_snapshot_type,case when p_snapshot_type='MONTHLY_SNAPSHOT' then date_trunc('month',p_snapshot_date)::date else p_snapshot_date end,classification_id,profile_version_id,
    coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'code',r.rule_code,'version',r.version_number)) from public.applicability_rules r where r.status='active' and r.expert_review_status='reviewed'),'[]'::jsonb),
    jsonb_build_object('classification_id',classification_id,'profile_version_id',profile_version_id),nullif(btrim(coalesce(p_reason,'')),''),actor) returning id into snapshot_id;
  for item in select ms.id,ms.code from public.profile_standards ps join public.minimum_standards ms on ms.id=ps.minimum_standard_id where ps.standard_profile_version_id=profile_version_id loop
    insert into public.organization_standard_snapshot_items(snapshot_id,minimum_standard_id,organization_requirement_id,item_type,item_code,applicability_result,item_snapshot)
    values(snapshot_id,item.id,null,'MINIMUM_STANDARD',item.code,'review_required',jsonb_build_object('minimum_standard_id',item.id,'code',item.code));
  end loop;
  for item in select r.id,r.code,orq.id as organization_requirement_id,orq.result from public.organization_requirements orq join public.requirements r on r.id=orq.requirement_id where orq.organization_id=p_organization_id and orq.is_current loop
    insert into public.organization_standard_snapshot_items(snapshot_id,requirement_id,organization_requirement_id,item_type,item_code,applicability_result,item_snapshot)
    values(snapshot_id,item.id,item.organization_requirement_id,'REQUIREMENT',item.code,item.result,jsonb_build_object('requirement_id',item.id,'code',item.code,'result',item.result));
  end loop;
  return snapshot_id;
end; $$;

revoke all on function private.capture_snapshot_item_audit() from public,anon,authenticated,service_role;
revoke all on function private.capture_assessment_item_audit() from public,anon,authenticated,service_role;
revoke all on function private.validate_assessment_links() from public,anon,authenticated,service_role;
revoke all on function private.validate_assessment_item_links() from public,anon,authenticated,service_role;
revoke all on function private.reject_classification_change(uuid,text) from public,anon,authenticated,service_role;
revoke all on function private.create_organization_standard_snapshot(uuid,text,text,date,uuid) from public,anon,authenticated,service_role;
grant execute on function private.reject_classification_change(uuid,text), private.create_organization_standard_snapshot(uuid,text,text,date,uuid) to authenticated;

create or replace function public.approve_classification_change(p_proposal_id uuid) returns uuid language sql security invoker set search_path='' as $$ select private.approve_classification_change(p_proposal_id); $$;
create or replace function public.reject_classification_change(p_proposal_id uuid,p_note text) returns uuid language sql security invoker set search_path='' as $$ select private.reject_classification_change(p_proposal_id,p_note); $$;
create or replace function public.evaluate_organization_applicability(p_organization_id uuid,p_as_of date default current_date) returns integer language sql security invoker set search_path='' as $$ select private.evaluate_organization_applicability(p_organization_id,p_as_of); $$;
create or replace function public.complete_assessment(p_assessment_id uuid) returns numeric language sql security invoker set search_path='' as $$ select private.complete_assessment(p_assessment_id); $$;
create or replace function public.create_organization_standard_snapshot(p_organization_id uuid,p_snapshot_type text,p_reason text default null,p_snapshot_date date default current_date,p_classification_id uuid default null) returns uuid language sql security invoker set search_path='' as $$ select private.create_organization_standard_snapshot(p_organization_id,p_snapshot_type,p_reason,p_snapshot_date,p_classification_id); $$;
revoke all on function public.approve_classification_change(uuid),public.reject_classification_change(uuid,text),public.evaluate_organization_applicability(uuid,date),public.complete_assessment(uuid),public.create_organization_standard_snapshot(uuid,text,text,date,uuid) from public,anon;
grant execute on function public.approve_classification_change(uuid),public.reject_classification_change(uuid,text),public.evaluate_organization_applicability(uuid,date),public.complete_assessment(uuid),public.create_organization_standard_snapshot(uuid,text,text,date,uuid) to authenticated;

create trigger organization_classifications_audit after insert or update on public.organization_classifications for each row execute function private.capture_core_audit();
create trigger classification_proposals_audit after insert or update on public.classification_change_proposals for each row execute function private.capture_core_audit();
create trigger organization_requirements_audit after insert or update on public.organization_requirements for each row execute function private.capture_core_audit();
create trigger snapshot_items_audit after insert or update or delete on public.organization_standard_snapshot_items for each row execute function private.capture_snapshot_item_audit();
create trigger assessments_links before insert or update on public.assessments for each row execute function private.validate_assessment_links();
create trigger assessment_items_links before insert or update on public.assessment_items for each row execute function private.validate_assessment_item_links();
create trigger assessment_items_audit after insert or update or delete on public.assessment_items for each row execute function private.capture_assessment_item_audit();

revoke insert on public.organization_standard_snapshots, public.organization_standard_snapshot_items from authenticated;
drop policy if exists snapshots_insert on public.organization_standard_snapshots;
drop policy if exists snapshot_items_insert on public.organization_standard_snapshot_items;
notify pgrst, 'reload schema';
