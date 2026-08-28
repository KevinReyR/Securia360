-- Governance workflow hardening: human attestations, audit independence and immutable approvals.
create table public.meeting_minute_signatures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  meeting_minutes_id uuid not null references public.meeting_minutes(id) on delete restrict,
  signer_user_id uuid not null references auth.users(id) on delete restrict,
  committee_member_id uuid references public.committee_members(id) on delete restrict,
  signer_role text not null check (length(btrim(signer_role)) between 2 and 80),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  content_snapshot jsonb not null check (jsonb_typeof(content_snapshot) = 'object'),
  signed_at timestamptz not null default now(),
  unique (meeting_minutes_id, signer_user_id)
);

alter table public.audit_actions add column evidence_document_version_id uuid references public.document_versions(id) on delete restrict;
alter table public.management_reviews add column minutes_content jsonb not null default '{}'::jsonb check (jsonb_typeof(minutes_content) = 'object'), add column document_version_id uuid references public.document_versions(id) on delete restrict;
create index meeting_minute_signatures_minutes_idx on public.meeting_minute_signatures(meeting_minutes_id, signed_at);
create index audit_actions_evidence_idx on public.audit_actions(evidence_document_version_id) where evidence_document_version_id is not null;

create or replace function private.validate_governance_links()
returns trigger language plpgsql security definer set search_path = '' as $$
declare related_org uuid;
begin
  if tg_table_name = 'committee_periods' then select organization_id into related_org from public.committees where id = new.committee_id;
  elsif tg_table_name = 'committee_members' then select organization_id into related_org from public.committee_periods where id = new.committee_period_id;
  elsif tg_table_name = 'committee_meetings' then select organization_id into related_org from public.committee_periods where id = new.committee_period_id;
  elsif tg_table_name = 'meeting_minutes' then select organization_id into related_org from public.committee_meetings where id = new.committee_meeting_id;
  elsif tg_table_name = 'committee_commitments' then select organization_id into related_org from public.meeting_minutes where id = new.meeting_minutes_id;
  elsif tg_table_name = 'audit_engagements' then select organization_id into related_org from public.audit_programs where id = new.audit_program_id;
  elsif tg_table_name in ('audit_team_members','audit_agenda_items','audit_checklists','audit_evidences','audit_findings','audit_reports') then select organization_id into related_org from public.audit_engagements where id = new.audit_engagement_id;
  elsif tg_table_name = 'audit_actions' then select organization_id into related_org from public.audit_findings where id = new.audit_finding_id;
  elsif tg_table_name in ('management_review_entries','management_review_decisions','management_review_commitments') then select organization_id into related_org from public.management_reviews where id = new.management_review_id;
  else return new;
  end if;
  if related_org is null or related_org <> new.organization_id then raise exception 'related record belongs to another organization' using errcode = '23514'; end if;
  if tg_table_name = 'committee_periods' and not exists (select 1 from public.committees c where c.id = new.committee_id and (c.site_id is null or exists (select 1 from public.sites s where s.id = c.site_id and s.organization_id = new.organization_id))) then raise exception 'committee site belongs to another organization' using errcode = '23514'; end if;
  if tg_table_name = 'committee_members' and not exists (select 1 from public.organization_members m where m.id = new.organization_member_id and m.organization_id = new.organization_id) then raise exception 'committee member belongs to another organization' using errcode = '23514'; end if;
  if tg_table_name = 'committee_commitments' and new.task_id is not null and not exists (select 1 from public.tasks where id = new.task_id and organization_id = new.organization_id) then raise exception 'committee commitment task belongs to another organization' using errcode = '23514'; end if;
  if tg_table_name = 'audit_evidences' and not exists (select 1 from public.document_versions where id = new.document_version_id and organization_id = new.organization_id) then raise exception 'audit evidence belongs to another organization' using errcode = '23514'; end if;
  if tg_table_name = 'audit_actions' and ((new.task_id is not null and not exists (select 1 from public.tasks where id = new.task_id and organization_id = new.organization_id)) or (new.improvement_action_id is not null and not exists (select 1 from public.improvement_actions where id = new.improvement_action_id and organization_id = new.organization_id)) or (new.evidence_document_version_id is not null and not exists (select 1 from public.document_versions where id = new.evidence_document_version_id and organization_id = new.organization_id))) then raise exception 'audit action link belongs to another organization' using errcode = '23514'; end if;
  if tg_table_name = 'management_review_commitments' and new.task_id is not null and not exists (select 1 from public.tasks where id = new.task_id and organization_id = new.organization_id) then raise exception 'management review task belongs to another organization' using errcode = '23514'; end if;
  return new;
end;
$$;

create or replace function private.audit_actor_is_team_member(p_engagement_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.audit_team_members tm
    join public.organization_members om on om.id = tm.organization_member_id
    where tm.audit_engagement_id = p_engagement_id and om.user_id = (select auth.uid()) and om.status = 'active'
  );
$$;

create or replace function private.require_independent_audit_approver(p_engagement_id uuid, p_organization_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_permission(p_organization_id, 'audits.approve') then raise exception 'audit approval permission required' using errcode = '42501'; end if;
  if exists (select 1 from public.audit_engagements e where e.id = p_engagement_id and e.require_independent_approval)
     and private.audit_actor_is_team_member(p_engagement_id) then raise exception 'auditor cannot approve or close own audit' using errcode = '42501'; end if;
end;
$$;

create or replace function private.lock_governance_approvals()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'meeting_minutes' then
    if old.status = 'approved' and row(new.*) is distinct from row(old.*) then raise exception 'approved meeting minutes are immutable' using errcode = '55000'; end if;
    if new.status = 'approved' and old.status <> 'approved' then
      if not private.has_permission(new.organization_id, 'committees.approve') then raise exception 'committee approval permission required' using errcode = '42501'; end if;
      new.approved_at := now(); new.approved_by := (select auth.uid());
    end if;
  elsif tg_table_name = 'audit_reports' then
    if old.status = 'approved' and row(new.*) is distinct from row(old.*) then raise exception 'approved audit report is immutable' using errcode = '55000'; end if;
    if new.status = 'approved' and old.status <> 'approved' then
      perform private.require_independent_audit_approver(new.audit_engagement_id, new.organization_id);
      new.approved_at := now(); new.approved_by := (select auth.uid());
    end if;
  elsif tg_table_name = 'management_reviews' then
    if old.status = 'approved' and row(new.*) is distinct from row(old.*) then raise exception 'approved management review is immutable' using errcode = '55000'; end if;
    if new.status = 'approved' and old.status <> 'approved' then
      if not private.has_permission(new.organization_id, 'audits.approve') then raise exception 'management review approval permission required' using errcode = '42501'; end if;
      new.approved_at := now(); new.approved_by := (select auth.uid());
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.lock_management_review_children()
returns trigger language plpgsql security definer set search_path = '' as $$
declare review_id uuid := coalesce(new.management_review_id, old.management_review_id);
begin
  if exists (select 1 from public.management_reviews r where r.id = review_id and r.status = 'approved') then raise exception 'approved management review is immutable' using errcode = '55000'; end if;
  return coalesce(new, old);
end;
$$;

create or replace function private.validate_meeting_minute_signature()
returns trigger language plpgsql security definer set search_path = '' as $$
declare minute_record public.meeting_minutes%rowtype;
begin
  if tg_op <> 'INSERT' then raise exception 'meeting minute signatures are immutable' using errcode = '55000'; end if;
  select * into minute_record from public.meeting_minutes where id = new.meeting_minutes_id for share;
  if not found or minute_record.organization_id <> new.organization_id then raise exception 'meeting minutes belong to another organization' using errcode = '23514'; end if;
  if minute_record.status <> 'approved' then raise exception 'only approved meeting minutes can be signed' using errcode = '23514'; end if;
  if new.signer_user_id is distinct from (select auth.uid()) then raise exception 'signature actor must match authenticated user' using errcode = '42501'; end if;
  if new.committee_member_id is not null and not exists (
    select 1 from public.committee_members cm join public.committee_meetings m on m.committee_period_id = cm.committee_period_id
    where cm.id = new.committee_member_id and cm.organization_id = new.organization_id and m.id = minute_record.committee_meeting_id and cm.status = 'active'
  ) then raise exception 'signature committee member is invalid' using errcode = '23514'; end if;
  new.content_snapshot := minute_record.content;
  new.content_hash := encode(extensions.digest(convert_to(minute_record.content::text, 'UTF8'), 'sha256'), 'hex');
  new.signed_at := now();
  return new;
end;
$$;

create or replace function private.validate_audit_closure()
returns trigger language plpgsql security definer set search_path = '' as $$
declare engagement_id uuid;
begin
  if tg_table_name = 'audit_actions' and new.status in ('verified','closed') and old.status is distinct from new.status then
    select f.audit_engagement_id into engagement_id from public.audit_findings f where f.id = new.audit_finding_id;
    perform private.require_independent_audit_approver(engagement_id, new.organization_id);
    if new.status = 'verified' and new.evidence_document_version_id is null then raise exception 'audit action evidence is required for verification' using errcode = '23514'; end if;
  elsif tg_table_name = 'audit_findings' and new.status in ('verified','closed') and old.status is distinct from new.status then
    perform private.require_independent_audit_approver(new.audit_engagement_id, new.organization_id);
    if new.status = 'closed' and exists (select 1 from public.audit_actions a where a.audit_finding_id = new.id and a.status not in ('verified','closed','cancelled')) then raise exception 'all audit actions must be verified, closed or cancelled' using errcode = '23514'; end if;
  elsif tg_table_name = 'audit_engagements' and new.status = 'closed' and old.status <> 'closed' then
    perform private.require_independent_audit_approver(new.id, new.organization_id);
    if not exists (select 1 from public.audit_reports r where r.audit_engagement_id = new.id and r.status = 'approved') then raise exception 'approved audit report required before closure' using errcode = '23514'; end if;
    if exists (select 1 from public.audit_findings f where f.audit_engagement_id = new.id and f.status not in ('closed','dismissed')) then raise exception 'all audit findings must be closed or dismissed' using errcode = '23514'; end if;
  end if;
  return new;
end;
$$;

alter table public.meeting_minute_signatures enable row level security;
grant select, insert on public.meeting_minute_signatures to authenticated;
create policy meeting_minute_signatures_read on public.meeting_minute_signatures for select to authenticated using ((select private.has_permission(organization_id, 'committees.read')));
create policy meeting_minute_signatures_insert on public.meeting_minute_signatures for insert to authenticated with check ((select private.has_permission(organization_id, 'committees.read')) and signer_user_id = (select auth.uid()));

drop trigger if exists minutes_lock on public.meeting_minutes;
drop trigger if exists audit_report_approval on public.audit_reports;
create trigger minutes_lock before update on public.meeting_minutes for each row execute function private.lock_governance_approvals();
create trigger audit_report_approval before update on public.audit_reports for each row execute function private.lock_governance_approvals();
create trigger management_review_approval before update on public.management_reviews for each row execute function private.lock_governance_approvals();
create trigger management_review_entries_lock before insert or update or delete on public.management_review_entries for each row execute function private.lock_management_review_children();
create trigger management_review_decisions_lock before insert or update or delete on public.management_review_decisions for each row execute function private.lock_management_review_children();
create trigger management_review_commitments_lock before insert or update or delete on public.management_review_commitments for each row execute function private.lock_management_review_children();
create trigger meeting_minute_signatures_lock before insert or update or delete on public.meeting_minute_signatures for each row execute function private.validate_meeting_minute_signature();
create trigger audit_actions_closure before update on public.audit_actions for each row execute function private.validate_audit_closure();
create trigger audit_findings_closure before update on public.audit_findings for each row execute function private.validate_audit_closure();
create trigger audit_engagements_closure before update on public.audit_engagements for each row execute function private.validate_audit_closure();

create trigger governance_signatures_audit after insert on public.meeting_minute_signatures for each row execute function private.capture_core_audit();
create trigger governance_committee_audit after insert or update on public.committees for each row execute function private.capture_core_audit();
create trigger governance_commitments_audit after insert or update on public.committee_commitments for each row execute function private.capture_core_audit();
create trigger governance_audit_actions_audit after insert or update on public.audit_actions for each row execute function private.capture_core_audit();
create trigger governance_engagements_audit after insert or update on public.audit_engagements for each row execute function private.capture_core_audit();
create trigger governance_management_reviews_audit after insert or update on public.management_reviews for each row execute function private.capture_core_audit();

revoke all on function private.audit_actor_is_team_member(uuid), private.require_independent_audit_approver(uuid, uuid), private.lock_management_review_children(), private.validate_meeting_minute_signature(), private.validate_audit_closure() from public, anon, authenticated, service_role;
notify pgrst, 'reload schema';
