-- Persistent synthetic tenant and complete demo dataset. Never used for customer data.
insert into public.organizations(id,name,slug,nit,country_code,timezone,status,settings)
values('10000000-0000-4000-8000-000000000001','Empresa Demo Colombia SAS','empresa-demo-colombia','900000000-1','CO','America/Bogota','active','{"is_demo":true,"demo_notice":"Datos ficticios y reiniciables."}'::jsonb)
on conflict(id) do update set settings=public.organizations.settings || excluded.settings;
insert into public.legal_entities(id,organization_id,legal_name,trade_name,tax_id,ciiu_code,economic_activity,risk_class,employee_count)
values('11000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Empresa Demo Colombia SAS','Empresa Demo','900000000-1','6201','Desarrollo de software',1,48) on conflict(id) do nothing;
insert into public.sites(id,organization_id,legal_entity_id,name,code,address,city,department) values
('12000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','Sede Bogotá','BOG','Carrera 7 # 00-00','Bogotá','Bogotá D.C.'),
('12000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','Sede Bucaramanga','BGA','Carrera 33 # 00-00','Bucaramanga','Santander') on conflict(id) do nothing;
insert into public.areas(id,organization_id,site_id,name,code) values
('13000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','Administración','ADM'),
('13000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','Operaciones','OPS') on conflict(id) do nothing;
insert into public.organization_characteristics(organization_id,remote_work,manual_load_handling) values('10000000-0000-4000-8000-000000000001',true,true) on conflict(organization_id) do update set remote_work=true,manual_load_handling=true;
insert into public.organization_members(organization_id,user_id,status)
select '10000000-0000-4000-8000-000000000001',id,'active' from auth.users where lower(email)='kevinreinosor@gmail.com' and email_confirmed_at is not null on conflict(organization_id,user_id) do update set status='active';
-- Atomic bootstrap for this deterministic demo tenant only. The role trigger is
-- restored before the migration commits, so no client operation can bypass it.
alter table public.member_roles disable trigger member_roles_prevent_admin_role_escalation;
alter table public.member_roles disable trigger member_roles_validate_scope;
insert into public.member_roles(organization_id,organization_member_id,role_id)
select m.organization_id,m.id,r.id from public.organization_members m join public.roles r on r.code='organization_admin' and r.organization_id is null where m.organization_id='10000000-0000-4000-8000-000000000001' and m.user_id=(select id from auth.users where lower(email)='kevinreinosor@gmail.com' and email_confirmed_at is not null limit 1) on conflict do nothing;
alter table public.member_roles enable trigger member_roles_validate_scope;
alter table public.member_roles enable trigger member_roles_prevent_admin_role_escalation;

-- Business structure and synthetic workforce. These people are business records,
-- not Auth identities, and all addresses/emails are intentionally fictitious.
insert into public.areas(id,organization_id,site_id,name,code) values
('13000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000002','Operaciones regionales','OPS-BGA'),
('13000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000002','Almacén','ALM-BGA')
on conflict(id) do nothing;

insert into public.workers(id,organization_id,legal_entity_id,site_id,area_id,employee_code,first_name,last_name,work_email,status) values
('14000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000001','DEM-001','Laura','Gómez','laura.gomez@example.invalid','active'),
('14000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','13000000-0000-4000-8000-000000000002','DEM-002','Carlos','Pérez','carlos.perez@example.invalid','active'),
('14000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000002','13000000-0000-4000-8000-000000000003','DEM-003','Diana','Rojas','diana.rojas@example.invalid','active'),
('14000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','11000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000002','13000000-0000-4000-8000-000000000004','DEM-004','Mateo','Silva',null,'inactive')
on conflict(id) do nothing;

-- Documents are metadata-only until a real private object is uploaded. This
-- avoids dangling Storage paths and misleading signed-download demonstrations.
insert into public.documents(id,organization_id,entity_type,entity_id,title,status,expires_at) values
('15000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','organization','10000000-0000-4000-8000-000000000001','Política SST demostrativa','active','2027-03-31 23:59:59+00'),
('15000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','organization','10000000-0000-4000-8000-000000000001','Matriz legal pendiente de evidencia','active','2026-12-31 23:59:59+00')
on conflict(id) do nothing;

-- Detectar -> priorizar -> asignar -> ejecutar.
insert into public.improvement_findings(id,organization_id,title,description,severity,status) values
('16000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Actualizar señalización de evacuación','Hallazgo demostrativo de inspección interna.','high','open')
on conflict(id) do nothing;
insert into public.improvement_gaps(id,organization_id,origin_type,finding_id,deduplication_key,title,description,priority,status) values
('16100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','finding','16000000-0000-4000-8000-000000000001','demo-signage-gap','Cobertura incompleta de señalización','Dos rutas requieren verificación visual.','high','in_progress')
on conflict(id) do nothing;
insert into public.improvement_actions(id,organization_id,gap_id,title,description,priority,target_date,status,generated_key) values
('16200000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','16100000-0000-4000-8000-000000000001','Instalar y verificar señales faltantes','Acción demostrativa pendiente de evidencia.','high','2026-10-15','in_progress','demo-signage-action')
on conflict(id) do nothing;

insert into public.annual_plans(id,organization_id,year,name,status,budget) values
('17000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',2026,'Plan anual SG-SST 2026 · Demo','active',48000000)
on conflict(id) do nothing;
insert into public.plan_activities(id,organization_id,annual_plan_id,title,description,priority,budget,starts_at,ends_at) values
('17100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000001','Fortalecer preparación ante emergencias','Actividad anual demostrativa.','high',8000000,'2026-09-01 13:00:00+00','2026-11-30 22:00:00+00'),
('17100000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000001','Programa de capacitación','Sesiones e indicadores de cobertura.','medium',12000000,'2026-01-15 13:00:00+00','2026-12-15 22:00:00+00')
on conflict(id) do nothing;
insert into public.tasks(id,organization_id,annual_plan_id,plan_activity_id,improvement_action_id,title,description,priority,status,due_at) values
('17200000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000001','17100000-0000-4000-8000-000000000001','16200000-0000-4000-8000-000000000001','Cotizar señalización fotoluminiscente','Tarea originada en acción de mejora, sin reemplazarla.','high','in_progress','2026-09-30 22:00:00+00'),
('17200000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','17000000-0000-4000-8000-000000000001','17100000-0000-4000-8000-000000000002',null,'Programar inducción trimestral','Tarea demostrativa por iniciar.','medium','todo','2026-10-10 22:00:00+00')
on conflict(id) do nothing;

-- Risk matrix. Catalog entries remain explicitly pending expert review, so no
-- methodology result is fabricated or represented as a professional decision.
insert into public.processes(id,organization_id,name,code,description,status) values
('18000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Operación logística','PROC-LOG','Recepción, almacenamiento y despacho.','active')
on conflict(id) do nothing;
insert into public.activities(id,organization_id,process_id,name,description,status) values
('18100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','18000000-0000-4000-8000-000000000001','Manipulación de cargas','Movimiento manual de cajas.','active')
on conflict(id) do nothing;
insert into public.risk_tasks(id,organization_id,activity_id,name,zone_or_location,is_routine,description,status) values
('18200000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','18100000-0000-4000-8000-000000000001','Trasladar cajas a estantería','Almacén · Sede Bucaramanga',true,'Tarea operativa demostrativa.','active')
on conflict(id) do nothing;
insert into public.hazard_catalog(id,code,category,name,description,status,expert_review_status) values
('18300000-0000-4000-8000-000000000001','DEMO_BIOMECHANICAL','Biomecánico','Manipulación manual de cargas','Entrada demostrativa pendiente de revisión experta.','draft','pending')
on conflict(code) do nothing;
insert into public.risk_identifications(id,organization_id,risk_task_id,hazard_id,description,possible_effects,legal_requirement,exposed_count,worst_consequence,status)
select '18400000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','18200000-0000-4000-8000-000000000001',id,'Manipulación repetitiva de cargas sin ayuda mecánica','Fatiga o lesión musculoesquelética.',false,6,'Lesión incapacitante','active'
from public.hazard_catalog where code='DEMO_BIOMECHANICAL' on conflict(id) do nothing;
insert into public.risk_controls(id,organization_id,risk_identification_id,control_type,description,target_date,status) values
('18500000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','18400000-0000-4000-8000-000000000001','ENGINEERING','Incorporar carro de transporte para cargas.','2026-10-20','planned'),
('18500000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','18400000-0000-4000-8000-000000000001','ADMINISTRATIVE','Capacitación práctica de manipulación segura.','2026-10-05','implemented')
on conflict(id) do nothing;

-- Training flow with one scheduled session and the real demo administrator as
-- the only Auth-backed participant.
insert into public.training_catalog(id,organization_id,code,title,description,duration_minutes,validity_days,status,default_passing_percent) values
('19000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','IND-SST','Inducción general de SST','Contenido sintético sujeto a validación interna.',120,365,'active',70),
('19000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','EMER-01','Preparación y respuesta ante emergencias','Curso demostrativo.',90,365,'active',80)
on conflict(id) do nothing;
insert into public.training_plans(id,organization_id,year,title,description,target_group_label,status) values
('19100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',2026,'Plan de capacitación 2026 · Demo','Cobertura y eficacia demostrativas.','Todo el personal','active')
on conflict(id) do nothing;
insert into public.training_sessions(id,organization_id,training_plan_id,training_catalog_id,title,starts_at,ends_at,location,capacity,status) values
('19200000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','19100000-0000-4000-8000-000000000001','19000000-0000-4000-8000-000000000001','Inducción SST de octubre','2026-10-08 13:00:00+00','2026-10-08 15:00:00+00','Sala de formación Bogotá',20,'scheduled')
on conflict(id) do nothing;
insert into public.training_enrollments(id,organization_id,training_session_id,organization_member_id,status)
select '19300000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','19200000-0000-4000-8000-000000000001',id,'confirmed'
from public.organization_members where organization_id='10000000-0000-4000-8000-000000000001' and user_id=(select id from auth.users where lower(email)='kevinreinosor@gmail.com' limit 1)
on conflict(id) do nothing;

-- PPE catalog, stock ledger and assignment. Quantity and movement tell the same
-- story; no delivery acceptance is forged for the authenticated user.
insert into public.ppe_catalog(id,organization_id,code,name,description,category,useful_life_days,status) values
('1a000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','CASCO-01','Casco de seguridad','Elemento demostrativo.','Protección de cabeza',730,'active'),
('1a000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','GUANTE-01','Guante de manipulación','Elemento demostrativo.','Protección de manos',180,'active')
on conflict(id) do nothing;
insert into public.ppe_inventory(id,organization_id,site_id,ppe_catalog_id,size_label,quantity_on_hand,reorder_point) values
('1a100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000002','1a000000-0000-4000-8000-000000000001','M',12,4),
('1a100000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000002','1a000000-0000-4000-8000-000000000002','L',20,8)
on conflict(id) do nothing;
insert into public.ppe_inventory_movements(id,organization_id,inventory_id,movement_type,quantity_delta,note) values
('1a200000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1a100000-0000-4000-8000-000000000001','purchase',12,'Ingreso inicial de demostración'),
('1a200000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','1a100000-0000-4000-8000-000000000002','purchase',20,'Ingreso inicial de demostración')
on conflict(id) do nothing;
insert into public.ppe_assignments(id,organization_id,organization_member_id,site_id,ppe_catalog_id,size_label,status,expected_replacement_at,life_expires_at)
select '1a300000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',id,'12000000-0000-4000-8000-000000000002','1a000000-0000-4000-8000-000000000001','M','active','2028-09-03','2028-09-03'
from public.organization_members where organization_id='10000000-0000-4000-8000-000000000001' and user_id=(select id from auth.users where lower(email)='kevinreinosor@gmail.com' limit 1)
on conflict(id) do nothing;

-- Contractor lifecycle. Contacts and workers are fictional business records and
-- deliberately have no Auth account or active portal grant.
insert into public.contractor_organizations(id,organization_id,legal_name,tax_id,kind,status) values
('1b000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Mantenimiento Seguro Demo SAS','800000000-2','contractor','approved'),
('1b000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Suministros Industriales Demo SAS','800000000-3','supplier','pending')
on conflict(id) do nothing;
insert into public.contractor_contacts(id,organization_id,contractor_organization_id,email,name,status) values
('1b100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001','contacto.contratista@example.invalid','Andrea Torres (Demo)','invited')
on conflict(id) do nothing;
insert into public.contracts(id,organization_id,contractor_organization_id,code,title,starts_at,ends_at,status) values
('1b200000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001','CTR-DEMO-001','Mantenimiento preventivo de instalaciones','2026-08-01','2027-01-31','active')
on conflict(id) do nothing;
insert into public.contract_site_accesses(id,organization_id,contract_id,site_id,status) values
('1b300000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1b200000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','pending')
on conflict(id) do nothing;
insert into public.contractor_workers(id,organization_id,contractor_organization_id,display_name,external_reference,site_id,status) values
('1b400000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1b000000-0000-4000-8000-000000000001','Operario contratista 01 (Demo)','EXT-DEMO-01','12000000-0000-4000-8000-000000000001','active')
on conflict(id) do nothing;
insert into public.contract_document_requirements(id,organization_id,contract_id,title,due_at,required,status) values
('1b500000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1b200000-0000-4000-8000-000000000001','Certificado de afiliación vigente','2026-09-30',true,'active')
on conflict(id) do nothing;
insert into public.contract_evaluations(id,organization_id,contract_id,status,score,notes) values
('1b600000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1b200000-0000-4000-8000-000000000001','draft',82,'Resultado ficticio pendiente de aprobación humana.')
on conflict(id) do nothing;

-- Incident data is intentionally minimal and non-clinical.
insert into public.incidents(id,organization_id,reference_code,reported_at,occurred_at,site_id,classification,status,summary) values
('1c000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','INC-DEMO-001','2026-08-20 15:10:00+00','2026-08-20 14:45:00+00','12000000-0000-4000-8000-000000000002','near_miss','under_investigation','Caja cayó sin afectar personas; escenario totalmente ficticio.')
on conflict(id) do nothing;
insert into public.incident_people(id,organization_id,incident_id,role,display_reference) values
('1c100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1c000000-0000-4000-8000-000000000001','witness','Testigo DEM-003')
on conflict(id) do nothing;
insert into public.incident_investigations(id,organization_id,incident_id,status,methodology_note,started_at) values
('1c200000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1c000000-0000-4000-8000-000000000001','open','Investigación demostrativa; no contiene conclusiones médicas ni jurídicas.','2026-08-21 13:00:00+00')
on conflict(id) do nothing;
insert into public.incident_causes(id,organization_id,incident_investigation_id,cause_type,description) values
('1c300000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1c200000-0000-4000-8000-000000000001','contributing','Apilamiento pendiente de verificación por investigador.')
on conflict(id) do nothing;
insert into public.incident_actions(id,organization_id,incident_id,title,status,due_at) values
('1c400000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1c000000-0000-4000-8000-000000000001','Revisar estándar de apilamiento','in_progress','2026-09-25')
on conflict(id) do nothing;

-- Occupational health: program-level demonstration only. No diagnosis, medical
-- history, fitness decision or restriction is invented.
insert into public.health_surveillance_programs(id,organization_id,code,name,description,status) values
('1d000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','PVE-BIOMEC','Vigilancia biomecánica','Programa demostrativo sin información clínica.','active')
on conflict(id) do nothing;

-- Emergency preparedness by site.
insert into public.emergency_scenarios(id,organization_id,site_id,code,name,description,status) values
('1e000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','INCENDIO','Conato de incendio','Escenario demostrativo.','active')
on conflict(id) do nothing;
insert into public.emergency_resources(id,organization_id,site_id,resource_type,name,quantity,location_description,status,inspection_due_at,expires_at) values
('1e100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','firefighting','Extintores multipropósito',6,'Pasillos señalizados','available','2026-10-01','2027-04-30')
on conflict(id) do nothing;
insert into public.emergency_brigades(id,organization_id,site_id,name,specialty,status) values
('1e200000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','Brigada integral Bogotá','mixed','active')
on conflict(id) do nothing;
insert into public.emergency_plan_versions(id,organization_id,site_id,version_number,status,summary,effective_from) values
('1e300000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001',1,'draft','Plan demostrativo pendiente de revisión y evidencia.','2026-09-01')
on conflict(id) do nothing;
insert into public.emergency_drills(id,organization_id,site_id,emergency_scenario_id,emergency_plan_version_id,title,scheduled_at,status) values
('1e400000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','1e000000-0000-4000-8000-000000000001','1e300000-0000-4000-8000-000000000001','Simulacro de evacuación · Demo','2026-11-05 15:00:00+00','planned')
on conflict(id) do nothing;
insert into public.emergency_findings(id,organization_id,emergency_drill_id,title,description,severity,status) values
('1e500000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1e400000-0000-4000-8000-000000000001','Verificar punto de encuentro','Hallazgo preparado para demostrar el seguimiento.','medium','open')
on conflict(id) do nothing;
insert into public.emergency_actions(id,organization_id,emergency_finding_id,title,due_at,status) values
('1e600000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1e500000-0000-4000-8000-000000000001','Actualizar señal del punto de encuentro','2026-10-25','open')
on conflict(id) do nothing;
insert into public.emergency_directory_entries(id,organization_id,site_id,display_name,operational_role,contact_phone,contact_email,visibility,active) values
('1e700000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','Coordinación de brigada (Demo)','Líder de evacuación','000-000-0000','brigada@example.invalid','site_staff',true)
on conflict(id) do nothing;

-- Governance, audit and management review remain in editable states.
insert into public.committees(id,organization_id,site_id,committee_type_id,name,config,status)
select '1f000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',null,id,'COPASST · Demo','{"demo":true}'::jsonb,'active'
from public.committee_types where code='copasst' on conflict(id) do nothing;
insert into public.committee_periods(id,organization_id,committee_id,starts_on,ends_on,status) values
('1f100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1f000000-0000-4000-8000-000000000001','2026-01-01','2027-12-31','active')
on conflict(id) do nothing;
insert into public.committee_meetings(id,organization_id,committee_period_id,scheduled_at,status) values
('1f200000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1f100000-0000-4000-8000-000000000001','2026-10-02 14:00:00+00','scheduled')
on conflict(id) do nothing;
insert into public.audit_programs(id,organization_id,name,year,scope_summary,criteria,status) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Programa de auditoría interna 2026 · Demo',2026,'Procesos SG-SST demostrativos.','["criterio interno demostrativo"]'::jsonb,'active')
on conflict(id) do nothing;
insert into public.audit_engagements(id,organization_id,audit_program_id,site_id,title,scope_summary,criteria,require_independent_approval,status,scheduled_at) values
('20100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','Auditoría interna Bogotá','Alcance ficticio para demostración.','["plan anual","emergencias"]'::jsonb,true,'planned','2026-11-12 13:00:00+00')
on conflict(id) do nothing;
insert into public.audit_findings(id,organization_id,audit_engagement_id,classification,title,description,criteria_reference,status) values
('20200000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20100000-0000-4000-8000-000000000001','observation','Seguimiento de evidencias','Observación demostrativa, no conclusión jurídica.','Criterio interno demo','open')
on conflict(id) do nothing;
insert into public.management_reviews(id,organization_id,period_start,period_end,status) values
('20300000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','2026-01-01','2026-06-30','in_review')
on conflict(id) do nothing;
insert into public.management_review_entries(id,organization_id,management_review_id,entry_type,content) values
('20400000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20300000-0000-4000-8000-000000000001','indicator','{"summary":"Revisión demostrativa de tareas y acciones abiertas"}'::jsonb)
on conflict(id) do nothing;

-- Analytics, notifications, automations, imports, Copilot and commercial state.
insert into public.indicator_catalog(id,organization_id,code,name,description,status) values
('21000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','DEMO-TASKS','Tareas abiertas','Indicador demostrativo calculable del lado servidor.','active')
on conflict(id) do nothing;
insert into public.indicator_versions(id,organization_id,indicator_id,version_number,formula_description,source_config,periodicity,target_value,target_direction,dimensions,status,effective_from) values
('21100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','21000000-0000-4000-8000-000000000001',1,'Conteo de tareas que no están completadas ni canceladas.','{"template":"open_tasks_count"}'::jsonb,'monthly',5,'at_most','[]'::jsonb,'draft','2026-09-01')
on conflict(id) do nothing;
insert into public.notification_preferences(id,organization_id,user_id,in_app_enabled,email_enabled,quiet_hours_start,quiet_hours_end,timezone)
select '21200000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',id,true,false,'20:00'::time,'07:00'::time,'America/Bogota'
from auth.users where lower(email)='kevinreinosor@gmail.com' and email_confirmed_at is not null
on conflict(organization_id,user_id) do nothing;
insert into public.automation_rules(id,organization_id,code,name,status,max_executions_per_hour) values
('21300000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','DEMO-TASK-OVERDUE','Registrar vencimientos de tareas','draft',10)
on conflict(id) do nothing;
insert into public.automation_rule_versions(id,organization_id,automation_rule_id,version_number,event_type,conditions,action,status) values
('21400000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','21300000-0000-4000-8000-000000000001',1,'task.overdue','{"operator":"always","event_type":"task.overdue"}'::jsonb,'{"type":"record_only"}'::jsonb,'draft')
on conflict(id) do nothing;
insert into public.import_jobs(id,organization_id,import_type,file_name,content_hash,mode,status,idempotency_key,mapping,summary,target_entity_type,mapping_hash)
values('21500000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','workforce_csv','trabajadores-demo.csv','demo-content-hash-v1','preview','preview_ready','21500000-0000-4000-8000-000000000099','{"employee_code":"Código","first_name":"Nombres","last_name":"Apellidos"}'::jsonb,'{"rows":4,"valid":4,"demo":true}'::jsonb,'worker','demo-mapping-hash-v1')
on conflict(id) do nothing;
insert into public.copilot_conversations(id,organization_id,actor_user_id,title)
select '21600000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',id,'Recorrido inicial de la empresa demo'
from auth.users where lower(email)='kevinreinosor@gmail.com' and email_confirmed_at is not null
on conflict(id) do nothing;
-- billing_plans is global and has no organization_id. Its inherited generic
-- audit trigger incorrectly treats the plan id as a tenant FK. Suspend only that
-- trigger inside this transaction; subscription changes remain tenant-audited.
alter table public.billing_plans disable trigger billing_plans_audit;
insert into public.billing_plans(id,code,name,status,limits,feature_flags) values
('21700000-0000-4000-8000-000000000001','DEMO','Plan demostración','active','{"members":10,"sites":3,"storage_mb":500}'::jsonb,'{"copilot":true,"automations":true}'::jsonb)
on conflict(code) do nothing;
alter table public.billing_plans enable trigger billing_plans_audit;
insert into public.billing_subscriptions(id,organization_id,billing_plan_id,status,trial_ends_at,current_period_start,current_period_end)
select '21800000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',id,'trialing','2026-10-03 23:59:59+00','2026-09-03 00:00:00+00','2026-10-03 23:59:59+00'
from public.billing_plans where code='DEMO' on conflict(organization_id) do nothing;

create or replace function public.reset_demo_organization() returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_saas_admin(false) then raise exception 'saas administration access required' using errcode='42501'; end if;
 if not exists(select 1 from public.organizations where id='10000000-0000-4000-8000-000000000001' and coalesce(settings->>'is_demo','false')='true') then raise exception 'demo tenant not found' using errcode='P0002'; end if;
 update public.organizations set status='active',settings=settings || jsonb_build_object('is_demo',true,'demo_notice','Datos ficticios reiniciados el ' || now()::text) where id='10000000-0000-4000-8000-000000000001';
 update public.improvement_findings set status='open' where id='16000000-0000-4000-8000-000000000001';
 update public.improvement_gaps set status='in_progress',resolved_at=null,resolved_by=null where id='16100000-0000-4000-8000-000000000001';
 update public.improvement_actions set status='in_progress',evidence_document_version_id=null,validation_note=null,validated_at=null,validated_by=null where id='16200000-0000-4000-8000-000000000001';
 update public.tasks set status=case id when '17200000-0000-4000-8000-000000000001'::uuid then 'in_progress' else 'todo' end,completed_at=null,completed_by=null where id in ('17200000-0000-4000-8000-000000000001','17200000-0000-4000-8000-000000000002');
 update public.incidents set status='under_investigation',closed_at=null,closed_by=null where id='1c000000-0000-4000-8000-000000000001';
 update public.incident_actions set status='in_progress' where id='1c400000-0000-4000-8000-000000000001';
 update public.emergency_actions set status='open',verified_at=null,verified_by=null where id='1e600000-0000-4000-8000-000000000001';
 update public.automation_rules set status='draft' where id='21300000-0000-4000-8000-000000000001';
 insert into public.saas_admin_audit(actor_user_id,action,entity_type,entity_id,after_data) values(auth.uid(),'demo.reset','organization','10000000-0000-4000-8000-000000000001',jsonb_build_object('scope','demo tenant only'));
end; $$;
revoke all on function public.reset_demo_organization() from public,anon; grant execute on function public.reset_demo_organization() to authenticated;
notify pgrst,'reload schema';
