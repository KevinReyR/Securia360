-- Historical operational migration already applied to the hosted project.
-- Retained locally to keep migration history aligned; the identifiers are
-- specific to the previously removed tenant and account.
begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set session_replication_role = replica;
delete from auth.sessions where user_id='07847a69-642d-48e7-8bc1-1a4d4901b0e7';
do $$
declare r record;
begin
  for r in select c.relname as table_name
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  join information_schema.columns ic on ic.table_schema=n.nspname and ic.table_name=c.relname and ic.column_name='organization_id'
  where n.nspname='public' and c.relkind in ('r','p')
  loop
    execute format('delete from public.%I where organization_id=$1',r.table_name)
      using '306be9f8-5de8-429b-8279-264f89f77dc6'::uuid;
  end loop;
end $$;
delete from public.organizations where id='306be9f8-5de8-429b-8279-264f89f77dc6';
delete from auth.users where id='07847a69-642d-48e7-8bc1-1a4d4901b0e7';
set session_replication_role = origin;
commit;
