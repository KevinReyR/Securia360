-- Security hardening: global normative metadata is readable by signed-in users,
-- but must never be writable through the exposed Data API.

alter table public.classification_evaluators enable row level security;
alter table public.classification_evaluator_versions enable row level security;
alter table public.assessment_scoring_rules enable row level security;

revoke all on table public.classification_evaluators,
  public.classification_evaluator_versions,
  public.assessment_scoring_rules from anon;
revoke insert, update, delete on table public.classification_evaluators,
  public.classification_evaluator_versions,
  public.assessment_scoring_rules from authenticated;
grant select on table public.classification_evaluators,
  public.classification_evaluator_versions,
  public.assessment_scoring_rules to authenticated;

create policy classification_evaluators_authenticated_read
  on public.classification_evaluators for select to authenticated
  using ((select auth.uid()) is not null);

create policy classification_evaluator_versions_authenticated_read
  on public.classification_evaluator_versions for select to authenticated
  using ((select auth.uid()) is not null);

create policy assessment_scoring_rules_authenticated_read
  on public.assessment_scoring_rules for select to authenticated
  using ((select auth.uid()) is not null);

notify pgrst, 'reload schema';
