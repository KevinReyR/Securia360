-- Local-only deterministic demo data. No production user is created here.

insert into public.organizations (
  id, name, slug, nit, country_code, timezone, status
) values (
  '10000000-0000-4000-8000-000000000001',
  'Empresa Demo Colombia SAS',
  'empresa-demo-colombia',
  '900000000-1',
  'CO',
  'America/Bogota',
  'active'
) on conflict (id) do nothing;

insert into public.legal_entities (
  id, organization_id, legal_name, trade_name, tax_id, ciiu_code,
  economic_activity, risk_class, employee_count
) values (
  '11000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Empresa Demo Colombia SAS',
  'Empresa Demo',
  '900000000-1',
  '6201',
  'Desarrollo de sistemas informáticos',
  1,
  48
) on conflict (id) do nothing;

insert into public.sites (
  id, organization_id, legal_entity_id, name, code, address, city, department
) values
  (
    '12000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    'Sede Bogotá', 'BOG', 'Carrera 7 # 00-00', 'Bogotá', 'Bogotá D.C.'
  ),
  (
    '12000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    'Sede Bucaramanga', 'BGA', 'Carrera 33 # 00-00', 'Bucaramanga', 'Santander'
  )
on conflict (id) do nothing;

insert into public.areas (
  id, organization_id, site_id, name, code
) values
  (
    '13000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    'Administración', 'ADM'
  ),
  (
    '13000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    'Operaciones', 'OPS'
  ),
  (
    '13000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000002',
    'Administración', 'ADM'
  )
on conflict (id) do nothing;

insert into public.organization_characteristics (
  organization_id, remote_work, manual_load_handling
) values (
  '10000000-0000-4000-8000-000000000001', true, true
) on conflict (organization_id) do nothing;
