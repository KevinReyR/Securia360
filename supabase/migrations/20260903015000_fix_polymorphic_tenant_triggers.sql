-- Fix inherited polymorphic trigger functions that referenced columns before
-- narrowing to the table that owns them. Authorization semantics are unchanged.

create or replace function private.validate_training_tenant_links()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='training_sessions' then
    if not exists(select 1 from public.training_plans where id=new.training_plan_id and organization_id=new.organization_id) then raise exception 'training plan belongs to another organization' using errcode='23514'; end if;
    if new.training_catalog_id is not null and not exists(select 1 from public.training_catalog where id=new.training_catalog_id and organization_id=new.organization_id) then raise exception 'training catalog item belongs to another organization' using errcode='23514'; end if;
    if new.evidence_document_version_id is not null and not exists(select 1 from public.document_versions where id=new.evidence_document_version_id and organization_id=new.organization_id) then raise exception 'training evidence belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='training_enrollments' then
    if not exists(select 1 from public.training_sessions where id=new.training_session_id and organization_id=new.organization_id) or not exists(select 1 from public.organization_members where id=new.organization_member_id and organization_id=new.organization_id and status='active') then raise exception 'training enrollment belongs to another organization or inactive member' using errcode='23514'; end if;
  elsif tg_table_name in ('training_attendances','training_evaluations','training_certificates') then
    if not exists(select 1 from public.training_enrollments where id=new.training_enrollment_id and organization_id=new.organization_id) then raise exception 'training result belongs to another organization' using errcode='23514'; end if;
    if new.evidence_document_version_id is not null and not exists(select 1 from public.document_versions where id=new.evidence_document_version_id and organization_id=new.organization_id) then raise exception 'training evidence belongs to another organization' using errcode='23514'; end if;
  end if;
  return new;
end; $$;

create or replace function private.validate_ppe_tenant_links()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='ppe_catalog_controls' then
    if not exists(select 1 from public.ppe_catalog where id=new.ppe_catalog_id and organization_id=new.organization_id) or not exists(select 1 from public.risk_controls where id=new.risk_control_id and organization_id=new.organization_id) then raise exception 'ppe control link belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='ppe_inventory' then
    if (new.site_id is not null and not exists(select 1 from public.sites where id=new.site_id and organization_id=new.organization_id)) or not exists(select 1 from public.ppe_catalog where id=new.ppe_catalog_id and organization_id=new.organization_id) then raise exception 'ppe inventory link belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='ppe_assignments' then
    if not exists(select 1 from public.organization_members where id=new.organization_member_id and organization_id=new.organization_id and status='active') or not exists(select 1 from public.ppe_catalog where id=new.ppe_catalog_id and organization_id=new.organization_id) or (new.site_id is not null and not exists(select 1 from public.sites where id=new.site_id and organization_id=new.organization_id)) then raise exception 'ppe assignment belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name='ppe_deliveries' then
    if not exists(select 1 from public.ppe_assignments where id=new.ppe_assignment_id and organization_id=new.organization_id) or not exists(select 1 from public.ppe_inventory where id=new.inventory_id and organization_id=new.organization_id) then raise exception 'ppe delivery belongs to another organization' using errcode='23514'; end if;
    if new.evidence_document_version_id is not null and not exists(select 1 from public.document_versions where id=new.evidence_document_version_id and organization_id=new.organization_id) then raise exception 'ppe evidence belongs to another organization' using errcode='23514'; end if;
  elsif tg_table_name in ('ppe_inspections','ppe_retirements') then
    if not exists(select 1 from public.ppe_assignments where id=new.ppe_assignment_id and organization_id=new.organization_id) then raise exception 'ppe event belongs to another organization' using errcode='23514'; end if;
    if new.evidence_document_version_id is not null and not exists(select 1 from public.document_versions where id=new.evidence_document_version_id and organization_id=new.organization_id) then raise exception 'ppe evidence belongs to another organization' using errcode='23514'; end if;
  end if;
  return new;
end; $$;

revoke all on function private.validate_training_tenant_links(),private.validate_ppe_tenant_links() from public,anon,authenticated,service_role;
notify pgrst,'reload schema';
