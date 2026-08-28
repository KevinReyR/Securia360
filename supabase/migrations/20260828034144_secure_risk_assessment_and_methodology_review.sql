-- Expert reviewers are platform personnel, never tenant members by implication.
create table public.risk_methodology_reviewers (
  user_id uuid primary key references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);
create table public.risk_methodology_review_decisions (
  id uuid primary key default gen_random_uuid(),
  methodology_version_id uuid not null references public.risk_methodology_versions(id) on delete restrict,
  decision text not null check (decision in ('reviewed','approved','rejected')),
  note text not null check (length(btrim(note)) between 3 and 2000),
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default now()
);
alter table public.risk_methodology_reviewers enable row level security;
alter table public.risk_methodology_review_decisions enable row level security;
create policy methodology_reviewer_self_read on public.risk_methodology_reviewers for select to authenticated using (user_id=(select auth.uid()));
create policy methodology_decisions_reviewer_read on public.risk_methodology_review_decisions for select to authenticated using (exists(select 1 from public.risk_methodology_reviewers r where r.user_id=(select auth.uid()) and r.status='active'));
create policy methodology_decisions_reviewer_insert on public.risk_methodology_review_decisions for insert to authenticated with check (decided_by=(select auth.uid()) and exists(select 1 from public.risk_methodology_reviewers r where r.user_id=(select auth.uid()) and r.status='active'));
grant select on public.risk_methodology_reviewers,risk_methodology_review_decisions to authenticated;
grant insert on public.risk_methodology_review_decisions to authenticated;

drop policy if exists risk_assessments_read on public.risk_assessments;
drop policy if exists risk_assessments_write on public.risk_assessments;
create policy risk_assessments_read on public.risk_assessments for select to authenticated using ((select private.has_permission(organization_id,'risks.read')));
create policy risk_assessments_write on public.risk_assessments for all to authenticated using ((select private.has_permission(organization_id,'risks.manage'))) with check ((select private.has_permission(organization_id,'risks.manage')));

create or replace function private.protect_risk_assessment_history() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if old.status in ('validated','voided') then raise exception 'validated or voided assessments are immutable' using errcode='42501'; end if;
  if new.status='validated' and not private.has_permission(new.organization_id,'risks.validate') then raise exception 'insufficient risk validation permission' using errcode='42501'; end if;
  return new;
end; $$;
revoke all on function private.protect_risk_assessment_history() from public,anon,authenticated,service_role;
create trigger risk_assessments_protect_history before update on public.risk_assessments for each row execute function private.protect_risk_assessment_history();

create or replace function private.review_risk_methodology_version(p_version_id uuid,p_decision text,p_note text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.risk_methodology_reviewers where user_id=(select auth.uid()) and status='active') then raise exception 'expert reviewer access required' using errcode='42501'; end if;
  if p_decision not in ('reviewed','approved','rejected') or length(btrim(p_note))<3 then raise exception 'invalid review decision' using errcode='22023'; end if;
  insert into public.risk_methodology_review_decisions(methodology_version_id,decision,note,decided_by) values(p_version_id,p_decision,p_note,(select auth.uid()));
  update public.risk_methodology_versions set expert_review_status=case when p_decision='rejected' then 'rejected' else 'reviewed' end,status=case when p_decision='approved' then 'approved' when p_decision='rejected' then 'draft' else 'reviewed' end where id=p_version_id;
end; $$;
revoke all on function private.review_risk_methodology_version(uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function private.review_risk_methodology_version(uuid,text,text) to authenticated;
