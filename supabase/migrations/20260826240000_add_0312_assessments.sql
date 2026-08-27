create table public.assessment_scoring_rules (
 id uuid primary key default gen_random_uuid(), code text not null, version_number integer not null check(version_number>0), standard_profile_version_id uuid not null references public.standard_profile_versions(id) on delete restrict,
 response_multipliers jsonb not null check(jsonb_typeof(response_multipliers)='object'), status text not null default 'draft' check(status in ('draft','approved','retired')), expert_review_status text not null default 'pending' check(expert_review_status in ('pending','reviewed')),
 created_at timestamptz not null default now(), unique(code,version_number), check((status<>'approved') or expert_review_status='reviewed')
);
create table public.assessments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, snapshot_id uuid not null references public.organization_standard_snapshots(id) on delete restrict,
 standard_profile_version_id uuid not null references public.standard_profile_versions(id) on delete restrict, scoring_rule_id uuid not null references public.assessment_scoring_rules(id) on delete restrict,
 status text not null default 'draft' check(status in ('draft','in_progress','completed','validated','voided')), score numeric(7,2), score_explanation jsonb not null default '{}'::jsonb check(jsonb_typeof(score_explanation)='object'),
 responsible_user_id uuid references auth.users(id) on delete set null, completed_at timestamptz, completed_by uuid references auth.users(id) on delete set null, validated_at timestamptz, validated_by uuid references auth.users(id) on delete set null, void_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((status not in ('completed','validated')) or completed_at is not null), check((status<>'validated') or validated_at is not null), check((status<>'voided') or void_reason is not null)
);
create table public.assessment_items (
 id uuid primary key default gen_random_uuid(), assessment_id uuid not null references public.assessments(id) on delete restrict, snapshot_item_id uuid not null references public.organization_standard_snapshot_items(id) on delete restrict,
 response text not null default 'pending' check(response in ('pending','met','not_met','not_applicable','review_required')), evidence_document_version_id uuid references public.document_versions(id) on delete restrict,
 observation text, responsible_user_id uuid references auth.users(id) on delete set null, score numeric(7,2), justification text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(assessment_id,snapshot_item_id)
);
create index assessments_org_status_idx on public.assessments(organization_id,status,created_at desc); create index assessment_items_assessment_idx on public.assessment_items(assessment_id);
insert into public.permissions(code,module,action,description) values ('assessments.read','assessments','read','Consultar evaluaciones.'),('assessments.manage','assessments','manage','Gestionar evaluaciones.'),('assessments.validate','assessments','validate','Validar evaluaciones.') on conflict(code) do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.code like 'assessments.%' where r.code='organization_admin' and r.organization_id is null on conflict do nothing;
alter table public.assessments enable row level security; alter table public.assessment_items enable row level security;
grant select,insert,update on public.assessments,public.assessment_items to authenticated;
create policy assessments_read on public.assessments for select to authenticated using ((select private.has_permission(organization_id,'assessments.read')));
create policy assessments_insert on public.assessments for insert to authenticated with check ((select private.has_permission(organization_id,'assessments.manage')));
create policy assessments_update on public.assessments for update to authenticated using ((select private.has_permission(organization_id,'assessments.manage'))) with check ((select private.has_permission(organization_id,'assessments.manage')));
create policy assessment_items_read on public.assessment_items for select to authenticated using (exists(select 1 from public.assessments a where a.id=assessment_id and private.has_permission(a.organization_id,'assessments.read')));
create policy assessment_items_write on public.assessment_items for all to authenticated using (exists(select 1 from public.assessments a where a.id=assessment_id and private.has_permission(a.organization_id,'assessments.manage'))) with check (exists(select 1 from public.assessments a where a.id=assessment_id and private.has_permission(a.organization_id,'assessments.manage')));
create or replace function private.prevent_validated_assessment_mutation() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='assessments' and old.status='validated' then raise exception 'validated assessments are immutable' using errcode='55000'; end if;
 if tg_table_name='assessment_items' and exists(select 1 from public.assessments a where a.id=old.assessment_id and a.status='validated') then raise exception 'validated assessment items are immutable' using errcode='55000'; end if; if tg_op='DELETE' then return old; end if; return new;
end; $$;
revoke all on function private.prevent_validated_assessment_mutation() from public,anon,authenticated,service_role;
create trigger assessments_immutable_after_validation before update or delete on public.assessments for each row execute function private.prevent_validated_assessment_mutation();
create trigger assessment_items_immutable_after_validation before update or delete on public.assessment_items for each row execute function private.prevent_validated_assessment_mutation();
create or replace function private.complete_assessment(p_assessment_id uuid) returns numeric language plpgsql security definer set search_path='' as $$
declare a public.assessments%rowtype; total numeric:=0; actor uuid:=(select auth.uid());
begin
 select * into a from public.assessments where id=p_assessment_id for update; if not found then raise exception 'assessment not found' using errcode='P0002'; end if;
 if actor is null or not private.has_permission(a.organization_id,'assessments.manage') then raise exception 'insufficient assessment permission' using errcode='42501'; end if;
 if a.status not in ('draft','in_progress') then raise exception 'assessment cannot be completed' using errcode='55000'; end if;
 if not exists(select 1 from public.assessment_scoring_rules r where r.id=a.scoring_rule_id and r.status='approved' and r.expert_review_status='reviewed') then raise exception 'scoring rule is not approved' using errcode='23514'; end if;
 update public.assessment_items ai set score=coalesce((ps.weight * coalesce((r.response_multipliers->>ai.response)::numeric,0))/100,0) from public.organization_standard_snapshot_items si join public.profile_standards ps on ps.minimum_standard_id=si.minimum_standard_id and ps.standard_profile_version_id=a.standard_profile_version_id cross join public.assessment_scoring_rules r where ai.assessment_id=a.id and si.id=ai.snapshot_item_id and r.id=a.scoring_rule_id;
 select coalesce(sum(score),0) into total from public.assessment_items where assessment_id=a.id;
 update public.assessments set status='completed',score=total,completed_at=now(),completed_by=actor,score_explanation=jsonb_build_object('scoring_rule_id',a.scoring_rule_id,'total',total) where id=a.id;
 perform private.enqueue_domain_event(a.organization_id,'assessment.completed','assessment',a.id,jsonb_build_object('score',total,'snapshot_id',a.snapshot_id)); return total;
end; $$;
revoke all on function private.complete_assessment(uuid) from public,anon,authenticated,service_role; grant execute on function private.complete_assessment(uuid) to authenticated;
create trigger assessments_updated before update on public.assessments for each row execute function private.set_updated_at(); create trigger assessment_items_updated before update on public.assessment_items for each row execute function private.set_updated_at(); create trigger assessments_audit after insert or update on public.assessments for each row execute function private.capture_core_audit();
notify pgrst,'reload schema';
