-- Evaluate date-driven control alerts daily at 00:05 America/Bogota (05:05 UTC).
create extension if not exists pg_cron;

create or replace function private.evaluate_risk_control_alerts(p_as_of date default current_date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  control_row record;
  evaluated_count integer := 0;
begin
  for control_row in select id from public.risk_controls loop
    perform private.refresh_risk_control_alerts(control_row.id, p_as_of);
    evaluated_count := evaluated_count + 1;
  end loop;
  return evaluated_count;
end;
$$;

revoke all on function private.evaluate_risk_control_alerts(date) from public, anon, authenticated, service_role;

select cron.schedule(
  'securia360-evaluate-risk-control-alerts',
  '5 5 * * *',
  $$select private.evaluate_risk_control_alerts(current_date);$$
);
