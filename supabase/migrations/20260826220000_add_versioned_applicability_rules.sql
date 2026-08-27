create table public.applicability_rules (
 id uuid primary key default gen_random_uuid(), requirement_id uuid not null references public.requirements(id) on delete restrict,
 rule_code text not null check(rule_code ~ '^[A-Z0-9_.-]{3,100}$'), version_number integer not null check(version_number>0),
 conditions jsonb not null default '[]'::jsonb check(jsonb_typeof(conditions)='array'), outcome text not null check(outcome in ('applicable','not_applicable','review_required')),
 effective_from date not null, effective_to date, status text not null default 'draft' check(status in ('draft','active','superseded','archived')),
 expert_review_status text not null default 'pending' check(expert_review_status in ('pending','reviewed')),
 supersedes_rule_id uuid references public.applicability_rules(id) on delete restrict, explanation_template text not null check(length(btrim(explanation_template)) between 3 and 1000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(requirement_id,rule_code,version_number), check(effective_to is null or effective_to>=effective_from)
);
create index applicability_rules_active_idx on public.applicability_rules(requirement_id,effective_from desc) where status='active';
create table public.organization_requirements (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict, requirement_id uuid not null references public.requirements(id) on delete restrict,
 applicability_rule_id uuid references public.applicability_rules(id) on delete restrict, classification_id uuid references public.organization_classifications(id) on delete set null,
 result text not null check(result in ('applicable','not_applicable','review_required')), explanation jsonb not null default '{}'::jsonb check(jsonb_typeof(explanation)='object'), input_snapshot jsonb not null default '{}'::jsonb check(jsonb_typeof(input_snapshot)='object'), evaluated_at timestamptz not null default now(), evaluated_by uuid references auth.users(id) on delete set null,
 valid_from date not null, valid_to date, is_current boolean not null default true, check(valid_to is null or valid_to>=valid_from)
);
create unique index organization_requirements_current_key on public.organization_requirements(organization_id,requirement_id) where is_current;
create index organization_requirements_history_idx on public.organization_requirements(organization_id,requirement_id,evaluated_at desc);
insert into public.permissions(code,module,action,description) values ('applicability.read','applicability','read','Consultar resultados de aplicabilidad.'),('applicability.evaluate','applicability','evaluate','Evaluar reglas de aplicabilidad.') on conflict(code) do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.code like 'applicability.%' where r.code='organization_admin' and r.organization_id is null on conflict do nothing;
alter table public.applicability_rules enable row level security; alter table public.organization_requirements enable row level security;
grant select on public.applicability_rules to authenticated; grant select on public.organization_requirements to authenticated;
create policy applicability_rules_read on public.applicability_rules for select to authenticated using ((select auth.uid()) is not null);
create policy organization_requirements_read on public.organization_requirements for select to authenticated using ((select private.has_permission(organization_id,'applicability.read')));
create or replace function private.evaluate_rule_conditions(p_conditions jsonb,p_inputs jsonb) returns text language plpgsql immutable set search_path='' as $$
declare c jsonb; actual text; expected jsonb;
begin
 if jsonb_array_length(p_conditions)=0 then return 'review_required'; end if;
 for c in select * from jsonb_array_elements(p_conditions) loop
  actual:=p_inputs #>> string_to_array(c->>'field','.'); expected:=c->'value';
  if actual is null then return 'review_required'; end if;
  if c->>'operator'='eq' and actual <> expected#>>'{}' then return 'not_applicable'; end if;
  if c->>'operator'='truthy' and actual <> 'true' then return 'not_applicable'; end if;
  if c->>'operator'='gte' and (actual !~ '^[0-9]+$' or actual::numeric < (expected#>>'{}')::numeric) then return 'not_applicable'; end if;
  if coalesce(c->>'operator','') not in ('eq','truthy','gte') then return 'review_required'; end if;
 end loop; return 'applicable';
end; $$;
create or replace function private.evaluate_organization_applicability(p_organization_id uuid,p_as_of date default current_date) returns integer language plpgsql security definer set search_path='' as $$
declare v_inputs jsonb; v_class public.organization_classifications%rowtype; r public.applicability_rules%rowtype; result text; count_rows integer:=0; actor uuid:=(select auth.uid());
begin
 if actor is null or not private.has_permission(p_organization_id,'applicability.evaluate') then raise exception 'insufficient applicability permission' using errcode='42501'; end if;
 select * into v_class from public.organization_classifications where organization_id=p_organization_id and effective_to is null order by effective_from desc limit 1;
 select jsonb_build_object('classification',case when v_class.id is null then null else jsonb_build_object('employee_count',v_class.employee_count,'risk_class',v_class.risk_class,'ciiu_code',v_class.ciiu_code,'economic_activity',v_class.economic_activity,'standard_profile_id',v_class.standard_profile_id) end,'characteristics',to_jsonb(oc)) into v_inputs from public.organization_characteristics oc where oc.organization_id=p_organization_id;
 v_inputs:=coalesce(v_inputs,jsonb_build_object('classification',null,'characteristics',null));
 for r in select * from public.applicability_rules where status='active' and expert_review_status='reviewed' and effective_from<=p_as_of and (effective_to is null or effective_to>=p_as_of) loop
  result:=case when v_class.id is null then 'review_required' else private.evaluate_rule_conditions(r.conditions,v_inputs) end;
  update public.organization_requirements set is_current=false,valid_to=p_as_of-1 where organization_id=p_organization_id and requirement_id=r.requirement_id and is_current;
  insert into public.organization_requirements(organization_id,requirement_id,applicability_rule_id,classification_id,result,explanation,input_snapshot,evaluated_by,valid_from) values(p_organization_id,r.requirement_id,r.id,v_class.id,result,jsonb_build_object('rule_code',r.rule_code,'rule_version',r.version_number,'reason',case when result='review_required' then 'human_review_required' else r.explanation_template end),v_inputs,actor,p_as_of);
  count_rows:=count_rows+1;
 end loop; return count_rows;
end; $$;
revoke all on function private.evaluate_rule_conditions(jsonb,jsonb) from public,anon,authenticated,service_role; revoke all on function private.evaluate_organization_applicability(uuid,date) from public,anon,authenticated,service_role; grant execute on function private.evaluate_organization_applicability(uuid,date) to authenticated;
create trigger applicability_rules_updated before update on public.applicability_rules for each row execute function private.set_updated_at();
notify pgrst,'reload schema';
