-- Site-scoped emergency access and private evidence hardening.
create or replace function private.emergency_document_site(p_organization_id uuid, p_entity_type text, p_entity_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  if p_entity_type='emergency_resource' then select site_id into result from public.emergency_resources where id=p_entity_id and organization_id=p_organization_id;
  elsif p_entity_type='emergency_plan_version' then select site_id into result from public.emergency_plan_versions where id=p_entity_id and organization_id=p_organization_id;
  elsif p_entity_type='emergency_action' then select d.site_id into result from public.emergency_actions a join public.emergency_findings f on f.id=a.emergency_finding_id join public.emergency_drills d on d.id=f.emergency_drill_id where a.id=p_entity_id and a.organization_id=p_organization_id;
  end if;
  return result;
end;
$$;

create or replace function private.validate_emergency_document_owner()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.entity_type in ('emergency_resource','emergency_plan_version','emergency_action') and private.emergency_document_site(new.organization_id,new.entity_type,new.entity_id) is null then
    raise exception 'emergency document belongs to another organization or site' using errcode='23514';
  end if;
  return new;
end;
$$;

create or replace function private.emit_emergency_lifecycle_event()
returns trigger language plpgsql security definer set search_path='' as $$
declare site uuid; event_type text;
begin
  if tg_table_name='emergency_plan_versions' and new.status='approved' and (tg_op='INSERT' or old.status is distinct from 'approved') then
    event_type:='emergency.plan.approved'; site:=new.site_id;
  elsif tg_table_name='emergency_actions' and new.status='verified' and (tg_op='INSERT' or old.status is distinct from 'verified') then
    event_type:='emergency.action.verified'; select d.site_id into site from public.emergency_findings f join public.emergency_drills d on d.id=f.emergency_drill_id where f.id=new.emergency_finding_id;
  else return new;
  end if;
  perform private.enqueue_domain_event(new.organization_id,event_type,tg_table_name,new.id,jsonb_build_object('site_id',site),new.id);
  return new;
end;
$$;

create or replace function private.enforce_emergency_plan_immutability()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if old.status in ('approved','archived') and row(new.*) is distinct from row(old.*) then raise exception 'published emergency plan version is immutable; create a successor version' using errcode='55000'; end if;
  return new;
end;
$$;

revoke all on function private.emergency_document_site(uuid,text,uuid),private.validate_emergency_document_owner(),private.emit_emergency_lifecycle_event(),private.enforce_emergency_plan_immutability() from public,anon,authenticated,service_role;
grant execute on function private.emergency_document_site(uuid,text,uuid) to authenticated;

-- Replace organization-only policies with site-aware policies for every exposed table.
drop policy if exists emergency_scenarios_read on public.emergency_scenarios; drop policy if exists emergency_scenarios_write on public.emergency_scenarios;
create policy emergency_scenarios_read on public.emergency_scenarios for select to authenticated using ((select private.has_permission(organization_id,'emergencies.read',site_id)));
create policy emergency_scenarios_write on public.emergency_scenarios for all to authenticated using ((select private.has_permission(organization_id,'emergencies.manage',site_id))) with check ((select private.has_permission(organization_id,'emergencies.manage',site_id)));
drop policy if exists emergency_resources_read on public.emergency_resources; drop policy if exists emergency_resources_write on public.emergency_resources;
create policy emergency_resources_read on public.emergency_resources for select to authenticated using ((select private.has_permission(organization_id,'emergencies.read',site_id)));
create policy emergency_resources_write on public.emergency_resources for all to authenticated using ((select private.has_permission(organization_id,'emergencies.manage',site_id))) with check ((select private.has_permission(organization_id,'emergencies.manage',site_id)));
drop policy if exists emergency_brigades_read on public.emergency_brigades; drop policy if exists emergency_brigades_write on public.emergency_brigades;
create policy emergency_brigades_read on public.emergency_brigades for select to authenticated using ((select private.has_permission(organization_id,'emergencies.read',site_id)));
create policy emergency_brigades_write on public.emergency_brigades for all to authenticated using ((select private.has_permission(organization_id,'emergencies.manage',site_id))) with check ((select private.has_permission(organization_id,'emergencies.manage',site_id)));
drop policy if exists emergency_plan_versions_read on public.emergency_plan_versions; drop policy if exists emergency_plan_versions_write on public.emergency_plan_versions;
create policy emergency_plan_versions_read on public.emergency_plan_versions for select to authenticated using ((select private.has_permission(organization_id,'emergencies.read',site_id)));
create policy emergency_plan_versions_write on public.emergency_plan_versions for all to authenticated using ((select private.has_permission(organization_id,'emergencies.manage',site_id))) with check ((select private.has_permission(organization_id,'emergencies.manage',site_id)));
drop policy if exists emergency_drills_read on public.emergency_drills; drop policy if exists emergency_drills_write on public.emergency_drills;
create policy emergency_drills_read on public.emergency_drills for select to authenticated using ((select private.has_permission(organization_id,'emergencies.read',site_id)));
create policy emergency_drills_write on public.emergency_drills for all to authenticated using ((select private.has_permission(organization_id,'emergencies.manage',site_id))) with check ((select private.has_permission(organization_id,'emergencies.manage',site_id)));
drop policy if exists emergency_directory_read on public.emergency_directory_entries; drop policy if exists emergency_directory_write on public.emergency_directory_entries;
create policy emergency_directory_read on public.emergency_directory_entries for select to authenticated using ((select private.has_permission(organization_id,'emergencies.directory_read',site_id)));
create policy emergency_directory_write on public.emergency_directory_entries for all to authenticated using ((select private.has_permission(organization_id,'emergencies.manage',site_id))) with check ((select private.has_permission(organization_id,'emergencies.manage',site_id)));
drop policy if exists emergency_brigade_members_read on public.emergency_brigade_members; drop policy if exists emergency_brigade_members_write on public.emergency_brigade_members;
create policy emergency_brigade_members_read on public.emergency_brigade_members for select to authenticated using (exists(select 1 from public.emergency_brigades b where b.id=emergency_brigade_id and private.has_permission(organization_id,'emergencies.read',b.site_id)));
create policy emergency_brigade_members_write on public.emergency_brigade_members for all to authenticated using (exists(select 1 from public.emergency_brigades b where b.id=emergency_brigade_id and private.has_permission(organization_id,'emergencies.manage',b.site_id))) with check (exists(select 1 from public.emergency_brigades b where b.id=emergency_brigade_id and private.has_permission(organization_id,'emergencies.manage',b.site_id)));
drop policy if exists emergency_drill_results_read on public.emergency_drill_results; drop policy if exists emergency_drill_results_write on public.emergency_drill_results;
create policy emergency_drill_results_read on public.emergency_drill_results for select to authenticated using (exists(select 1 from public.emergency_drills d where d.id=emergency_drill_id and private.has_permission(organization_id,'emergencies.read',d.site_id)));
create policy emergency_drill_results_write on public.emergency_drill_results for all to authenticated using (exists(select 1 from public.emergency_drills d where d.id=emergency_drill_id and private.has_permission(organization_id,'emergencies.manage',d.site_id))) with check (exists(select 1 from public.emergency_drills d where d.id=emergency_drill_id and private.has_permission(organization_id,'emergencies.manage',d.site_id)));
drop policy if exists emergency_findings_read on public.emergency_findings; drop policy if exists emergency_findings_write on public.emergency_findings;
create policy emergency_findings_read on public.emergency_findings for select to authenticated using (exists(select 1 from public.emergency_drills d where d.id=emergency_drill_id and private.has_permission(organization_id,'emergencies.read',d.site_id)));
create policy emergency_findings_write on public.emergency_findings for all to authenticated using (exists(select 1 from public.emergency_drills d where d.id=emergency_drill_id and private.has_permission(organization_id,'emergencies.manage',d.site_id))) with check (exists(select 1 from public.emergency_drills d where d.id=emergency_drill_id and private.has_permission(organization_id,'emergencies.manage',d.site_id)));
drop policy if exists emergency_actions_read on public.emergency_actions; drop policy if exists emergency_actions_write on public.emergency_actions;
create policy emergency_actions_read on public.emergency_actions for select to authenticated using (private.emergency_document_site(organization_id,'emergency_action',id) is not null and private.has_permission(organization_id,'emergencies.read',private.emergency_document_site(organization_id,'emergency_action',id)));
create policy emergency_actions_write on public.emergency_actions for all to authenticated using (private.emergency_document_site(organization_id,'emergency_action',id) is not null and private.has_permission(organization_id,'emergencies.manage',private.emergency_document_site(organization_id,'emergency_action',id))) with check (private.emergency_document_site(organization_id,'emergency_action',id) is not null and private.has_permission(organization_id,'emergencies.manage',private.emergency_document_site(organization_id,'emergency_action',id)));

drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated using (
  (entity_type not in ('incident_evidence','occupational_health','emergency_resource','emergency_plan_version','emergency_action') and (select private.has_permission(organization_id,'documents.read')))
  or (entity_type='incident_evidence' and (select private.has_permission(organization_id,'incidents.sensitive')))
  or (entity_type='occupational_health' and (select private.has_permission(organization_id,'occupational_health.medical')))
  or (entity_type in ('emergency_resource','emergency_plan_version','emergency_action') and private.has_permission(organization_id,'emergencies.read',private.emergency_document_site(organization_id,entity_type,entity_id)))
);
create policy emergency_documents_insert on public.documents for insert to authenticated with check (entity_type in ('emergency_resource','emergency_plan_version','emergency_action') and private.has_permission(organization_id,'emergencies.manage',private.emergency_document_site(organization_id,entity_type,entity_id)));
create policy emergency_versions_insert on public.document_versions for insert to authenticated with check (exists(select 1 from public.documents d where d.id=document_versions.document_id and d.organization_id=document_versions.organization_id and d.entity_type in ('emergency_resource','emergency_plan_version','emergency_action') and private.has_permission(d.organization_id,'emergencies.manage',private.emergency_document_site(d.organization_id,d.entity_type,d.entity_id))));
drop policy if exists documents_storage_select on storage.objects;
create policy documents_storage_select on storage.objects for select to authenticated using (bucket_id in ('organization-documents','evidences') and ((storage.foldername(name))[2] not in ('incident_evidence','occupational_health','emergency_resource','emergency_plan_version','emergency_action') and private.has_permission((storage.foldername(name))[1]::uuid,'documents.read')) or ((storage.foldername(name))[2]='incident_evidence' and private.has_permission((storage.foldername(name))[1]::uuid,'incidents.sensitive')) or ((storage.foldername(name))[2]='occupational_health' and private.has_permission((storage.foldername(name))[1]::uuid,'occupational_health.medical')) or ((storage.foldername(name))[2] in ('emergency_resource','emergency_plan_version','emergency_action') and private.has_permission((storage.foldername(name))[1]::uuid,'emergencies.read',private.emergency_document_site((storage.foldername(name))[1]::uuid,(storage.foldername(name))[2],(storage.foldername(name))[3]::uuid))));
create policy emergency_storage_insert on storage.objects for insert to authenticated with check (bucket_id='evidences' and (storage.foldername(name))[2] in ('emergency_resource','emergency_plan_version','emergency_action') and private.has_permission((storage.foldername(name))[1]::uuid,'emergencies.manage',private.emergency_document_site((storage.foldername(name))[1]::uuid,(storage.foldername(name))[2],(storage.foldername(name))[3]::uuid)));

create trigger emergency_document_owner before insert or update on public.documents for each row when (new.entity_type in ('emergency_resource','emergency_plan_version','emergency_action')) execute function private.validate_emergency_document_owner();
create trigger emergency_plan_immutable before update on public.emergency_plan_versions for each row execute function private.enforce_emergency_plan_immutability();
create trigger emergency_plan_event after insert or update of status on public.emergency_plan_versions for each row execute function private.emit_emergency_lifecycle_event();
create trigger emergency_action_event after insert or update of status on public.emergency_actions for each row execute function private.emit_emergency_lifecycle_event();
create trigger emergency_scenario_audit after insert or update on public.emergency_scenarios for each row execute function private.capture_core_audit();
create trigger emergency_resource_audit after insert or update on public.emergency_resources for each row execute function private.capture_core_audit();
create trigger emergency_brigade_audit after insert or update on public.emergency_brigades for each row execute function private.capture_core_audit();
create trigger emergency_brigade_member_audit after insert or update on public.emergency_brigade_members for each row execute function private.capture_core_audit();
create trigger emergency_directory_audit after insert or update on public.emergency_directory_entries for each row execute function private.capture_core_audit();
notify pgrst,'reload schema';
