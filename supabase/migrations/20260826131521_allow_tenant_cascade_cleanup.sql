-- Keep direct last-admin protection without blocking a parent tenant cascade.

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
  -- Child rows deleted by an organization cascade must not recreate audit rows
  -- that would keep the parent organization alive through the audit FK.
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;

  before_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  after_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;

  tenant_id := coalesce(
    nullif(after_row ->> 'organization_id', '')::uuid,
    nullif(before_row ->> 'organization_id', '')::uuid,
    nullif(after_row ->> 'id', '')::uuid,
    nullif(before_row ->> 'id', '')::uuid
  );
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

create or replace function private.protect_last_active_admin_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_role_code text;
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;

  select code into old_role_code from public.roles where id = old.role_id;
  if old_role_code = 'organization_admin'
     and old.site_id is null
     and (tg_op = 'DELETE' or new.role_id is distinct from old.role_id or new.site_id is not null)
     and not exists (
       select 1
       from public.organization_members om
       join public.member_roles mr
         on mr.organization_id = om.organization_id
        and mr.organization_member_id = om.id
       join public.roles r on r.id = mr.role_id
       where om.organization_id = old.organization_id
         and om.status = 'active'
         and mr.id <> old.id
         and mr.site_id is null
         and r.code = 'organization_admin'
     ) then
    raise exception 'organization must keep an active administrator' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.protect_last_active_admin_role()
  from public, anon, authenticated, service_role;
