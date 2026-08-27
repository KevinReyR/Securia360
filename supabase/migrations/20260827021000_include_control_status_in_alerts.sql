-- A control already marked ineffective must be visible as an alert even before a follow-up verification exists.
create or replace function private.refresh_risk_control_alerts(
  p_risk_control_id uuid,
  p_as_of date default current_date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  control_row public.risk_controls%rowtype;
  alert_kind text;
  should_be_open boolean;
begin
  select * into control_row from public.risk_controls where id = p_risk_control_id;
  if not found then return; end if;

  foreach alert_kind in array array['overdue', 'ineffective'] loop
    should_be_open := case alert_kind
      when 'overdue' then control_row.target_date is not null
        and control_row.target_date < p_as_of
        and control_row.status not in ('retired')
      else control_row.status = 'ineffective'
        or control_row.effectiveness = 'ineffective'
        or control_row.verification_status = 'ineffective'
    end;

    if should_be_open then
      insert into public.risk_control_alerts (organization_id, risk_control_id, alert_type, detected_at, resolved_at)
      values (control_row.organization_id, control_row.id, alert_kind, now(), null)
      on conflict (risk_control_id, alert_type) do update
        set detected_at = case when public.risk_control_alerts.resolved_at is null then public.risk_control_alerts.detected_at else excluded.detected_at end,
            resolved_at = null,
            updated_at = now();
    else
      update public.risk_control_alerts
      set resolved_at = coalesce(resolved_at, now()), updated_at = now()
      where risk_control_id = control_row.id and alert_type = alert_kind and resolved_at is null;
    end if;
  end loop;
end;
$$;

revoke all on function private.refresh_risk_control_alerts(uuid, date) from public, anon, authenticated, service_role;
