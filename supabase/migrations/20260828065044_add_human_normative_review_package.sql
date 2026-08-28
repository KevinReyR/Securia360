-- Human editorial governance for normative and technical content.
-- This package never changes a published source, rule, profile or formula in-place.

create table public.normative_reviewer_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  role text not null check (role in ('review_admin','reviewer')),
  status text not null default 'active' check (status in ('active','suspended')),
  reason text not null check (length(btrim(reason)) between 3 and 1000),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.normative_review_artifacts (
  id uuid primary key default gen_random_uuid(),
  artifact_type text not null check (artifact_type in ('NORMATIVE_SOURCE_VERSION','REQUIREMENT','MINIMUM_STANDARD','STANDARD_PROFILE_VERSION','PROFILE_STANDARD','APPLICABILITY_RULE','ASSESSMENT_SCORING_RULE','RISK_METHODOLOGY_VERSION','RISK_METHODOLOGY_FORMULA','RISK_METHODOLOGY_INTERPRETATION_RULE','UI_TEXT','ASSUMPTION','TEST_CASE')),
  artifact_key text not null check (length(btrim(artifact_key)) between 3 and 160),
  title text not null check (length(btrim(title)) between 3 and 300),
  source_path text,
  content_snapshot jsonb not null check (jsonb_typeof(content_snapshot) = 'object'),
  review_status text not null default 'pending' check (review_status in ('pending','reviewed','approved','rejected','superseded')),
  normative_source_version_id uuid references public.normative_source_versions(id) on delete restrict,
  requirement_id uuid references public.requirements(id) on delete restrict,
  minimum_standard_id uuid references public.minimum_standards(id) on delete restrict,
  standard_profile_version_id uuid references public.standard_profile_versions(id) on delete restrict,
  profile_standard_id uuid references public.profile_standards(id) on delete restrict,
  applicability_rule_id uuid references public.applicability_rules(id) on delete restrict,
  assessment_scoring_rule_id uuid references public.assessment_scoring_rules(id) on delete restrict,
  risk_methodology_version_id uuid references public.risk_methodology_versions(id) on delete restrict,
  risk_methodology_formula_id uuid references public.risk_methodology_formulas(id) on delete restrict,
  risk_methodology_interpretation_rule_id uuid references public.risk_methodology_interpretation_rules(id) on delete restrict,
  supersedes_artifact_id uuid references public.normative_review_artifacts(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (
    (artifact_type in ('UI_TEXT','ASSUMPTION','TEST_CASE') and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'NORMATIVE_SOURCE_VERSION' and normative_source_version_id is not null and num_nonnulls(requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'REQUIREMENT' and requirement_id is not null and num_nonnulls(normative_source_version_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'MINIMUM_STANDARD' and minimum_standard_id is not null and num_nonnulls(normative_source_version_id,requirement_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'STANDARD_PROFILE_VERSION' and standard_profile_version_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'PROFILE_STANDARD' and profile_standard_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,applicability_rule_id,assessment_scoring_rule_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'APPLICABILITY_RULE' and applicability_rule_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,assessment_scoring_rule_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'ASSESSMENT_SCORING_RULE' and assessment_scoring_rule_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,risk_methodology_version_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'RISK_METHODOLOGY_VERSION' and risk_methodology_version_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,risk_methodology_formula_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'RISK_METHODOLOGY_FORMULA' and risk_methodology_formula_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,risk_methodology_version_id,risk_methodology_interpretation_rule_id) = 0)
    or (artifact_type = 'RISK_METHODOLOGY_INTERPRETATION_RULE' and risk_methodology_interpretation_rule_id is not null and num_nonnulls(normative_source_version_id,requirement_id,minimum_standard_id,standard_profile_version_id,profile_standard_id,applicability_rule_id,assessment_scoring_rule_id,risk_methodology_version_id,risk_methodology_formula_id) = 0)
  )
);

create table public.normative_review_proposals (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.normative_review_artifacts(id) on delete restrict,
  proposed_content jsonb not null check (jsonb_typeof(proposed_content) = 'object'),
  rationale text not null check (length(btrim(rationale)) between 3 and 2000),
  status text not null default 'pending_review' check (status in ('pending_review','approved','rejected','implemented')),
  proposed_by uuid not null references auth.users(id) on delete restrict,
  resolved_by uuid references auth.users(id) on delete restrict,
  resolved_at timestamptz,
  successor_artifact_id uuid references public.normative_review_artifacts(id) on delete restrict,
  created_at timestamptz not null default now(),
  check ((status = 'pending_review' and resolved_by is null and resolved_at is null) or (status <> 'pending_review' and resolved_by is not null and resolved_at is not null))
);

create table public.normative_review_decisions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.normative_review_artifacts(id) on delete restrict,
  proposal_id uuid references public.normative_review_proposals(id) on delete restrict,
  decision text not null check (decision in ('reviewed','approved','rejected')),
  note text not null check (length(btrim(note)) between 3 and 2000),
  content_snapshot jsonb not null check (jsonb_typeof(content_snapshot) = 'object'),
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default now()
);

create table public.normative_review_audit (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index normative_reviewer_roles_active_idx on public.normative_reviewer_roles(user_id) where status = 'active';
create index normative_review_artifacts_queue_idx on public.normative_review_artifacts(review_status,artifact_type,created_at desc);
create index normative_review_proposals_queue_idx on public.normative_review_proposals(status,created_at desc);
create index normative_review_decisions_artifact_idx on public.normative_review_decisions(artifact_id,decided_at desc);

create or replace function private.is_normative_reviewer(p_require_admin boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.normative_reviewer_roles r
    where r.user_id = (select auth.uid()) and r.status = 'active'
      and (not p_require_admin or r.role = 'review_admin')
  );
$$;

create or replace function private.normative_review_audit(p_action text, p_entity_type text, p_entity_id uuid, p_before jsonb default null, p_after jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.normative_review_audit(actor_user_id,action,entity_type,entity_id,before_data,after_data)
  values ((select auth.uid()),p_action,p_entity_type,p_entity_id,p_before,p_after);
end;
$$;

create or replace function private.prevent_normative_review_history_mutation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  raise exception 'normative review history is append-only' using errcode = '55000';
end;
$$;

create or replace function private.manage_normative_reviewer(p_email text, p_role text, p_status text, p_reason text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_user_id uuid; role_id uuid;
begin
  if not private.is_normative_reviewer(true) then raise exception 'normative review administrator access required' using errcode = '42501'; end if;
  if p_role not in ('review_admin','reviewer') or p_status not in ('active','suspended') or length(btrim(p_reason)) < 3 then raise exception 'invalid reviewer data' using errcode = '22023'; end if;
  select id into target_user_id from auth.users where lower(email) = lower(btrim(p_email)) and confirmed_at is not null;
  if target_user_id is null then raise exception 'reviewer account must exist and confirm email' using errcode = 'P0002'; end if;
  insert into public.normative_reviewer_roles(user_id,role,status,reason,granted_by)
  values(target_user_id,p_role,p_status,btrim(p_reason),(select auth.uid()))
  on conflict(user_id) do update set role=excluded.role,status=excluded.status,reason=excluded.reason,granted_by=excluded.granted_by,granted_at=now(),updated_at=now()
  returning id into role_id;
  perform private.normative_review_audit('normative_reviewer.changed','normative_reviewer_role',role_id,null,jsonb_build_object('user_id',target_user_id,'role',p_role,'status',p_status));
  return role_id;
end;
$$;

create or replace function private.create_normative_review_artifact(p_artifact_type text, p_artifact_key text, p_title text, p_source_path text, p_content jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare artifact_id uuid; actor uuid := (select auth.uid());
begin
  if not private.is_normative_reviewer(false) then raise exception 'active normative reviewer access required' using errcode = '42501'; end if;
  if p_artifact_type not in ('UI_TEXT','ASSUMPTION','TEST_CASE') then raise exception 'domain artifacts are registered from their source record' using errcode = '22023'; end if;
  if jsonb_typeof(p_content) <> 'object' then raise exception 'artifact content must be an object' using errcode = '22023'; end if;
  insert into public.normative_review_artifacts(artifact_type,artifact_key,title,source_path,content_snapshot,created_by)
  values(p_artifact_type,btrim(p_artifact_key),btrim(p_title),nullif(btrim(p_source_path),''),p_content,actor) returning id into artifact_id;
  perform private.normative_review_audit('normative_artifact.created','normative_review_artifact',artifact_id,null,p_content);
  return artifact_id;
end;
$$;

create or replace function private.create_normative_review_proposal(p_artifact_id uuid, p_content jsonb, p_rationale text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare proposal_id uuid; actor uuid := (select auth.uid());
begin
  if not private.is_normative_reviewer(false) then raise exception 'active normative reviewer access required' using errcode = '42501'; end if;
  if not exists(select 1 from public.normative_review_artifacts where id = p_artifact_id) then raise exception 'review artifact not found' using errcode = 'P0002'; end if;
  if jsonb_typeof(p_content) <> 'object' or length(btrim(p_rationale)) < 3 then raise exception 'invalid proposed correction' using errcode = '22023'; end if;
  insert into public.normative_review_proposals(artifact_id,proposed_content,rationale,proposed_by) values(p_artifact_id,p_content,btrim(p_rationale),actor) returning id into proposal_id;
  perform private.normative_review_audit('normative_proposal.created','normative_review_proposal',proposal_id,null,p_content);
  return proposal_id;
end;
$$;

create or replace function private.decide_normative_review(p_artifact_id uuid, p_decision text, p_note text, p_proposal_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid()); proposal public.normative_review_proposals%rowtype; artifact public.normative_review_artifacts%rowtype; decision_id uuid; successor_id uuid;
begin
  if not private.is_normative_reviewer(false) then raise exception 'active normative reviewer access required' using errcode = '42501'; end if;
  if p_decision not in ('reviewed','approved','rejected') or length(btrim(p_note)) < 3 then raise exception 'invalid review decision' using errcode = '22023'; end if;
  select * into artifact from public.normative_review_artifacts where id = p_artifact_id for update;
  if not found then raise exception 'review artifact not found' using errcode = 'P0002'; end if;
  if p_proposal_id is not null then
    select * into proposal from public.normative_review_proposals where id = p_proposal_id and artifact_id = p_artifact_id for update;
    if not found or proposal.status <> 'pending_review' then raise exception 'proposal is not pending review' using errcode = '55000'; end if;
    if p_decision = 'approved' then
      insert into public.normative_review_artifacts(artifact_type,artifact_key,title,source_path,content_snapshot,review_status,supersedes_artifact_id,created_by)
      values(artifact.artifact_type,artifact.artifact_key,artifact.title,artifact.source_path,proposal.proposed_content,'pending',artifact.id,actor)
      returning id into successor_id;
      update public.normative_review_proposals set status='approved',resolved_by=actor,resolved_at=now(),successor_artifact_id=successor_id where id=proposal.id;
      update public.normative_review_artifacts set review_status='superseded' where id=artifact.id and artifact.review_status <> 'approved';
    elsif p_decision = 'rejected' then
      update public.normative_review_proposals set status='rejected',resolved_by=actor,resolved_at=now() where id=proposal.id;
    else
      raise exception 'a proposal must be approved or rejected' using errcode = '22023';
    end if;
  else
    if artifact.review_status in ('approved','superseded') then raise exception 'approved or superseded artifact cannot be changed' using errcode = '55000'; end if;
    update public.normative_review_artifacts set review_status=p_decision where id=artifact.id;
  end if;
  insert into public.normative_review_decisions(artifact_id,proposal_id,decision,note,content_snapshot,decided_by)
  values(p_artifact_id,p_proposal_id,p_decision,btrim(p_note),coalesce(proposal.proposed_content,artifact.content_snapshot),actor) returning id into decision_id;
  perform private.normative_review_audit('normative_review.decided','normative_review_decision',decision_id,null,jsonb_build_object('decision',p_decision,'proposal_id',p_proposal_id,'successor_artifact_id',successor_id));
  return decision_id;
end;
$$;

create or replace function public.manage_normative_reviewer(p_email text, p_role text, p_status text, p_reason text)
returns uuid language sql security invoker set search_path = '' as $$ select private.manage_normative_reviewer(p_email,p_role,p_status,p_reason); $$;
create or replace function public.create_normative_review_artifact(p_artifact_type text, p_artifact_key text, p_title text, p_source_path text, p_content jsonb)
returns uuid language sql security invoker set search_path = '' as $$ select private.create_normative_review_artifact(p_artifact_type,p_artifact_key,p_title,p_source_path,p_content); $$;
create or replace function public.create_normative_review_proposal(p_artifact_id uuid, p_content jsonb, p_rationale text)
returns uuid language sql security invoker set search_path = '' as $$ select private.create_normative_review_proposal(p_artifact_id,p_content,p_rationale); $$;
create or replace function public.decide_normative_review(p_artifact_id uuid, p_decision text, p_note text, p_proposal_id uuid default null)
returns uuid language sql security invoker set search_path = '' as $$ select private.decide_normative_review(p_artifact_id,p_decision,p_note,p_proposal_id); $$;

alter table public.normative_reviewer_roles enable row level security;
alter table public.normative_review_artifacts enable row level security;
alter table public.normative_review_proposals enable row level security;
alter table public.normative_review_decisions enable row level security;
alter table public.normative_review_audit enable row level security;

create policy normative_reviewer_self_or_admin_read on public.normative_reviewer_roles for select to authenticated using (user_id = (select auth.uid()) or (select private.is_normative_reviewer(true)));
create policy normative_artifacts_reviewer_read on public.normative_review_artifacts for select to authenticated using ((select private.is_normative_reviewer(false)));
create policy normative_proposals_reviewer_read on public.normative_review_proposals for select to authenticated using ((select private.is_normative_reviewer(false)));
create policy normative_decisions_reviewer_read on public.normative_review_decisions for select to authenticated using ((select private.is_normative_reviewer(false)));
create policy normative_audit_admin_read on public.normative_review_audit for select to authenticated using ((select private.is_normative_reviewer(true)));

create trigger normative_reviewer_roles_updated before update on public.normative_reviewer_roles for each row execute function private.set_updated_at();
create trigger normative_review_decisions_append_only before update or delete on public.normative_review_decisions for each row execute function private.prevent_normative_review_history_mutation();
create trigger normative_review_audit_append_only before update or delete on public.normative_review_audit for each row execute function private.prevent_normative_review_history_mutation();

revoke all on public.normative_reviewer_roles,public.normative_review_artifacts,public.normative_review_proposals,public.normative_review_decisions,public.normative_review_audit from anon,authenticated;
grant select on public.normative_reviewer_roles,public.normative_review_artifacts,public.normative_review_proposals,public.normative_review_decisions,public.normative_review_audit to authenticated;
revoke all on function private.is_normative_reviewer(boolean),private.normative_review_audit(text,text,uuid,jsonb,jsonb),private.prevent_normative_review_history_mutation(),private.manage_normative_reviewer(text,text,text,text),private.create_normative_review_artifact(text,text,text,text,jsonb),private.create_normative_review_proposal(uuid,jsonb,text),private.decide_normative_review(uuid,text,text,uuid) from public,anon;
grant execute on function private.is_normative_reviewer(boolean),private.manage_normative_reviewer(text,text,text,text),private.create_normative_review_artifact(text,text,text,text,jsonb),private.create_normative_review_proposal(uuid,jsonb,text),private.decide_normative_review(uuid,text,text,uuid) to authenticated;
revoke all on function public.manage_normative_reviewer(text,text,text,text),public.create_normative_review_artifact(text,text,text,text,jsonb),public.create_normative_review_proposal(uuid,jsonb,text),public.decide_normative_review(uuid,text,text,uuid) from public,anon;
grant execute on function public.manage_normative_reviewer(text,text,text,text),public.create_normative_review_artifact(text,text,text,text,jsonb),public.create_normative_review_proposal(uuid,jsonb,text),public.decide_normative_review(uuid,text,text,uuid) to authenticated;

insert into public.normative_reviewer_roles(user_id,role,status,reason,granted_by)
select id,'review_admin','active','Administrador inicial del paquete de revisión humana.',id
from auth.users where lower(email)='kevinreinosor@gmail.com' and confirmed_at is not null
on conflict(user_id) do nothing;

-- Initial inventory is a read-only snapshot of the existing global catalogue.
insert into public.normative_review_artifacts(artifact_type,artifact_key,title,content_snapshot,normative_source_version_id,created_by)
select 'NORMATIVE_SOURCE_VERSION','source-version:' || v.id,v.version_code,to_jsonb(v),v.id,u.id from public.normative_source_versions v cross join lateral (select id from auth.users where lower(email)='kevinreinosor@gmail.com' and confirmed_at is not null limit 1) u;
insert into public.normative_review_artifacts(artifact_type,artifact_key,title,content_snapshot,requirement_id,created_by)
select 'REQUIREMENT','requirement:' || r.id,r.code || ' · ' || r.title,to_jsonb(r),r.id,u.id from public.requirements r cross join lateral (select id from auth.users where lower(email)='kevinreinosor@gmail.com' and confirmed_at is not null limit 1) u;
insert into public.normative_review_artifacts(artifact_type,artifact_key,title,content_snapshot,minimum_standard_id,created_by)
select 'MINIMUM_STANDARD','minimum-standard:' || s.id,s.code,to_jsonb(s),s.id,u.id from public.minimum_standards s cross join lateral (select id from auth.users where lower(email)='kevinreinosor@gmail.com' and confirmed_at is not null limit 1) u;
insert into public.normative_review_artifacts(artifact_type,artifact_key,title,content_snapshot,standard_profile_version_id,created_by)
select 'STANDARD_PROFILE_VERSION','standard-profile-version:' || v.id,v.version_code,to_jsonb(v),v.id,u.id from public.standard_profile_versions v cross join lateral (select id from auth.users where lower(email)='kevinreinosor@gmail.com' and confirmed_at is not null limit 1) u;
insert into public.normative_review_artifacts(artifact_type,artifact_key,title,content_snapshot,profile_standard_id,created_by)
select 'PROFILE_STANDARD','profile-standard:' || s.id,s.id::text,to_jsonb(s),s.id,u.id from public.profile_standards s cross join lateral (select id from auth.users where lower(email)='kevinreinosor@gmail.com' and confirmed_at is not null limit 1) u;
insert into public.normative_review_artifacts(artifact_type,artifact_key,title,content_snapshot,applicability_rule_id,created_by)
select 'APPLICABILITY_RULE','applicability-rule:' || r.id,r.rule_code || ' v' || r.version_number,to_jsonb(r),r.id,u.id from public.applicability_rules r cross join lateral (select id from auth.users where lower(email)='kevinreinosor@gmail.com' and confirmed_at is not null limit 1) u;
insert into public.normative_review_artifacts(artifact_type,artifact_key,title,content_snapshot,assessment_scoring_rule_id,created_by)
select 'ASSESSMENT_SCORING_RULE','scoring-rule:' || r.id,r.code || ' v' || r.version_number,to_jsonb(r),r.id,u.id from public.assessment_scoring_rules r cross join lateral (select id from auth.users where lower(email)='kevinreinosor@gmail.com' and confirmed_at is not null limit 1) u;
insert into public.normative_review_artifacts(artifact_type,artifact_key,title,content_snapshot,risk_methodology_version_id,created_by)
select 'RISK_METHODOLOGY_VERSION','methodology-version:' || v.id,v.version_code,to_jsonb(v),v.id,u.id from public.risk_methodology_versions v cross join lateral (select id from auth.users where lower(email)='kevinreinosor@gmail.com' and confirmed_at is not null limit 1) u;
insert into public.normative_review_artifacts(artifact_type,artifact_key,title,content_snapshot,risk_methodology_formula_id,created_by)
select 'RISK_METHODOLOGY_FORMULA','methodology-formula:' || f.id,f.code,to_jsonb(f),f.id,u.id from public.risk_methodology_formulas f cross join lateral (select id from auth.users where lower(email)='kevinreinosor@gmail.com' and confirmed_at is not null limit 1) u;
insert into public.normative_review_artifacts(artifact_type,artifact_key,title,content_snapshot,risk_methodology_interpretation_rule_id,created_by)
select 'RISK_METHODOLOGY_INTERPRETATION_RULE','methodology-rule:' || r.id,r.rule_code,to_jsonb(r),r.id,u.id from public.risk_methodology_interpretation_rules r cross join lateral (select id from auth.users where lower(email)='kevinreinosor@gmail.com' and confirmed_at is not null limit 1) u;

notify pgrst, 'reload schema';
