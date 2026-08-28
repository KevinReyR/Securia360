-- Contractor portal hardening. Portal identities are never organization members.
alter table public.contract_document_submissions add column submitted_by uuid references auth.users(id) on delete set null;
create index contract_submissions_author_idx on public.contract_document_submissions(organization_id, submitted_by, submitted_at desc);

create or replace function private.can_access_contract_requirement(p_requirement_id uuid)
returns boolean language sql security definer set search_path='' stable as $$
  select exists(select 1 from public.contract_document_requirements r where r.id=p_requirement_id and private.is_contractor_portal_user(r.organization_id,r.contract_id));
$$;
create or replace function private.validate_contractor_submission_author()
returns trigger language plpgsql security definer set search_path='' as $$
declare requirement_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'authentication required' using errcode='42501'; end if;
  if new.submitted_by is distinct from (select auth.uid()) then raise exception 'submission author must be the authenticated contractor' using errcode='42501'; end if;
  if not private.can_access_contract_requirement(new.contract_document_requirement_id) and not private.has_permission(new.organization_id,'contractors.manage') then raise exception 'contract requirement access denied' using errcode='42501'; end if;
  select d.entity_id into requirement_id from public.document_versions v join public.documents d on d.id=v.document_id where v.id=new.document_version_id and v.organization_id=new.organization_id and d.organization_id=new.organization_id and d.entity_type='contract_document_requirement';
  if requirement_id is distinct from new.contract_document_requirement_id then raise exception 'contractor document does not belong to the requirement' using errcode='23514'; end if;
  return new;
end;
$$;
create or replace function private.lock_contractor_transitions()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_table_name='contract_document_submissions' then
    if old.status in ('approved','rejected','expired') and row(new.*) is distinct from row(old.*) then raise exception 'reviewed contractor submission is immutable' using errcode='55000'; end if;
    if new.status in ('approved','rejected','expired') and old.status='submitted' then
      if not private.has_permission(new.organization_id,'contractors.approve') then raise exception 'contractor approval permission required' using errcode='42501'; end if;
      new.reviewed_at:=now(); new.reviewed_by:=(select auth.uid());
    end if;
  elsif tg_table_name='contract_site_accesses' and new.status='approved' and old.status<>'approved' then
    if not private.has_permission(new.organization_id,'contractors.approve') then raise exception 'contractor approval permission required' using errcode='42501'; end if;
    new.approved_at:=now(); new.approved_by:=(select auth.uid());
  elsif tg_table_name='contract_evaluations' and new.status in ('approved','rejected') and old.status<>new.status then
    if not private.has_permission(new.organization_id,'contractors.approve') then raise exception 'contractor approval permission required' using errcode='42501'; end if;
    new.evaluated_at:=now(); new.evaluated_by:=(select auth.uid());
  elsif tg_table_name='contracts' and new.status='active' and old.status<>'active' then
    if not private.has_permission(new.organization_id,'contractors.approve') then raise exception 'contract activation permission required' using errcode='42501'; end if;
  end if;
  return new;
end;
$$;
revoke all on function private.can_access_contract_requirement(uuid),private.validate_contractor_submission_author(),private.lock_contractor_transitions() from public,anon,authenticated,service_role;

drop policy if exists contractor_submissions_read on public.contract_document_submissions;
drop policy if exists contractor_submissions_portal_insert on public.contract_document_submissions;
create policy contractor_submissions_read on public.contract_document_submissions for select to authenticated using (
  (select private.has_permission(organization_id,'contractors.read')) or submitted_by=(select auth.uid())
);
create policy contractor_submissions_portal_insert on public.contract_document_submissions for insert to authenticated with check (
  submitted_by=(select auth.uid()) and (select private.can_access_contract_requirement(contract_document_requirement_id))
);
create policy contractor_portal_site_read on public.contract_site_accesses for select to authenticated using (
  exists(select 1 from public.contractor_portal_accesses a join public.contractor_contacts c on c.id=a.contractor_contact_id where a.contract_id=contract_site_accesses.contract_id and a.site_id=contract_site_accesses.site_id and a.status='active' and c.status='active' and c.user_id=(select auth.uid()))
);
create policy contractor_portal_document_read on public.documents for select to authenticated using (
  entity_type='contract_document_requirement' and (select private.can_access_contract_requirement(entity_id))
);
create policy contractor_portal_document_insert on public.documents for insert to authenticated with check (
  entity_type='contract_document_requirement' and (select private.can_access_contract_requirement(entity_id))
);
create policy contractor_portal_version_read on public.document_versions for select to authenticated using (
  exists(select 1 from public.documents d where d.id=document_id and d.organization_id=document_versions.organization_id and d.entity_type='contract_document_requirement' and private.can_access_contract_requirement(d.entity_id))
);
create policy contractor_portal_version_insert on public.document_versions for insert to authenticated with check (
  exists(select 1 from public.documents d where d.id=document_id and d.organization_id=document_versions.organization_id and d.entity_type='contract_document_requirement' and private.can_access_contract_requirement(d.entity_id))
);
create policy contractor_portal_storage_read on storage.objects for select to authenticated using (
  bucket_id='evidences' and (storage.foldername(name))[2]='contract_document_requirement' and (select private.can_access_contract_requirement((storage.foldername(name))[3]::uuid))
);
create policy contractor_portal_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id='evidences' and (storage.foldername(name))[2]='contract_document_requirement' and (select private.can_access_contract_requirement((storage.foldername(name))[3]::uuid))
);

create trigger contractor_submission_author before insert on public.contract_document_submissions for each row execute function private.validate_contractor_submission_author();
create trigger contractor_submission_transition before update on public.contract_document_submissions for each row execute function private.lock_contractor_transitions();
create trigger contractor_site_transition before update on public.contract_site_accesses for each row execute function private.lock_contractor_transitions();
create trigger contractor_evaluation_transition before update on public.contract_evaluations for each row execute function private.lock_contractor_transitions();
create trigger contractor_contract_transition before update on public.contracts for each row execute function private.lock_contractor_transitions();
create trigger contractor_contacts_audit after insert or update on public.contractor_contacts for each row execute function private.capture_core_audit();
create trigger contractor_accesses_audit after insert or update on public.contractor_portal_accesses for each row execute function private.capture_core_audit();
create trigger contractor_requirements_audit after insert or update on public.contract_document_requirements for each row execute function private.capture_core_audit();
notify pgrst,'reload schema';
