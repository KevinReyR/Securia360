-- assessment_items has `response`, not `status`. Keep its immutability guard
-- separate from the assessments trigger so PostgreSQL does not resolve OLD as
-- the row type of the parent table.
create or replace function private.prevent_validated_assessment_item_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.assessments a
    where a.id = old.assessment_id
      and a.status = 'validated'
  ) then
    raise exception 'validated assessment items are immutable' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_validated_assessment_item_mutation()
  from public, anon, authenticated, service_role;

drop trigger if exists assessment_items_immutable_after_validation
  on public.assessment_items;
create trigger assessment_items_immutable_after_validation
  before update or delete on public.assessment_items
  for each row execute function private.prevent_validated_assessment_item_mutation();

notify pgrst, 'reload schema';
