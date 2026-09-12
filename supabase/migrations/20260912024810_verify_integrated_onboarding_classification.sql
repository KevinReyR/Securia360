-- Deployment assertions for catalog authority, tenant isolation, profile
-- resolution and idempotent initial classification. Fixtures are removed.

insert into auth.users(id,aud,role,email,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('00000000-0000-4000-d000-000000000001','authenticated','authenticated','onboarding-classification@securia360.invalid',
  '{"provider":"email","providers":["email"]}','{"first_name":"Prueba","last_name":"Clasificación"}',now(),now());

select set_config('request.jwt.claims','{"role":"service_role"}',true);

insert into public.organizations(id,name,slug,created_by,updated_by) values
('00000000-0000-4000-d100-000000000001','Onboarding Classification A','onboarding-classification-a','00000000-0000-4000-d000-000000000001','00000000-0000-4000-d000-000000000001');
insert into public.organizations(id,name,slug) values
('00000000-0000-4000-d100-000000000002','Onboarding Classification B','onboarding-classification-b');

select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-d000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select public.save_organization_onboarding_step('00000000-0000-4000-d100-000000000001',1::smallint,'{"name":"Empresa Clasificada SAS","nit":"901000099-1"}'::jsonb);
select public.save_organization_onboarding_step('00000000-0000-4000-d100-000000000001',2::smallint,'{"legal_name":"Empresa Clasificada SAS","trade_name":"Clasificada","tax_id":"901000099-1"}'::jsonb);
select public.save_organization_onboarding_step(
  '00000000-0000-4000-d100-000000000001',3::smallint,
  (select jsonb_build_object('entry_id',entry_id,'ciiu_code',ciiu_code,'risk_class',risk_class,'activity',activity,
    'catalog_version',catalog_version,'source_reference',source_reference,'source_review_status',source_review_status)
   from public.search_public_economic_activities('6201-01',50)
   where ciiu_code='6201-01' and risk_class=1 limit 1)
);
select public.save_organization_onboarding_step('00000000-0000-4000-d100-000000000001',4::smallint,'{"employee_count":12}'::jsonb);
select public.save_organization_onboarding_step('00000000-0000-4000-d100-000000000001',5::smallint,'[{"name":"Principal","code":"BOG","address":"Calle 1","city":"Bogotá","department":"Bogotá D.C."}]'::jsonb);
select public.save_organization_onboarding_step(
  '00000000-0000-4000-d100-000000000001',6::smallint,
  jsonb_build_object('member_id',(select id from public.organization_members where organization_id='00000000-0000-4000-d100-000000000001' and user_id='00000000-0000-4000-d000-000000000001'))
);
select public.save_organization_onboarding_step('00000000-0000-4000-d100-000000000001',7::smallint,
  '{"work_at_height":false,"confined_spaces":false,"chemical_exposure":false,"electrical_work":false,"transport_operations":false,"heavy_machinery":false,"night_work":false,"remote_work":true,"manual_load_handling":false}'::jsonb);

do $$
begin
  begin
    perform public.save_organization_onboarding_step('00000000-0000-4000-d100-000000000002',1::smallint,'{"name":"Intento cruzado","nit":"999999999-9"}'::jsonb);
    raise exception 'cross-tenant onboarding write was not denied';
  exception when insufficient_privilege then null;
  end;
end; $$;

select public.complete_organization_onboarding('00000000-0000-4000-d100-000000000001','00000000-0000-4000-d900-000000000001');
select public.complete_organization_onboarding('00000000-0000-4000-d100-000000000001','00000000-0000-4000-d900-000000000001');

reset role;

select 1/case when (select current_step=7 and completed_at is not null from public.onboarding_progress where organization_id='00000000-0000-4000-d100-000000000001') then 1 else 0 end as seven_step_completion_assertion;
select 1/case when (select count(*)=1 from public.organization_classifications oc join public.standard_profiles sp on sp.id=oc.standard_profile_id where oc.organization_id='00000000-0000-4000-d100-000000000001' and oc.effective_to is null and oc.employee_count=12 and oc.risk_class=1 and oc.ciiu_code='6201-01' and sp.code='RES0312_P21') then 1 else 0 end as current_classification_assertion;
select 1/case when (select count(*)=1 from public.domain_events where organization_id='00000000-0000-4000-d100-000000000001' and event_type='classification.changed') then 1 else 0 end as idempotent_classification_event_assertion;
select 1/case when exists(
  select 1 from public.organization_classifications oc
  join public.standard_profile_versions spv on spv.standard_profile_id=oc.standard_profile_id and spv.status='published' and spv.expert_review_status='reviewed'
  join public.assessment_scoring_rules asr on asr.standard_profile_version_id=spv.id and asr.status='approved' and asr.expert_review_status='reviewed'
  where oc.organization_id='00000000-0000-4000-d100-000000000001' and oc.effective_to is null
) then 1 else 0 end as initial_assessment_ready_assertion;

set local session_replication_role=replica;
delete from public.audit_log where organization_id in('00000000-0000-4000-d100-000000000001','00000000-0000-4000-d100-000000000002');
delete from public.domain_events where organization_id in('00000000-0000-4000-d100-000000000001','00000000-0000-4000-d100-000000000002');
delete from public.organization_characteristics where organization_id='00000000-0000-4000-d100-000000000001';
delete from public.sites where organization_id='00000000-0000-4000-d100-000000000001';
delete from public.organization_classifications where organization_id='00000000-0000-4000-d100-000000000001';
delete from public.legal_entities where organization_id='00000000-0000-4000-d100-000000000001';
delete from public.onboarding_progress where organization_id='00000000-0000-4000-d100-000000000001';
delete from public.member_roles where organization_id='00000000-0000-4000-d100-000000000001';
delete from public.organization_members where organization_id='00000000-0000-4000-d100-000000000001';
delete from public.organizations where id in('00000000-0000-4000-d100-000000000001','00000000-0000-4000-d100-000000000002');
delete from public.profiles where id='00000000-0000-4000-d000-000000000001';
delete from auth.users where id='00000000-0000-4000-d000-000000000001';
set local session_replication_role=origin;
select set_config('request.jwt.claims','{}',true);
