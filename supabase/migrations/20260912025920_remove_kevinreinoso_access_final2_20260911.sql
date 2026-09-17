-- Historical operational migration already applied to the hosted project.
-- Retained locally to keep migration history aligned; the identifiers are
-- specific to the previously removed tenant and account.
begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set session_replication_role = replica;
delete from auth.sessions where user_id='e3025e6d-f9b0-42b9-82d2-c3ff23a942d8';
do $$
declare r record;
begin
  for r in select c.relname as table_name from pg_class c join pg_namespace n on n.oid=c.relnamespace join information_schema.columns ic on ic.table_schema=n.nspname and ic.table_name=c.relname and ic.column_name='organization_id' where n.nspname='public' and c.relkind in ('r','p') loop
    execute format('delete from public.%I where organization_id=$1',r.table_name) using 'a521e0c2-0293-49cd-87bd-db1a5ad35b10'::uuid;
  end loop;
end $$;
delete from public.organizations where id='a521e0c2-0293-49cd-87bd-db1a5ad35b10';
delete from auth.users where id='e3025e6d-f9b0-42b9-82d2-c3ff23a942d8';
set session_replication_role = origin;
commit;
