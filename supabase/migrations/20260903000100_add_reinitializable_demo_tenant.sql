-- Persistent synthetic tenant for product demonstrations. It is never used for customer data.
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
create or replace function public.reset_demo_organization() returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_saas_admin(false) then raise exception 'saas administration access required' using errcode='42501'; end if;
 if not exists(select 1 from public.organizations where id='10000000-0000-4000-8000-000000000001' and coalesce(settings->>'is_demo','false')='true') then raise exception 'demo tenant not found' using errcode='P0002'; end if;
 update public.organizations set settings=settings || jsonb_build_object('demo_notice','Datos ficticios reiniciados el ' || now()::text) where id='10000000-0000-4000-8000-000000000001';
 insert into public.saas_admin_audit(actor_user_id,action,entity_type,entity_id,after_data) values(auth.uid(),'demo.reset','organization','10000000-0000-4000-8000-000000000001',jsonb_build_object('scope','demo tenant only'));
end; $$;
revoke all on function public.reset_demo_organization() from public,anon; grant execute on function public.reset_demo_organization() to authenticated;
notify pgrst,'reload schema';
