-- Sensitive incident and occupational-health workflow hardening.  This migration
-- deliberately does not delete legacy data or create clinical records.
alter table public.occupational_health_decisions
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists incidents_org_closed_idx on public.incidents(organization_id,status,closed_at desc);
create index if not exists incident_investigations_org_status_idx on public.incident_investigations(organization_id,status);
create index if not exists health_decisions_org_status_idx on public.occupational_health_decisions(organization_id,status,created_at desc);

create or replace function private.validate_sensitive_document_owner()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.entity_type='incident_evidence' and not exists (
    select 1 from public.incidents i where i.id=new.entity_id and i.organization_id=new.organization_id
  ) then
    raise exception 'incident evidence belongs to another organization' using errcode='23514';
  end if;
  if new.entity_type='occupational_health' and not exists (
    select 1 from public.organization_members m where m.id=new.entity_id and m.organization_id=new.organization_id
  ) then
    raise exception 'occupational-health evidence belongs to another organization' using errcode='23514';
  end if;
  return new;
end;
$$;

create or replace function private.enforce_incident_workflow()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='incidents' then
    if old.status in ('closed','cancelled') and new.status is distinct from old.status then
      raise exception 'closed incident is immutable' using errcode='23514';
    end if;
    if new.status='closed' and old.status is distinct from 'closed' then
      if not private.has_permission(new.organization_id,'incidents.close') then
        raise exception 'incident close permission required' using errcode='42501';
      end if;
      if not exists(select 1 from public.incident_investigations x where x.incident_id=new.id and x.status='closed')
         or exists(select 1 from public.incident_actions a where a.incident_id=new.id and a.status not in ('verified','cancelled')) then
        raise exception 'incident cannot be closed until investigation and actions are complete' using errcode='23514';
      end if;
      new.closed_at:=now(); new.closed_by:=(select auth.uid());
    end if;
  elsif tg_table_name='incident_investigations' then
    if old.status='closed' and new.status is distinct from old.status then raise exception 'closed investigation is immutable' using errcode='23514'; end if;
    if new.status='closed' and old.status is distinct from 'closed' and not private.has_permission(new.organization_id,'incidents.close') then raise exception 'incident close permission required' using errcode='42501'; end if;
  elsif tg_table_name='incident_actions' then
    if old.status in ('verified','cancelled') and new.status is distinct from old.status then raise exception 'final incident action is immutable' using errcode='23514'; end if;
    if new.status='verified' and old.status is distinct from 'verified' and not private.has_permission(new.organization_id,'incidents.close') then raise exception 'incident close permission required' using errcode='42501'; end if;
  end if;
  return new;
end;
$$;

create or replace function private.enforce_health_minimum_data()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='incident_sensitive_details' and tg_op='INSERT' and new.health_information_note is not null then
    raise exception 'new health-information free text is not permitted' using errcode='23514';
  end if;
  if tg_table_name='occupational_health_decisions' then
    if tg_op='INSERT' then
      new.created_by := (select auth.uid());
      if new.created_by is null then raise exception 'authenticated creator required' using errcode='42501'; end if;
      if new.status <> 'pending_human_confirmation' then raise exception 'health decision must await human confirmation' using errcode='23514'; end if;
    elsif old.status in ('confirmed','cancelled') and new.status is distinct from old.status then
      raise exception 'final health decision is immutable' using errcode='23514';
    elsif new.status='confirmed' and old.status is distinct from 'confirmed' then
      if not private.has_permission(new.organization_id,'occupational_health.confirm') then raise exception 'human confirmation permission required' using errcode='42501'; end if;
      if old.created_by is not null and old.created_by=(select auth.uid()) then raise exception 'a different authorized user must confirm the decision' using errcode='42501'; end if;
      new.confirmed_by := (select auth.uid()); new.confirmed_at:=now();
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.validate_sensitive_document_owner(),private.enforce_incident_workflow(),private.enforce_health_minimum_data() from public,anon,authenticated,service_role;

drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated using (
  (entity_type not in ('incident_evidence','occupational_health') and (select private.has_permission(organization_id,'documents.read')))
  or (entity_type='incident_evidence' and (select private.has_permission(organization_id,'incidents.sensitive')))
  or (entity_type='occupational_health' and (select private.has_permission(organization_id,'occupational_health.medical')))
);
drop policy if exists document_versions_select on public.document_versions;
create policy document_versions_select on public.document_versions for select to authenticated using (
  exists(select 1 from public.documents d where d.id=document_versions.document_id and d.organization_id=document_versions.organization_id)
);
create policy incident_sensitive_documents_insert on public.documents for insert to authenticated with check (
  entity_type='incident_evidence' and (select private.has_permission(organization_id,'incidents.manage'))
);
create policy health_sensitive_documents_insert on public.documents for insert to authenticated with check (
  entity_type='occupational_health' and (select private.has_permission(organization_id,'occupational_health.medical'))
);
create policy incident_sensitive_versions_insert on public.document_versions for insert to authenticated with check (
  exists(select 1 from public.documents d where d.id=document_versions.document_id and d.organization_id=document_versions.organization_id and d.entity_type='incident_evidence' and private.has_permission(d.organization_id,'incidents.manage'))
);
create policy health_sensitive_versions_insert on public.document_versions for insert to authenticated with check (
  exists(select 1 from public.documents d where d.id=document_versions.document_id and d.organization_id=document_versions.organization_id and d.entity_type='occupational_health' and private.has_permission(d.organization_id,'occupational_health.medical'))
);
drop policy if exists documents_storage_select on storage.objects;
create policy documents_storage_select on storage.objects for select to authenticated using (
  bucket_id in ('organization-documents','evidences') and (
    ((storage.foldername(name))[2] not in ('incident_evidence','occupational_health') and (select private.has_permission((storage.foldername(name))[1]::uuid,'documents.read')))
    or ((storage.foldername(name))[2]='incident_evidence' and (select private.has_permission((storage.foldername(name))[1]::uuid,'incidents.sensitive')))
    or ((storage.foldername(name))[2]='occupational_health' and (select private.has_permission((storage.foldername(name))[1]::uuid,'occupational_health.medical')))
  )
);
create policy incident_sensitive_storage_insert on storage.objects for insert to authenticated with check (bucket_id='evidences' and (storage.foldername(name))[2]='incident_evidence' and (select private.has_permission((storage.foldername(name))[1]::uuid,'incidents.manage')));
create policy health_sensitive_storage_insert on storage.objects for insert to authenticated with check (bucket_id='evidences' and (storage.foldername(name))[2]='occupational_health' and (select private.has_permission((storage.foldername(name))[1]::uuid,'occupational_health.medical')));

drop policy if exists fitness_concepts_read on public.occupational_fitness_concepts;
create policy fitness_concepts_read on public.occupational_fitness_concepts for select to authenticated using ((select private.has_permission(organization_id,'occupational_health.medical')));

create trigger sensitive_document_owner before insert or update on public.documents for each row when (new.entity_type in ('incident_evidence','occupational_health')) execute function private.validate_sensitive_document_owner();
create trigger incident_workflow before update on public.incidents for each row execute function private.enforce_incident_workflow();
create trigger investigation_workflow before update on public.incident_investigations for each row execute function private.enforce_incident_workflow();
create trigger incident_action_workflow before update on public.incident_actions for each row execute function private.enforce_incident_workflow();
create trigger sensitive_note_minimum before insert or update on public.incident_sensitive_details for each row execute function private.enforce_health_minimum_data();
create trigger health_decision_human_confirmation before insert or update on public.occupational_health_decisions for each row execute function private.enforce_health_minimum_data();

create trigger incident_people_audit after insert or update on public.incident_people for each row execute function private.capture_core_audit();
create trigger incident_investigation_audit after insert or update on public.incident_investigations for each row execute function private.capture_core_audit();
create trigger incident_cause_audit after insert or update on public.incident_causes for each row execute function private.capture_core_audit();
create trigger incident_communication_audit after insert or update on public.incident_communications for each row execute function private.capture_core_audit();
create trigger health_program_audit after insert or update on public.health_surveillance_programs for each row execute function private.capture_core_audit();
create trigger health_enrollment_audit after insert or update on public.health_program_enrollments for each row execute function private.capture_core_audit();

notify pgrst,'reload schema';
