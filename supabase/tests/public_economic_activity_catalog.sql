-- Read-only regression checks for the public Decreto 768 catalog.
begin;

set local role anon;

do $$
declare
  v_example_count integer;
  v_example_risks smallint[];
begin
  select count(*)::integer, array_agg(risk_class order by risk_class)
    into v_example_count, v_example_risks
  from public.search_public_economic_activities('161-01', 50);
  if v_example_count <> 3 or v_example_risks <> array[2,4,5]::smallint[] then
    raise exception '161-01 must preserve three options with risks II, IV and V';
  end if;

  if (select count(*) from public.search_public_economic_activities('', 500)) > 50 then
    raise exception 'Public search must clamp results to 50';
  end if;

  if not has_function_privilege('anon', 'public.search_public_economic_activities(text,integer)', 'EXECUTE') then
    raise exception 'anon must be able to execute the public search RPC';
  end if;
  if has_table_privilege('anon', 'public_catalog.economic_activity_catalog_entries', 'SELECT') then
    raise exception 'anon must not read the private catalog table';
  end if;
end;
$$;

select '1..1';
select 'ok 1 - public economic activity catalog is limited, private and preserves duplicate-code options';

rollback;
