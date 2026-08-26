-- Tenant deletion is an explicit administrative operation. Child audit rows
-- must not be recreated while PostgreSQL is cascading that deletion.

create or replace function private.capture_core_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  before_row jsonb;
  after_row jsonb;
  tenant_id uuid;
  record_id uuid;
begin
  before_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  after_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;

  tenant_id := coalesce(
    nullif(after_row ->> 'organization_id', '')::uuid,
    nullif(before_row ->> 'organization_id', '')::uuid,
    nullif(after_row ->> 'id', '')::uuid,
    nullif(before_row ->> 'id', '')::uuid
  );

  -- During an organization cascade the parent row is no longer visible to the
  -- child trigger. Skipping those derived deletes prevents audit_log's RESTRICT
  -- FK from turning tenant deletion into a partially failed operation.
  if tg_op = 'DELETE'
     and not exists (select 1 from public.organizations where id = tenant_id) then
    return old;
  end if;

  record_id := coalesce(
    nullif(after_row ->> 'id', '')::uuid,
    nullif(before_row ->> 'id', '')::uuid
  );

  insert into public.audit_log (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    ip_address
  ) values (
    tenant_id,
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    record_id,
    before_row,
    after_row,
    inet_client_addr()
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.capture_core_audit()
  from public, anon, authenticated, service_role;
