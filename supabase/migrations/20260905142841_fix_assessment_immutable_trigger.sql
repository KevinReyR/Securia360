-- Keep trigger record types table-specific. A trigger function that references
-- old.assessment_id cannot be shared with public.assessments (that column does
-- not exist on the parent record).
create or replace function private.prevent_validated_assessment_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'validated' then
    raise exception 'validated assessments are immutable' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.prevent_validated_assessment_mutation() from public, anon, authenticated;
notify pgrst, 'reload schema';
