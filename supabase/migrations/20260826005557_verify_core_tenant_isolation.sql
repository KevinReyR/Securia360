-- Deployment assertion: User A can see Organization A but never Organization B.
-- Test fixtures are removed in the same transaction and never become application data.

set local session_replication_role = replica;

insert into public.organizations (id, name, slug)
values
  ('00000000-0000-4000-a000-000000000001', 'RLS Test Organization A', 'rls-test-organization-a'),
  ('00000000-0000-4000-b000-000000000002', 'RLS Test Organization B', 'rls-test-organization-b');

insert into public.organization_members (
  id, organization_id, user_id, status, joined_at
)
values (
  '00000000-0000-4000-a100-000000000001',
  '00000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a200-000000000001',
  'active',
  now()
);

set local session_replication_role = origin;
set local role authenticated;

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-a200-000000000001","role":"authenticated"}',
  true
);

select 1 / case when (
  select count(*) = 1
    and bool_and(id = '00000000-0000-4000-a000-000000000001'::uuid)
  from public.organizations
) then 1 else 0 end as user_a_isolation_assertion;

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-b200-000000000002","role":"authenticated"}',
  true
);

select 1 / case when (
  select count(*) = 0 from public.organizations
) then 1 else 0 end as user_b_isolation_assertion;

reset role;
set local session_replication_role = replica;

delete from public.organization_members
where id = '00000000-0000-4000-a100-000000000001';

delete from public.organizations
where id in (
  '00000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-b000-000000000002'
);

set local session_replication_role = origin;
