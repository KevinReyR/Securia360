create table public.classification_evaluators (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, status text not null default 'active' check(status in ('draft','active','archived')), created_at timestamptz not null default now()
);
create table public.classification_evaluator_versions (
 id uuid primary key default gen_random_uuid(), evaluator_id uuid not null references public.classification_evaluators(id) on delete restrict, version_code text not null,
 rules_summary jsonb not null default '{}'::jsonb check(jsonb_typeof(rules_summary)='object'), expert_review_status text not null default 'pending' check(expert_review_status in ('pending','reviewed')),
 effective_from date, effective_to date, created_at timestamptz not null default now(), unique(evaluator_id,version_code), check(effective_to is null or effective_from is null or effective_to>=effective_from)
);
create table public.organization_classifications (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, scope_key text not null default 'organization',
 employee_count integer not null check(employee_count>=0), risk_class smallint not null check(risk_class between 1 and 5), ciiu_code text, economic_activity text,
 standard_profile_id uuid not null references public.standard_profiles(id) on delete restrict, evaluator_version_id uuid not null references public.classification_evaluator_versions(id) on delete restrict,
 explanation jsonb not null default '{}'::jsonb check(jsonb_typeof(explanation)='object'), effective_from date not null, effective_to date, change_reason text not null, confirmed_by uuid references auth.users(id) on delete set null, confirmed_at timestamptz,
 created_at timestamptz not null default now(), check(effective_to is null or effective_to>=effective_from)
);
create unique index organization_classifications_current_key on public.organization_classifications(organization_id,scope_key) where effective_to is null;
create index organization_classifications_history_idx on public.organization_classifications(organization_id,scope_key,effective_from desc);
create table public.classification_change_proposals (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, scope_key text not null default 'organization',
 current_classification_id uuid references public.organization_classifications(id) on delete restrict, proposed_employee_count integer not null check(proposed_employee_count>=0), proposed_risk_class smallint not null check(proposed_risk_class between 1 and 5), proposed_ciiu_code text, proposed_economic_activity text, proposed_standard_profile_id uuid not null references public.standard_profiles(id) on delete restrict, evaluator_version_id uuid not null references public.classification_evaluator_versions(id) on delete restrict,
 comparison jsonb not null default '{}'::jsonb check(jsonb_typeof(comparison)='object'), reasons jsonb not null default '[]'::jsonb check(jsonb_typeof(reasons)='array'), status text not null default 'pending_review' check(status in ('pending_review','approved','rejected','superseded')),
 proposed_effective_from date not null, reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz, review_note text, created_at timestamptz not null default now(), check((status='pending_review' and reviewed_at is null) or status<>'pending_review')
);
create index classification_proposals_org_status_idx on public.classification_change_proposals(organization_id,status,created_at desc);
insert into public.permissions(code,module,action,description) values ('classifications.read','classifications','read','Consultar clasificación normativa.'),('classifications.manage','classifications','manage','Revisar y aprobar clasificación normativa.') on conflict(code) do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.code like 'classifications.%' where r.code='organization_admin' and r.organization_id is null on conflict do nothing;
alter table public.organization_classifications enable row level security; alter table public.classification_change_proposals enable row level security;
grant select,insert,update on public.organization_classifications,public.classification_change_proposals to authenticated;
create policy organization_classifications_read on public.organization_classifications for select to authenticated using ((select private.has_permission(organization_id,'classifications.read')));
create policy proposals_read on public.classification_change_proposals for select to authenticated using ((select private.has_permission(organization_id,'classifications.read')));
create policy proposals_insert on public.classification_change_proposals for insert to authenticated with check ((select private.has_permission(organization_id,'classifications.manage')));
create or replace function private.approve_classification_change(p_proposal_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare p public.classification_change_proposals%rowtype; new_id uuid; actor uuid:=(select auth.uid());
begin
 select * into p from public.classification_change_proposals where id=p_proposal_id for update; if not found then raise exception 'proposal not found' using errcode='P0002'; end if;
 if actor is null or not private.has_permission(p.organization_id,'classifications.manage') then raise exception 'insufficient classification permission' using errcode='42501'; end if;
 if p.status<>'pending_review' then raise exception 'proposal already reviewed' using errcode='23505'; end if;
 update public.organization_classifications set effective_to=p.proposed_effective_from-1,confirmed_at=coalesce(confirmed_at,now()) where organization_id=p.organization_id and scope_key=p.scope_key and effective_to is null;
 insert into public.organization_classifications(organization_id,scope_key,employee_count,risk_class,ciiu_code,economic_activity,standard_profile_id,evaluator_version_id,explanation,effective_from,change_reason,confirmed_by,confirmed_at) values(p.organization_id,p.scope_key,p.proposed_employee_count,p.proposed_risk_class,p.proposed_ciiu_code,p.proposed_economic_activity,p.proposed_standard_profile_id,p.evaluator_version_id,p.comparison,p.proposed_effective_from,'approved_proposal',actor,now()) returning id into new_id;
 update public.classification_change_proposals set status='approved',reviewed_by=actor,reviewed_at=now() where id=p.id;
 perform private.enqueue_domain_event(p.organization_id,'classification.changed','organization_classification',new_id,jsonb_build_object('proposal_id',p.id,'scope_key',p.scope_key)); return new_id;
end; $$;
revoke all on function private.approve_classification_change(uuid) from public,anon,authenticated,service_role; grant execute on function private.approve_classification_change(uuid) to authenticated;
insert into public.classification_evaluators(code,name) values('SOURCE_DATA_REVIEW','Evaluador de datos fuente') on conflict(code) do nothing;
insert into public.classification_evaluator_versions(evaluator_id,version_code,rules_summary,expert_review_status) select id,'v1',jsonb_build_object('mode','human_review_required','inputs',jsonb_build_array('employee_count','risk_class','ciiu_code','economic_activity','standard_profile_id')),'pending' from public.classification_evaluators where code='SOURCE_DATA_REVIEW' on conflict(evaluator_id,version_code) do nothing;
notify pgrst,'reload schema';
