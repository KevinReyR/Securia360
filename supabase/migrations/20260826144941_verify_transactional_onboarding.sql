-- Deployment assertions for resumability, idempotency and tenant isolation (UTC migration version).
-- Fixtures are removed before this migration commits.

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-4000-c000-000000000001', 'authenticated', 'authenticated',
    'onboarding-a@securia360.invalid', '{"provider":"email","providers":["email"]}',
    '{"first_name":"Usuario","last_name":"Onboarding A"}', now(), now()
  ),
  (
    '00000000-0000-4000-c000-000000000002', 'authenticated', 'authenticated',
    'onboarding-b@securia360.invalid', '{"provider":"email","providers":["email"]}',
    '{"first_name":"Usuario","last_name":"Onboarding B"}', now(), now()
  );

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-c000-000000000001","role":"authenticated"}',
  true
);

insert into public.organizations (id, name, slug, created_by, updated_by)
values (
  '00000000-0000-4000-c100-000000000001',
  'Onboarding Test A',
  'onboarding-test-a',
  '00000000-0000-4000-c000-000000000001',
  '00000000-0000-4000-c000-000000000001'
);

insert into public.organizations (id, name, slug)
values (
  '00000000-0000-4000-c100-000000000002',
  'Onboarding Test B',
  'onboarding-test-b'
);

set local role authenticated;

select public.save_organization_onboarding_step(
  '00000000-0000-4000-c100-000000000001', 1::smallint,
  '{"name":"Empresa Onboarding Colombia SAS","nit":"901000001-1"}'::jsonb
);
select public.save_organization_onboarding_step(
  '00000000-0000-4000-c100-000000000001', 2::smallint,
  '{"legal_name":"Empresa Onboarding Colombia SAS","trade_name":"Onboarding","tax_id":"901000001-1"}'::jsonb
);
select public.save_organization_onboarding_step(
  '00000000-0000-4000-c100-000000000001', 3::smallint,
  '{"economic_activity":"Desarrollo de sistemas empresariales"}'::jsonb
);
select public.save_organization_onboarding_step(
  '00000000-0000-4000-c100-000000000001', 4::smallint,
  '{"ciiu_code":"6201"}'::jsonb
);
select public.save_organization_onboarding_step(
  '00000000-0000-4000-c100-000000000001', 5::smallint,
  '{"employee_count":42}'::jsonb
);
select public.save_organization_onboarding_step(
  '00000000-0000-4000-c100-000000000001', 6::smallint,
  '{"risk_class":2}'::jsonb
);
select public.save_organization_onboarding_step(
  '00000000-0000-4000-c100-000000000001', 7::smallint,
  '[{"name":"Principal","code":"BOG","address":"Calle 1","city":"Bogotá","department":"Bogotá D.C."},{"name":"Operaciones","code":"MED","address":"Calle 2","city":"Medellín","department":"Antioquia"}]'::jsonb
);
select public.save_organization_onboarding_step(
  '00000000-0000-4000-c100-000000000001', 8::smallint,
  jsonb_build_object(
    'member_id', (
      select id from public.organization_members
      where organization_id = '00000000-0000-4000-c100-000000000001'
        and user_id = '00000000-0000-4000-c000-000000000001'
    )
  )
);
select public.save_organization_onboarding_step(
  '00000000-0000-4000-c100-000000000001', 9::smallint,
  '{"work_at_height":true,"confined_spaces":false,"chemical_exposure":false,"electrical_work":true,"transport_operations":false,"heavy_machinery":false,"night_work":true,"remote_work":true,"manual_load_handling":false}'::jsonb
);

do $$
declare
  cross_tenant_denied boolean := false;
begin
  begin
    perform public.save_organization_onboarding_step(
      '00000000-0000-4000-c100-000000000002', 1::smallint,
      '{"name":"Intento cruzado","nit":"999999999-9"}'::jsonb
    );
  exception when insufficient_privilege then
    cross_tenant_denied := true;
  end;

  if not cross_tenant_denied then
    raise exception 'cross-tenant onboarding write was not denied';
  end if;
end;
$$;

select public.complete_organization_onboarding(
  '00000000-0000-4000-c100-000000000001',
  '00000000-0000-4000-c900-000000000001'
);
select public.complete_organization_onboarding(
  '00000000-0000-4000-c100-000000000001',
  '00000000-0000-4000-c900-000000000001'
);

reset role;

select 1 / case when (
  select current_step = 9 and completed_at is not null
  from public.onboarding_progress
  where organization_id = '00000000-0000-4000-c100-000000000001'
) then 1 else 0 end as onboarding_completed_assertion;

select 1 / case when (
  select count(*) = 1 from public.legal_entities
  where organization_id = '00000000-0000-4000-c100-000000000001'
) then 1 else 0 end as idempotent_legal_entity_assertion;

select 1 / case when (
  select count(*) = 2 from public.sites
  where organization_id = '00000000-0000-4000-c100-000000000001'
) then 1 else 0 end as idempotent_sites_assertion;

select 1 / case when (
  select count(*) = 1 from public.domain_events
  where organization_id = '00000000-0000-4000-c100-000000000001'
    and event_type = 'organization.classification_source_changed'
) then 1 else 0 end as idempotent_event_assertion;

select 1 / case when exists (
  select 1
  from public.organization_members om
  join public.member_roles mr
    on mr.organization_id = om.organization_id
   and mr.organization_member_id = om.id
  join public.roles r on r.id = mr.role_id
  where om.organization_id = '00000000-0000-4000-c100-000000000001'
    and om.user_id = '00000000-0000-4000-c000-000000000001'
    and r.code = 'organization_admin'
) then 1 else 0 end as creator_admin_assertion;

select 1 / case when exists (
  select 1
  from public.organization_members om
  join public.member_roles mr
    on mr.organization_id = om.organization_id
   and mr.organization_member_id = om.id
  join public.roles r on r.id = mr.role_id
  where om.organization_id = '00000000-0000-4000-c100-000000000001'
    and om.user_id = '00000000-0000-4000-c000-000000000001'
    and r.code = 'sst_manager'
) then 1 else 0 end as responsible_sst_assertion;

set local session_replication_role = replica;

delete from public.audit_log
where organization_id in (
  '00000000-0000-4000-c100-000000000001',
  '00000000-0000-4000-c100-000000000002'
);
delete from public.domain_events
where organization_id in (
  '00000000-0000-4000-c100-000000000001',
  '00000000-0000-4000-c100-000000000002'
);
delete from public.organization_characteristics
where organization_id = '00000000-0000-4000-c100-000000000001';
delete from public.sites
where organization_id = '00000000-0000-4000-c100-000000000001';
delete from public.legal_entities
where organization_id = '00000000-0000-4000-c100-000000000001';
delete from public.onboarding_progress
where organization_id = '00000000-0000-4000-c100-000000000001';
delete from public.member_roles
where organization_id = '00000000-0000-4000-c100-000000000001';
delete from public.organization_members
where organization_id = '00000000-0000-4000-c100-000000000001';
delete from public.organizations
where id in (
  '00000000-0000-4000-c100-000000000001',
  '00000000-0000-4000-c100-000000000002'
);
delete from public.profiles
where id in (
  '00000000-0000-4000-c000-000000000001',
  '00000000-0000-4000-c000-000000000002'
);
delete from auth.users
where id in (
  '00000000-0000-4000-c000-000000000001',
  '00000000-0000-4000-c000-000000000002'
);

set local session_replication_role = origin;
select set_config('request.jwt.claims', '{}', true);
