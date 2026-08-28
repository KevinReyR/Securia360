-- Indicadores: cálculos reproducibles de servidor, resultados históricos y dashboard seguro.
-- Las tres plantillas iniciales son deliberadamente cerradas: no se ejecuta SQL ni fórmulas de usuario.

alter table public.indicator_calculation_runs
  add column if not exists formula_snapshot text not null default '',
  add column if not exists source_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(source_snapshot) = 'object'),
  add column if not exists target_value_snapshot numeric,
  add column if not exists target_direction_snapshot text not null default 'at_least' check (target_direction_snapshot in ('at_least','at_most','exact')),
  add column if not exists requested_by uuid references auth.users(id) on delete set null,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists failure_reason text check (failure_reason is null or length(failure_reason) <= 500);

alter table public.indicator_results
  add column if not exists legal_entity_id uuid references public.legal_entities(id) on delete restrict,
  add column if not exists site_id uuid references public.sites(id) on delete restrict,
  add column if not exists formula_snapshot text not null default '',
  add column if not exists source_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(source_snapshot) = 'object'),
  add column if not exists target_direction_snapshot text not null default 'at_least' check (target_direction_snapshot in ('at_least','at_most','exact'));

create index if not exists indicator_runs_version_period_idx
  on public.indicator_calculation_runs(indicator_version_id, period_start, period_end, status);
create index if not exists indicator_results_org_scope_period_idx
  on public.indicator_results(organization_id, legal_entity_id, site_id, period_start desc, period_end desc);
create index if not exists indicator_results_version_period_idx
  on public.indicator_results(indicator_version_id, period_start desc, period_end desc);

create or replace function private.validate_indicator_links()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_site_legal_entity uuid;
begin
  if tg_table_name = 'indicator_versions' then
    select organization_id into v_org from public.indicator_catalog where id = new.indicator_id;
    if v_org is null or v_org <> new.organization_id then
      raise exception 'indicator version belongs to another organization' using errcode = '23514';
    end if;
    if coalesce(new.source_config->>'template', '') not in ('open_tasks_count', 'open_improvement_actions_count', 'active_documents_count') then
      raise exception 'indicator source template is not supported' using errcode = '22023';
    end if;
  elsif tg_table_name = 'indicator_calculation_runs' then
    select organization_id into v_org from public.indicator_versions where id = new.indicator_version_id;
    if v_org is null or v_org <> new.organization_id then
      raise exception 'indicator calculation run belongs to another organization' using errcode = '23514';
    end if;
  elsif tg_table_name = 'indicator_results' then
    if not exists (
      select 1 from public.indicator_calculation_runs r
      where r.id = new.calculation_run_id
        and r.organization_id = new.organization_id
        and r.indicator_version_id = new.indicator_version_id
        and r.period_start = new.period_start
        and r.period_end = new.period_end
    ) then
      raise exception 'indicator result does not match its calculation run' using errcode = '23514';
    end if;
    if new.legal_entity_id is not null and not exists (
      select 1 from public.legal_entities le where le.id = new.legal_entity_id and le.organization_id = new.organization_id
    ) then
      raise exception 'indicator legal entity belongs to another organization' using errcode = '23514';
    end if;
    if new.site_id is not null then
      select legal_entity_id into v_site_legal_entity from public.sites where id = new.site_id and organization_id = new.organization_id;
      if v_site_legal_entity is null then
        raise exception 'indicator site belongs to another organization' using errcode = '23514';
      end if;
      if new.legal_entity_id is not null and v_site_legal_entity <> new.legal_entity_id then
        raise exception 'indicator site does not belong to its legal entity' using errcode = '23514';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.lock_indicator_versions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.status = 'approved' then
    if (select auth.uid()) is null or not private.has_permission(new.organization_id, 'analytics.approve') then
      raise exception 'analytics approval permission is required' using errcode = '42501';
    end if;
    new.approved_by := (select auth.uid());
    new.approved_at := now();
  elsif tg_op = 'UPDATE' then
    if old.status in ('approved', 'archived') then
      raise exception 'approved or archived indicator versions are immutable' using errcode = '23514';
    end if;
    if new.status = 'approved' then
      if (select auth.uid()) is null or not private.has_permission(new.organization_id, 'analytics.approve') then
        raise exception 'analytics approval permission is required' using errcode = '42501';
      end if;
      new.approved_by := (select auth.uid());
      new.approved_at := now();
    elsif new.status = 'archived' and not private.has_permission(new.organization_id, 'analytics.manage') then
      raise exception 'analytics management permission is required' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.calculate_indicator(
  p_indicator_version_id uuid,
  p_period_start date,
  p_period_end date,
  p_requested_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.indicator_versions%rowtype;
  v_catalog public.indicator_catalog%rowtype;
  v_run_id uuid;
  v_key uuid;
  v_value numeric;
  v_template text;
begin
  if p_period_end < p_period_start then
    raise exception 'indicator period is invalid' using errcode = '22023';
  end if;
  select * into v_version from public.indicator_versions where id = p_indicator_version_id for update;
  if not found or v_version.status <> 'approved' then
    raise exception 'indicator version must be approved' using errcode = '23514';
  end if;
  select * into v_catalog from public.indicator_catalog where id = v_version.indicator_id;
  if not found or v_catalog.status <> 'active' then
    raise exception 'indicator catalog is not active' using errcode = '23514';
  end if;
  if p_period_end < v_version.effective_from or (v_version.effective_to is not null and p_period_start > v_version.effective_to) then
    raise exception 'indicator version is not effective for this period' using errcode = '23514';
  end if;
  v_key := (substr(md5(concat_ws(':', 'securia360-indicator', v_version.id::text, p_period_start::text, p_period_end::text)), 1, 8) || '-' || substr(md5(concat_ws(':', 'securia360-indicator', v_version.id::text, p_period_start::text, p_period_end::text)), 9, 4) || '-' || substr(md5(concat_ws(':', 'securia360-indicator', v_version.id::text, p_period_start::text, p_period_end::text)), 13, 4) || '-' || substr(md5(concat_ws(':', 'securia360-indicator', v_version.id::text, p_period_start::text, p_period_end::text)), 17, 4) || '-' || substr(md5(concat_ws(':', 'securia360-indicator', v_version.id::text, p_period_start::text, p_period_end::text)), 21, 12))::uuid;
  select id into v_run_id from public.indicator_calculation_runs where idempotency_key = v_key;
  if v_run_id is not null then
    return v_run_id;
  end if;
  insert into public.indicator_calculation_runs(
    organization_id, indicator_version_id, period_start, period_end, idempotency_key, status,
    formula_snapshot, source_snapshot, target_value_snapshot, target_direction_snapshot, requested_by, started_at
  ) values (
    v_version.organization_id, v_version.id, p_period_start, p_period_end, v_key, 'running',
    v_version.formula_description, v_version.source_config, v_version.target_value, v_version.target_direction, p_requested_by, now()
  ) on conflict (idempotency_key) do nothing returning id into v_run_id;
  if v_run_id is null then
    select id into v_run_id from public.indicator_calculation_runs where idempotency_key = v_key;
    return v_run_id;
  end if;
  v_template := v_version.source_config->>'template';
  if v_template = 'open_tasks_count' then
    select count(*)::numeric into v_value from public.tasks where organization_id = v_version.organization_id and status not in ('completed', 'cancelled');
  elsif v_template = 'open_improvement_actions_count' then
    select count(*)::numeric into v_value from public.improvement_actions where organization_id = v_version.organization_id and status not in ('verified', 'cancelled');
  elsif v_template = 'active_documents_count' then
    select count(*)::numeric into v_value from public.documents where organization_id = v_version.organization_id and status = 'active';
  else
    update public.indicator_calculation_runs set status = 'failed', completed_at = now(), failure_reason = 'unsupported source template' where id = v_run_id;
    raise exception 'indicator source template is not supported' using errcode = '22023';
  end if;
  insert into public.indicator_results(
    organization_id, indicator_version_id, calculation_run_id, period_start, period_end, value, target_value,
    dimension_values, explanation, formula_snapshot, source_snapshot, target_direction_snapshot
  ) values (
    v_version.organization_id, v_version.id, v_run_id, p_period_start, p_period_end, v_value, v_version.target_value,
    '{}'::jsonb,
    jsonb_build_object('template', v_template, 'measured_at', now(), 'kind', 'current_state_snapshot', 'unit', 'count'),
    v_version.formula_description, v_version.source_config, v_version.target_direction
  ) on conflict (calculation_run_id, dimension_values) do nothing;
  update public.indicator_calculation_runs set status = 'completed', calculated_at = now(), completed_at = now() where id = v_run_id;
  return v_run_id;
exception when others then
  if v_run_id is not null then
    update public.indicator_calculation_runs set status = 'failed', completed_at = now(), failure_reason = left(sqlerrm, 500) where id = v_run_id;
  end if;
  raise;
end;
$$;

create or replace function public.request_indicator_calculation(
  p_indicator_version_id uuid,
  p_period_start date,
  p_period_end date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.indicator_versions where id = p_indicator_version_id;
  if (select auth.uid()) is null or v_org is null or not private.has_permission(v_org, 'analytics.manage') then
    raise exception 'analytics management permission is required' using errcode = '42501';
  end if;
  return private.calculate_indicator(p_indicator_version_id, p_period_start, p_period_end, (select auth.uid()));
end;
$$;

create or replace function private.run_due_indicator_calculations(p_as_of date default current_date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
  v_start date;
  v_end date;
  v_count integer := 0;
begin
  for v in
    select iv.* from public.indicator_versions iv
    join public.indicator_catalog ic on ic.id = iv.indicator_id
    where iv.status = 'approved' and ic.status = 'active' and iv.effective_from <= p_as_of and (iv.effective_to is null or iv.effective_to >= p_as_of)
  loop
    v_start := null; v_end := null;
    if v.periodicity = 'daily' then
      v_start := p_as_of - 1; v_end := p_as_of - 1;
    elsif v.periodicity = 'weekly' and extract(isodow from p_as_of) = 1 then
      v_start := p_as_of - 7; v_end := p_as_of - 1;
    elsif v.periodicity = 'monthly' and extract(day from p_as_of) = 1 then
      v_start := (date_trunc('month', p_as_of)::date - interval '1 month')::date; v_end := p_as_of - 1;
    elsif v.periodicity = 'quarterly' and extract(day from p_as_of) = 1 and extract(month from p_as_of) in (1,4,7,10) then
      v_start := (date_trunc('quarter', p_as_of)::date - interval '3 months')::date; v_end := p_as_of - 1;
    elsif v.periodicity = 'yearly' and extract(month from p_as_of) = 1 and extract(day from p_as_of) = 1 then
      v_start := make_date(extract(year from p_as_of)::integer - 1, 1, 1); v_end := p_as_of - 1;
    end if;
    if v_start is not null then
      perform private.calculate_indicator(v.id, v_start, v_end, null);
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

revoke all on function private.validate_indicator_links() from public, anon, authenticated, service_role;
revoke all on function private.lock_indicator_versions() from public, anon, authenticated, service_role;
revoke all on function private.calculate_indicator(uuid, date, date, uuid) from public, anon, authenticated, service_role;
revoke all on function private.run_due_indicator_calculations(date) from public, anon, authenticated, service_role;
revoke all on function public.request_indicator_calculation(uuid, date, date) from public, anon;
grant execute on function public.request_indicator_calculation(uuid, date, date) to authenticated;

drop trigger if exists indicator_version_analytics_links on public.indicator_versions;
create trigger indicator_version_analytics_links before insert or update on public.indicator_versions for each row execute function private.validate_indicator_links();
drop trigger if exists indicator_run_analytics_links on public.indicator_calculation_runs;
create trigger indicator_run_analytics_links before insert or update on public.indicator_calculation_runs for each row execute function private.validate_indicator_links();
drop trigger if exists indicator_result_analytics_links on public.indicator_results;
create trigger indicator_result_analytics_links before insert or update on public.indicator_results for each row execute function private.validate_indicator_links();
drop trigger if exists indicator_version_lock on public.indicator_versions;
create trigger indicator_version_lock before insert or update on public.indicator_versions for each row execute function private.lock_indicator_versions();

drop policy if exists indicator_calculation_runs_write on public.indicator_calculation_runs;
drop policy if exists indicator_results_write on public.indicator_results;
revoke insert, update, delete on public.indicator_calculation_runs from authenticated;
revoke insert, update, delete on public.indicator_results from authenticated;

drop trigger if exists indicator_catalog_audit on public.indicator_catalog;
create trigger indicator_catalog_audit after insert or update on public.indicator_catalog for each row execute function private.capture_core_audit();
drop trigger if exists indicator_versions_audit on public.indicator_versions;
create trigger indicator_versions_audit after insert or update on public.indicator_versions for each row execute function private.capture_core_audit();
drop trigger if exists indicator_runs_audit on public.indicator_calculation_runs;
create trigger indicator_runs_audit after insert or update on public.indicator_calculation_runs for each row execute function private.capture_core_audit();
drop trigger if exists indicator_results_audit on public.indicator_results;
create trigger indicator_results_audit after insert on public.indicator_results for each row execute function private.capture_core_audit();

create extension if not exists pg_cron;
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'securia360-calculate-indicators') then
    perform cron.schedule('securia360-calculate-indicators', '15 5 * * *', $cron$select private.run_due_indicator_calculations(current_date);$cron$);
  end if;
end;
$$;

comment on function public.request_indicator_calculation(uuid, date, date) is 'Authorized server-side request for a deterministic analytics snapshot; no client supplied calculation values are accepted.';
comment on function private.run_due_indicator_calculations(date) is 'Daily idempotent close-of-period indicator scheduler at 00:15 America/Bogota (05:15 UTC).';
notify pgrst, 'reload schema';
