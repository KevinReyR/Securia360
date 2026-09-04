-- Continue the forward-only repair of inherited polymorphic tenant validators.
-- Each branch now touches only columns present on its trigger table. Tenant and
-- evidence checks are preserved; no permission or grant is broadened.

create or replace function private.validate_contractor_links()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='contracts' then
    if not exists(select 1 from public.contractor_organizations where id=new.contractor_organization_id and organization_id=new.organization_id) then raise exception 'contractor belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='contract_site_accesses' then
    if not exists(select 1 from public.contracts where id=new.contract_id and organization_id=new.organization_id) or not exists(select 1 from public.sites where id=new.site_id and organization_id=new.organization_id) then raise exception 'contract site belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='contractor_workers' then
    if not exists(select 1 from public.contractor_organizations where id=new.contractor_organization_id and organization_id=new.organization_id) or (new.site_id is not null and not exists(select 1 from public.sites where id=new.site_id and organization_id=new.organization_id)) then raise exception 'contractor worker belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='contract_document_requirements' then
    if not exists(select 1 from public.contracts where id=new.contract_id and organization_id=new.organization_id) then raise exception 'contract document requirement belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='contract_document_submissions' then
    if not exists(select 1 from public.contract_document_requirements where id=new.contract_document_requirement_id and organization_id=new.organization_id) or not exists(select 1 from public.document_versions where id=new.document_version_id and organization_id=new.organization_id) then raise exception 'contract document belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='contract_evaluations' then
    if not exists(select 1 from public.contracts where id=new.contract_id and organization_id=new.organization_id) then raise exception 'contract evaluation belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='contractor_portal_accesses' then
    if not exists(select 1 from public.contractor_contacts c join public.contracts k on k.contractor_organization_id=c.contractor_organization_id where c.id=new.contractor_contact_id and c.organization_id=new.organization_id and k.id=new.contract_id and k.organization_id=new.organization_id) or (new.site_id is not null and not exists(select 1 from public.contract_site_accesses where contract_id=new.contract_id and site_id=new.site_id and organization_id=new.organization_id and status='approved')) then raise exception 'portal access scope is invalid' using errcode='23514'; end if;
  end if;
  return new;
end; $$;

create or replace function private.validate_incident_links()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='incident_sensitive_details' then
    if not exists(select 1 from public.incidents where id=new.incident_id and organization_id=new.organization_id) then raise exception 'incident detail belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='incident_people' then
    if not exists(select 1 from public.incidents where id=new.incident_id and organization_id=new.organization_id) or (new.organization_member_id is not null and not exists(select 1 from public.organization_members where id=new.organization_member_id and organization_id=new.organization_id)) then raise exception 'incident person belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='incident_investigations' then
    if not exists(select 1 from public.incidents where id=new.incident_id and organization_id=new.organization_id) then raise exception 'incident investigation belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='incident_causes' then
    if not exists(select 1 from public.incident_investigations where id=new.incident_investigation_id and organization_id=new.organization_id) then raise exception 'incident cause belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='incident_actions' then
    if not exists(select 1 from public.incidents where id=new.incident_id and organization_id=new.organization_id) then raise exception 'incident resource belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name in ('incident_evidences','incident_communications') then
    if not exists(select 1 from public.incidents where id=new.incident_id and organization_id=new.organization_id) then raise exception 'incident resource belongs to another organization' using errcode='23514'; end if;
    if new.document_version_id is not null and not exists(select 1 from public.document_versions where id=new.document_version_id and organization_id=new.organization_id) then raise exception 'incident evidence belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='incident_export_templates' then
    if new.document_version_id is not null and not exists(select 1 from public.document_versions where id=new.document_version_id and organization_id=new.organization_id) then raise exception 'incident evidence belongs to another organization' using errcode='23514'; end if;
  end if;
  return new;
end; $$;

create or replace function private.validate_emergency_links()
returns trigger language plpgsql security definer set search_path='' as $$
declare linked_org uuid;
begin
  if tg_table_name in ('emergency_scenarios','emergency_resources','emergency_brigades','emergency_plan_versions','emergency_drills','emergency_directory_entries') then
    select organization_id into linked_org from public.sites where id=new.site_id;
    if linked_org is null or linked_org<>new.organization_id then raise exception 'emergency record belongs to another organization' using errcode='23514'; end if;
    if tg_table_name='emergency_plan_versions' then
      if new.document_version_id is not null and not exists(select 1 from public.document_versions where id=new.document_version_id and organization_id=new.organization_id) then raise exception 'emergency plan evidence belongs to another organization' using errcode='23514'; end if;
    elsif tg_table_name='emergency_drills' then
      if (new.emergency_scenario_id is not null and not exists(select 1 from public.emergency_scenarios where id=new.emergency_scenario_id and organization_id=new.organization_id and site_id=new.site_id)) or (new.emergency_plan_version_id is not null and not exists(select 1 from public.emergency_plan_versions where id=new.emergency_plan_version_id and organization_id=new.organization_id and site_id=new.site_id)) then raise exception 'emergency drill dependency belongs to another site or organization' using errcode='23514'; end if;
    end if;
  elsif tg_table_name='emergency_brigade_members' then
    if not exists(select 1 from public.emergency_brigades where id=new.emergency_brigade_id and organization_id=new.organization_id) or not exists(select 1 from public.organization_members where id=new.organization_member_id and organization_id=new.organization_id) then raise exception 'emergency brigade member belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name in ('emergency_drill_results','emergency_findings') then
    if not exists(select 1 from public.emergency_drills where id=new.emergency_drill_id and organization_id=new.organization_id) then raise exception 'emergency record belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='emergency_actions' then
    if not exists(select 1 from public.emergency_findings where id=new.emergency_finding_id and organization_id=new.organization_id) then raise exception 'emergency action finding belongs to another organization' using errcode='23514'; end if;
    if new.improvement_action_id is not null and not exists(select 1 from public.improvement_actions where id=new.improvement_action_id and organization_id=new.organization_id) then raise exception 'emergency action improvement link belongs to another organization' using errcode='23514'; end if;
    if new.evidence_document_version_id is not null and not exists(select 1 from public.document_versions where id=new.evidence_document_version_id and organization_id=new.organization_id) then raise exception 'emergency action evidence belongs to another organization' using errcode='23514'; end if;
  end if;
  return new;
end; $$;

create or replace function private.validate_automation_links()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='automation_rule_versions' then
    if not exists(select 1 from public.automation_rules where id=new.automation_rule_id and organization_id=new.organization_id) then raise exception 'automation version belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='automation_executions' then
    if not exists(select 1 from public.automation_rule_versions where id=new.automation_rule_version_id and organization_id=new.organization_id) or not exists(select 1 from public.domain_events where id=new.domain_event_id and organization_id=new.organization_id) then raise exception 'automation execution belongs to another organization' using errcode='23514'; end if;
  end if;
  return new;
end; $$;

-- Governance uses one function across many record shapes. Keep all supplemental
-- validations inside their owning branch so absent fields are never referenced.
create or replace function private.validate_governance_links()
returns trigger language plpgsql security definer set search_path='' as $$
declare related_org uuid;
begin
  if tg_table_name='committee_periods' then
    select organization_id into related_org from public.committees where id=new.committee_id;
    if related_org is null or related_org<>new.organization_id or not exists(select 1 from public.committees c where c.id=new.committee_id and (c.site_id is null or exists(select 1 from public.sites s where s.id=c.site_id and s.organization_id=new.organization_id))) then raise exception 'committee belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='committee_members' then
    select organization_id into related_org from public.committee_periods where id=new.committee_period_id;
    if related_org is null or related_org<>new.organization_id or not exists(select 1 from public.organization_members where id=new.organization_member_id and organization_id=new.organization_id) then raise exception 'committee member belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='committee_meetings' then select organization_id into related_org from public.committee_periods where id=new.committee_period_id;
  elsif tg_table_name='meeting_minutes' then select organization_id into related_org from public.committee_meetings where id=new.committee_meeting_id;
  elsif tg_table_name='committee_commitments' then
    select organization_id into related_org from public.meeting_minutes where id=new.meeting_minutes_id;
    if new.task_id is not null and not exists(select 1 from public.tasks where id=new.task_id and organization_id=new.organization_id) then raise exception 'committee commitment task belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='audit_engagements' then select organization_id into related_org from public.audit_programs where id=new.audit_program_id;
  elsif tg_table_name in ('audit_team_members','audit_agenda_items','audit_checklists','audit_findings','audit_reports') then select organization_id into related_org from public.audit_engagements where id=new.audit_engagement_id;
  elsif tg_table_name='audit_evidences' then
    select organization_id into related_org from public.audit_engagements where id=new.audit_engagement_id;
    if not exists(select 1 from public.document_versions where id=new.document_version_id and organization_id=new.organization_id) then raise exception 'audit evidence belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='audit_actions' then
    select organization_id into related_org from public.audit_findings where id=new.audit_finding_id;
    if (new.task_id is not null and not exists(select 1 from public.tasks where id=new.task_id and organization_id=new.organization_id)) or (new.improvement_action_id is not null and not exists(select 1 from public.improvement_actions where id=new.improvement_action_id and organization_id=new.organization_id)) or (new.evidence_document_version_id is not null and not exists(select 1 from public.document_versions where id=new.evidence_document_version_id and organization_id=new.organization_id)) then raise exception 'audit action link belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name in ('management_review_entries','management_review_decisions') then select organization_id into related_org from public.management_reviews where id=new.management_review_id;
  elsif tg_table_name='management_review_commitments' then
    select organization_id into related_org from public.management_reviews where id=new.management_review_id;
    if new.task_id is not null and not exists(select 1 from public.tasks where id=new.task_id and organization_id=new.organization_id) then raise exception 'management review task belongs to another organization' using errcode='23514'; end if;
  else return new;
  end if;
  if related_org is null or related_org<>new.organization_id then raise exception 'related record belongs to another organization' using errcode='23514'; end if;
  return new;
end; $$;

revoke all on function private.validate_contractor_links(),private.validate_incident_links(),private.validate_emergency_links(),private.validate_automation_links(),private.validate_governance_links() from public,anon,authenticated,service_role;
notify pgrst,'reload schema';
