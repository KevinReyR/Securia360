create index if not exists ppe_assignments_catalog_member_active_idx
  on public.ppe_assignments (ppe_catalog_id, organization_member_id)
  where status = 'active';

create policy ppe_catalog_assigned_worker_read
  on public.ppe_catalog
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ppe_assignments assignment
      join public.organization_members member
        on member.id = assignment.organization_member_id
       and member.organization_id = assignment.organization_id
      where assignment.ppe_catalog_id = ppe_catalog.id
        and assignment.organization_id = ppe_catalog.organization_id
        and assignment.status = 'active'
        and member.status = 'active'
        and member.user_id = (select auth.uid())
    )
  );

comment on policy ppe_catalog_assigned_worker_read on public.ppe_catalog is
  'Allows active workers to read only catalog items referenced by their own active PPE assignments.';

notify pgrst, 'reload schema';
