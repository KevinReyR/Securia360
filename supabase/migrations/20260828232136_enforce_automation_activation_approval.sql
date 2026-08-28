create or replace function private.validate_automation_row()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'automation_rule_versions' then
    perform private.validate_automation_definition(new.conditions, new.action);
    if tg_op = 'UPDATE' and old.status in ('approved','archived') then raise exception 'approved or archived automation versions are immutable' using errcode='23514'; end if;
    if new.status = 'approved' and not private.has_permission(new.organization_id,'automations.approve') then raise exception 'automation approval permission is required' using errcode='42501'; end if;
    if new.status = 'approved' then new.approved_at := now(); new.approved_by := (select auth.uid()); end if;
  elsif tg_table_name = 'automation_rules' then
    if tg_op = 'UPDATE' and new.organization_id <> old.organization_id then raise exception 'automation organization is immutable' using errcode='23514'; end if;
    if new.status = 'active' and old.status <> 'active' then
      if not private.has_permission(new.organization_id,'automations.approve') then raise exception 'automation activation approval permission is required' using errcode='42501'; end if;
      if not exists (select 1 from public.automation_rule_versions where automation_rule_id=new.id and organization_id=new.organization_id and status='approved') then raise exception 'an approved automation version is required before activation' using errcode='23514'; end if;
      new.activated_at := now();
    end if;
    if new.status = 'emergency_stopped' and old.status <> 'emergency_stopped' then
      if not private.has_permission(new.organization_id,'automations.approve') then raise exception 'emergency stop approval permission is required' using errcode='42501'; end if;
      new.emergency_stopped_at := now(); new.emergency_stopped_by := (select auth.uid());
    end if;
  end if;
  return new;
end; $$;
revoke all on function private.validate_automation_row() from public, anon, authenticated, service_role;
notify pgrst, 'reload schema';
