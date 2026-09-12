-- Regression checks for explicit improvement action creation.
begin;

do $$
declare
  function_definition text;
begin
  select pg_get_functiondef('private.sync_assessment_improvement_plan()'::regprocedure)
  into function_definition;

  if function_definition ilike '%insert into public.improvement_actions%' then
    raise exception 'assessment synchronization still creates improvement actions';
  end if;

  if exists (
    select 1
    from public.improvement_actions
    where generated_key like 'default:%'
      and title = 'Definir y ejecutar acción de mejora'
      and status = 'pending'
      and description is null
      and responsible_user_id is null
      and target_date is null
      and evidence_document_version_id is null
      and validation_note is null
  ) then
    raise exception 'an untouched generated placeholder remains active';
  end if;
end;
$$;

rollback;
