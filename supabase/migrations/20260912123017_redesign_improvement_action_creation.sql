-- Improvement opportunities remain automatic; executable actions are now
-- created explicitly by an authorized user through the plan UI.
create or replace function private.sync_assessment_improvement_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item record;
begin
  if new.status not in ('completed', 'validated') or old.status = new.status then
    return new;
  end if;

  for item in
    select
      ai.id as assessment_item_id,
      si.minimum_standard_id,
      ms.code,
      ms.functional_description
    from public.assessment_items ai
    join public.organization_standard_snapshot_items si on si.id = ai.snapshot_item_id
    join public.minimum_standards ms on ms.id = si.minimum_standard_id
    where ai.assessment_id = new.id
      and ai.response = 'not_met'
  loop
    insert into public.improvement_gaps (
      organization_id,
      origin_type,
      assessment_item_id,
      deduplication_key,
      title,
      description,
      priority,
      last_detected_assessment_id,
      created_by
    ) values (
      new.organization_id,
      'assessment_item',
      item.assessment_item_id,
      'minimum_standard:' || item.minimum_standard_id,
      'Brecha · ' || item.code,
      item.functional_description,
      'high',
      new.id,
      (select auth.uid())
    )
    on conflict (organization_id, deduplication_key) do update
      set last_detected_assessment_id = excluded.last_detected_assessment_id,
          updated_at = now();
  end loop;

  return new;
end;
$$;

revoke all on function private.sync_assessment_improvement_plan() from public, anon, authenticated, service_role;

-- Preserve audit history while removing untouched generated placeholders from
-- active work queues. Any placeholder that a person already enriched survives.
update public.improvement_actions
set status = 'cancelled'
where generated_key like 'default:%'
  and title = 'Definir y ejecutar acción de mejora'
  and status = 'pending'
  and description is null
  and responsible_user_id is null
  and target_date is null
  and evidence_document_version_id is null
  and validation_note is null;

notify pgrst, 'reload schema';
