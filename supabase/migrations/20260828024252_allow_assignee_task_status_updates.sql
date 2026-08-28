-- An assignee may update only the task status assigned to them. Planning
-- managers retain full task management; all cross-tenant enforcement remains
-- in private.has_permission and the existing task triggers.
drop policy if exists tasks_write on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
with check ((select private.has_permission(organization_id, 'planning.manage')));
create policy tasks_update on public.tasks for update to authenticated
using (
  (select private.has_permission(organization_id, 'planning.manage'))
  or (
    assigned_to = (select auth.uid())
    and (select private.has_permission(organization_id, 'tasks.update_status'))
  )
)
with check (
  (select private.has_permission(organization_id, 'planning.manage'))
  or (
    assigned_to = (select auth.uid())
    and (select private.has_permission(organization_id, 'tasks.update_status'))
  )
);
