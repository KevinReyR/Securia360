-- ETAPA 14: assessment results become durable, tenant-scoped gaps and actions.
create table public.improvement_findings (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
  title text not null check (btrim(title) <> ''), description text, severity text not null default 'medium' check (severity in ('critical','high','medium','low')),
  status text not null default 'open' check (status in ('open','resolved','dismissed')), created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.improvement_gaps (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
  origin_type text not null check (origin_type in ('assessment_item','requirement','finding')),
  assessment_item_id uuid references public.assessment_items(id) on delete restrict,
  requirement_id uuid references public.requirements(id) on delete restrict,
  finding_id uuid references public.improvement_findings(id) on delete restrict,
  deduplication_key text not null check (btrim(deduplication_key) <> ''), title text not null check (btrim(title) <> ''), description text,
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  status text not null default 'open' check (status in ('open','in_progress','resolved','accepted_risk')),
  last_detected_assessment_id uuid references public.assessments(id) on delete restrict, created_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz, resolved_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint improvement_gaps_exact_origin check ((origin_type='assessment_item' and assessment_item_id is not null and requirement_id is null and finding_id is null) or (origin_type='requirement' and requirement_id is not null and assessment_item_id is null and finding_id is null) or (origin_type='finding' and finding_id is not null and assessment_item_id is null and requirement_id is null)),
  unique(organization_id,deduplication_key)
);
create table public.improvement_actions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
  gap_id uuid not null references public.improvement_gaps(id) on delete restrict, title text not null check (btrim(title) <> ''), description text,
  priority text not null check (priority in ('critical','high','medium','low')), responsible_user_id uuid references auth.users(id) on delete set null,
  target_date date, status text not null default 'pending' check (status in ('pending','in_progress','evidence_submitted','verified','cancelled')),
  evidence_document_version_id uuid references public.document_versions(id) on delete restrict, validation_note text, validated_at timestamptz, validated_by uuid references auth.users(id) on delete set null,
  generated_key text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,generated_key)
);
create index improvement_findings_org_status_idx on public.improvement_findings(organization_id,status,created_at desc);
create index improvement_gaps_org_status_priority_idx on public.improvement_gaps(organization_id,status,priority,created_at desc);
create index improvement_actions_org_status_due_idx on public.improvement_actions(organization_id,status,target_date);
create index improvement_actions_gap_idx on public.improvement_actions(gap_id);

insert into public.permissions(code,module,action,description) values
 ('improvements.read','improvements','read','Consultar brechas y acciones de mejoramiento.'),
 ('improvements.manage','improvements','manage','Gestionar brechas, acciones y evidencias.'),
 ('improvements.validate','improvements','validate','Validar y cerrar acciones de mejoramiento.') on conflict(code) do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.code like 'improvements.%' where r.code='organization_admin' and r.organization_id is null on conflict do nothing;

create or replace function private.validate_improvement_links() returns trigger language plpgsql security definer set search_path='' as $$
declare linked_org uuid;
begin
 if tg_table_name='improvement_gaps' then
   if new.assessment_item_id is not null then select a.organization_id into linked_org from public.assessment_items ai join public.assessments a on a.id=ai.assessment_id where ai.id=new.assessment_item_id; elsif new.finding_id is not null then select organization_id into linked_org from public.improvement_findings where id=new.finding_id; end if;
   if linked_org is not null and linked_org <> new.organization_id then raise exception 'gap origin belongs to another organization' using errcode='23514'; end if;
 elsif tg_table_name='improvement_actions' then
   select organization_id into linked_org from public.improvement_gaps where id=new.gap_id; if linked_org is null or linked_org<>new.organization_id then raise exception 'action gap belongs to another organization' using errcode='23514'; end if;
   if new.evidence_document_version_id is not null then select organization_id into linked_org from public.document_versions where id=new.evidence_document_version_id; if linked_org is null or linked_org<>new.organization_id then raise exception 'action evidence belongs to another organization' using errcode='23514'; end if; end if;
 end if;
 return new;
end; $$;
create or replace function private.validate_improvement_action_transition() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.status='verified' and row(new.*) is distinct from row(old.*) then raise exception 'verified improvement actions are immutable' using errcode='55000'; end if;
 if new.status='verified' and old.status<>'verified' then
   if new.evidence_document_version_id is null then raise exception 'evidence is required before validation' using errcode='23514'; end if;
   if not private.has_permission(new.organization_id,'improvements.validate') then raise exception 'insufficient improvement validation permission' using errcode='42501'; end if;
   new.validated_at:=now(); new.validated_by:=(select auth.uid());
 end if;
 return new;
end; $$;
create or replace function private.sync_assessment_improvement_plan() returns trigger language plpgsql security definer set search_path='' as $$
declare item record; gap_id uuid;
begin
 if new.status not in ('completed','validated') or old.status=new.status then return new; end if;
 for item in select ai.id as assessment_item_id,si.minimum_standard_id,ms.code,ms.functional_description from public.assessment_items ai join public.organization_standard_snapshot_items si on si.id=ai.snapshot_item_id join public.minimum_standards ms on ms.id=si.minimum_standard_id where ai.assessment_id=new.id and ai.response='not_met' loop
   insert into public.improvement_gaps(organization_id,origin_type,assessment_item_id,deduplication_key,title,description,priority,last_detected_assessment_id,created_by)
   values(new.organization_id,'assessment_item',item.assessment_item_id,'minimum_standard:'||item.minimum_standard_id,'Brecha · '||item.code,item.functional_description,'high',new.id,(select auth.uid()))
   on conflict(organization_id,deduplication_key) do update set last_detected_assessment_id=excluded.last_detected_assessment_id,updated_at=now()
   returning id into gap_id;
   insert into public.improvement_actions(organization_id,gap_id,title,priority,generated_key,created_by)
   values(new.organization_id,gap_id,'Definir y ejecutar acción de mejora','high','default:'||gap_id,(select auth.uid())) on conflict(organization_id,generated_key) do nothing;
 end loop;
 return new;
end; $$;
revoke all on function private.validate_improvement_links(),private.validate_improvement_action_transition(),private.sync_assessment_improvement_plan() from public,anon,authenticated,service_role;

alter table public.improvement_findings enable row level security; alter table public.improvement_gaps enable row level security; alter table public.improvement_actions enable row level security;
grant select,insert,update on public.improvement_findings,public.improvement_gaps,public.improvement_actions to authenticated;
create policy improvement_findings_read on public.improvement_findings for select to authenticated using ((select private.has_permission(organization_id,'improvements.read')));
create policy improvement_findings_write on public.improvement_findings for all to authenticated using ((select private.has_permission(organization_id,'improvements.manage'))) with check ((select private.has_permission(organization_id,'improvements.manage')));
create policy improvement_gaps_read on public.improvement_gaps for select to authenticated using ((select private.has_permission(organization_id,'improvements.read')));
create policy improvement_gaps_write on public.improvement_gaps for all to authenticated using ((select private.has_permission(organization_id,'improvements.manage'))) with check ((select private.has_permission(organization_id,'improvements.manage')));
create policy improvement_actions_read on public.improvement_actions for select to authenticated using ((select private.has_permission(organization_id,'improvements.read')));
create policy improvement_actions_write on public.improvement_actions for all to authenticated using ((select private.has_permission(organization_id,'improvements.manage'))) with check ((select private.has_permission(organization_id,'improvements.manage')));
create trigger improvement_findings_updated before update on public.improvement_findings for each row execute function private.set_updated_at();
create trigger improvement_gaps_updated before update on public.improvement_gaps for each row execute function private.set_updated_at();
create trigger improvement_actions_updated before update on public.improvement_actions for each row execute function private.set_updated_at();
create trigger improvement_gaps_validate_links before insert or update on public.improvement_gaps for each row execute function private.validate_improvement_links();
create trigger improvement_actions_validate_links before insert or update on public.improvement_actions for each row execute function private.validate_improvement_links();
create trigger improvement_actions_validate_transition before update on public.improvement_actions for each row execute function private.validate_improvement_action_transition();
create trigger improvement_gaps_audit after insert or update on public.improvement_gaps for each row execute function private.capture_core_audit();
create trigger improvement_actions_audit after insert or update on public.improvement_actions for each row execute function private.capture_core_audit();
create trigger assessment_sync_improvement_plan after update of status on public.assessments for each row execute function private.sync_assessment_improvement_plan();
notify pgrst,'reload schema';
