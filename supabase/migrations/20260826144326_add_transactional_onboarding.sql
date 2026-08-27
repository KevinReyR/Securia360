-- Resumable and transactional organization onboarding (UTC migration version).

create table public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique
    references public.organizations (id) on delete cascade,
  current_step smallint not null default 1
    constraint onboarding_progress_current_step_check check (current_step between 1 and 9),
  draft_data jsonb not null default '{}'::jsonb
    constraint onboarding_progress_draft_object_check check (jsonb_typeof(draft_data) = 'object'),
  completion_idempotency_key uuid unique,
  completion_result jsonb
    constraint onboarding_progress_result_object_check
    check (completion_result is null or jsonb_typeof(completion_result) = 'object'),
  completed_at timestamptz,
  completed_by uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_progress_completion_state_check check (
    (completed_at is null and completed_by is null and completion_result is null)
    or
    (completed_at is not null and completion_idempotency_key is not null and completion_result is not null)
  )
);

create index onboarding_progress_completed_by_idx
  on public.onboarding_progress (completed_by);
create index onboarding_progress_created_by_idx
  on public.onboarding_progress (created_by);
create index onboarding_progress_updated_by_idx
  on public.onboarding_progress (updated_by);

create table public.domain_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  event_type text not null
    constraint domain_events_type_format_check
    check (event_type ~ '^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$'),
  aggregate_type text not null
    constraint domain_events_aggregate_type_format_check
    check (aggregate_type ~ '^[a-z][a-z0-9_]*$'),
  aggregate_id uuid not null,
  payload jsonb not null default '{}'::jsonb
    constraint domain_events_payload_object_check check (jsonb_typeof(payload) = 'object'),
  idempotency_key uuid not null unique,
  actor_user_id uuid references auth.users (id) on delete set null,
  occurred_at timestamptz not null default now()
);

create index domain_events_organization_occurred_at_idx
  on public.domain_events (organization_id, occurred_at desc);
create index domain_events_actor_user_id_idx
  on public.domain_events (actor_user_id);

create trigger onboarding_progress_set_updated_at
  before update on public.onboarding_progress
  for each row execute function private.set_updated_at();
create trigger onboarding_progress_prevent_organization_change
  before update on public.onboarding_progress
  for each row execute function private.prevent_organization_change();

alter table public.onboarding_progress enable row level security;
alter table public.domain_events enable row level security;

revoke all on public.onboarding_progress, public.domain_events
  from public, anon, authenticated;
grant select on public.onboarding_progress to authenticated;
grant all on public.onboarding_progress, public.domain_events to service_role;

create policy onboarding_progress_select on public.onboarding_progress
  for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create trigger onboarding_progress_capture_audit
  after insert or update on public.onboarding_progress
  for each row execute function private.capture_core_audit();

create or replace function public.save_organization_onboarding_step(
  p_organization_id uuid,
  p_step smallint,
  p_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_section text;
  v_progress public.onboarding_progress%rowtype;
begin
  if v_user_id is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if not private.has_permission(p_organization_id, 'onboarding.manage') then
    raise exception 'insufficient onboarding permission' using errcode = '42501';
  end if;

  if p_step not between 1 and 9 then
    raise exception 'onboarding step must be between 1 and 9' using errcode = '22023';
  end if;

  v_section := (array[
    'organization', 'legal_entity', 'economic_activity', 'ciiu',
    'workforce', 'risk', 'sites', 'responsible', 'characteristics'
  ])[p_step];

  if (p_step = 7 and jsonb_typeof(p_data) <> 'array')
     or (p_step <> 7 and jsonb_typeof(p_data) <> 'object') then
    raise exception 'invalid onboarding step payload' using errcode = '22023';
  end if;

  insert into public.onboarding_progress (
    organization_id, current_step, draft_data, created_by, updated_by
  ) values (
    p_organization_id,
    least(p_step + 1, 9),
    jsonb_build_object(v_section, p_data),
    v_user_id,
    v_user_id
  )
  on conflict (organization_id) do update set
    current_step = greatest(
      public.onboarding_progress.current_step,
      excluded.current_step
    ),
    draft_data = public.onboarding_progress.draft_data || excluded.draft_data,
    updated_by = excluded.updated_by
  where public.onboarding_progress.completed_at is null
  returning * into v_progress;

  if not found then
    raise exception 'onboarding is already completed' using errcode = '23505';
  end if;

  return jsonb_build_object(
    'current_step', v_progress.current_step,
    'draft_data', v_progress.draft_data
  );
end;
$$;

create or replace function public.complete_organization_onboarding(
  p_organization_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_progress public.onboarding_progress%rowtype;
  v_draft jsonb;
  v_organization jsonb;
  v_legal_entity jsonb;
  v_activity jsonb;
  v_ciiu jsonb;
  v_workforce jsonb;
  v_risk jsonb;
  v_responsible jsonb;
  v_characteristics jsonb;
  v_sites jsonb;
  v_site jsonb;
  v_site_id uuid;
  v_legal_entity_id uuid;
  v_responsible_member_id uuid;
  v_sst_role_id uuid;
  v_result jsonb;
  v_site_ids jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'authenticated user required' using errcode = '42501';
  end if;

  if p_idempotency_key is null then
    raise exception 'idempotency key is required' using errcode = '22023';
  end if;

  if not private.has_permission(p_organization_id, 'onboarding.manage') then
    raise exception 'insufficient onboarding permission' using errcode = '42501';
  end if;

  select * into v_progress
  from public.onboarding_progress
  where organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'onboarding draft not found' using errcode = 'P0002';
  end if;

  if v_progress.completed_at is not null then
    return v_progress.completion_result;
  end if;

  v_draft := v_progress.draft_data;
  v_organization := v_draft -> 'organization';
  v_legal_entity := v_draft -> 'legal_entity';
  v_activity := v_draft -> 'economic_activity';
  v_ciiu := v_draft -> 'ciiu';
  v_workforce := v_draft -> 'workforce';
  v_risk := v_draft -> 'risk';
  v_sites := v_draft -> 'sites';
  v_responsible := v_draft -> 'responsible';
  v_characteristics := v_draft -> 'characteristics';

  if jsonb_typeof(v_organization) <> 'object'
     or jsonb_typeof(v_legal_entity) <> 'object'
     or jsonb_typeof(v_activity) <> 'object'
     or jsonb_typeof(v_ciiu) <> 'object'
     or jsonb_typeof(v_workforce) <> 'object'
     or jsonb_typeof(v_risk) <> 'object'
     or jsonb_typeof(v_sites) <> 'array'
     or jsonb_array_length(v_sites) < 1
     or jsonb_array_length(v_sites) > 50
     or jsonb_typeof(v_responsible) <> 'object'
     or jsonb_typeof(v_characteristics) <> 'object' then
    raise exception 'onboarding draft is incomplete' using errcode = '22023';
  end if;

  if nullif(btrim(v_organization ->> 'name'), '') is null
     or nullif(btrim(v_organization ->> 'nit'), '') is null
     or nullif(btrim(v_legal_entity ->> 'legal_name'), '') is null
     or nullif(btrim(v_legal_entity ->> 'tax_id'), '') is null
     or nullif(btrim(v_activity ->> 'economic_activity'), '') is null
     or nullif(btrim(v_ciiu ->> 'ciiu_code'), '') is null
     or btrim(v_ciiu ->> 'ciiu_code') !~ '^\d{4}$'
     or length(btrim(v_organization ->> 'name')) > 160
     or length(btrim(v_organization ->> 'nit')) > 40
     or length(btrim(v_legal_entity ->> 'legal_name')) > 180
     or length(btrim(v_legal_entity ->> 'tax_id')) > 40
     or length(btrim(v_activity ->> 'economic_activity')) > 200
     or (v_workforce ->> 'employee_count')::integer < 0
     or (v_workforce ->> 'employee_count')::integer > 10000000
     or (v_risk ->> 'risk_class')::smallint not between 1 and 5 then
    raise exception 'onboarding source data is invalid' using errcode = '22023';
  end if;

  if (
    select count(*) <> count(distinct upper(btrim(value ->> 'code')))
    from jsonb_array_elements(v_sites)
  ) then
    raise exception 'site codes must be unique' using errcode = '23505';
  end if;

  v_responsible_member_id := (v_responsible ->> 'member_id')::uuid;
  if not exists (
    select 1 from public.organization_members om
    where om.id = v_responsible_member_id
      and om.organization_id = p_organization_id
      and om.status = 'active'
  ) then
    raise exception 'SST responsible must be an active organization member'
      using errcode = '23503';
  end if;

  update public.organizations
  set name = btrim(v_organization ->> 'name'),
      nit = btrim(v_organization ->> 'nit'),
      updated_by = v_user_id
  where id = p_organization_id;

  insert into public.legal_entities (
    organization_id, legal_name, trade_name, tax_id, ciiu_code,
    economic_activity, employee_count, risk_class, created_by, updated_by
  ) values (
    p_organization_id,
    btrim(v_legal_entity ->> 'legal_name'),
    nullif(btrim(v_legal_entity ->> 'trade_name'), ''),
    btrim(v_legal_entity ->> 'tax_id'),
    btrim(v_ciiu ->> 'ciiu_code'),
    btrim(v_activity ->> 'economic_activity'),
    (v_workforce ->> 'employee_count')::integer,
    (v_risk ->> 'risk_class')::smallint,
    v_user_id,
    v_user_id
  )
  on conflict (organization_id, tax_id) do update set
    legal_name = excluded.legal_name,
    trade_name = excluded.trade_name,
    ciiu_code = excluded.ciiu_code,
    economic_activity = excluded.economic_activity,
    employee_count = excluded.employee_count,
    risk_class = excluded.risk_class,
    updated_by = excluded.updated_by
  returning id into v_legal_entity_id;

  for v_site in select value from jsonb_array_elements(v_sites)
  loop
    if nullif(btrim(v_site ->> 'name'), '') is null
       or nullif(btrim(v_site ->> 'code'), '') is null
       or length(btrim(v_site ->> 'name')) > 140
       or length(btrim(v_site ->> 'code')) > 30 then
      raise exception 'site name and code are required' using errcode = '22023';
    end if;

    insert into public.sites (
      organization_id, legal_entity_id, name, code, address, city,
      department, risk_class, created_by, updated_by
    ) values (
      p_organization_id,
      v_legal_entity_id,
      btrim(v_site ->> 'name'),
      upper(btrim(v_site ->> 'code')),
      nullif(btrim(v_site ->> 'address'), ''),
      nullif(btrim(v_site ->> 'city'), ''),
      nullif(btrim(v_site ->> 'department'), ''),
      (v_risk ->> 'risk_class')::smallint,
      v_user_id,
      v_user_id
    )
    on conflict (organization_id, code) do update set
      legal_entity_id = excluded.legal_entity_id,
      name = excluded.name,
      address = excluded.address,
      city = excluded.city,
      department = excluded.department,
      risk_class = excluded.risk_class,
      updated_by = excluded.updated_by
    returning id into strict v_site_id;

    v_site_ids := v_site_ids || jsonb_build_array(v_site_id);
  end loop;

  v_responsible_member_id := (v_responsible ->> 'member_id')::uuid;

  insert into public.organization_characteristics (
    organization_id, work_at_height, confined_spaces, chemical_exposure,
    electrical_work, transport_operations, heavy_machinery, night_work,
    remote_work, manual_load_handling, created_by, updated_by
  ) values (
    p_organization_id,
    coalesce((v_characteristics ->> 'work_at_height')::boolean, false),
    coalesce((v_characteristics ->> 'confined_spaces')::boolean, false),
    coalesce((v_characteristics ->> 'chemical_exposure')::boolean, false),
    coalesce((v_characteristics ->> 'electrical_work')::boolean, false),
    coalesce((v_characteristics ->> 'transport_operations')::boolean, false),
    coalesce((v_characteristics ->> 'heavy_machinery')::boolean, false),
    coalesce((v_characteristics ->> 'night_work')::boolean, false),
    coalesce((v_characteristics ->> 'remote_work')::boolean, false),
    coalesce((v_characteristics ->> 'manual_load_handling')::boolean, false),
    v_user_id,
    v_user_id
  )
  on conflict (organization_id) do update set
    work_at_height = excluded.work_at_height,
    confined_spaces = excluded.confined_spaces,
    chemical_exposure = excluded.chemical_exposure,
    electrical_work = excluded.electrical_work,
    transport_operations = excluded.transport_operations,
    heavy_machinery = excluded.heavy_machinery,
    night_work = excluded.night_work,
    remote_work = excluded.remote_work,
    manual_load_handling = excluded.manual_load_handling,
    updated_by = excluded.updated_by;

  select id into v_sst_role_id
  from public.roles
  where organization_id is null and code = 'sst_manager';

  if v_sst_role_id is null then
    raise exception 'sst_manager system role is not configured';
  end if;

  insert into public.member_roles (
    organization_id, organization_member_id, role_id, created_by
  ) values (
    p_organization_id, v_responsible_member_id, v_sst_role_id, v_user_id
  )
  on conflict on constraint member_roles_assignment_key do nothing;

  v_result := jsonb_build_object(
    'organization_id', p_organization_id,
    'legal_entity_id', v_legal_entity_id,
    'site_ids', v_site_ids,
    'responsible_member_id', v_responsible_member_id,
    'completed_at', now()
  );

  insert into public.domain_events (
    organization_id, event_type, aggregate_type, aggregate_id,
    payload, idempotency_key, actor_user_id
  ) values (
    p_organization_id,
    'organization.classification_source_changed',
    'organization',
    p_organization_id,
    jsonb_build_object(
      'employee_count', (v_workforce ->> 'employee_count')::integer,
      'risk_class', (v_risk ->> 'risk_class')::smallint,
      'ciiu_code', btrim(v_ciiu ->> 'ciiu_code'),
      'economic_activity', btrim(v_activity ->> 'economic_activity'),
      'reason', 'onboarding_completed',
      'requires_human_review', true
    ),
    p_idempotency_key,
    v_user_id
  );

  update public.onboarding_progress
  set current_step = 9,
      completion_idempotency_key = p_idempotency_key,
      completion_result = v_result,
      completed_at = now(),
      completed_by = v_user_id,
      updated_by = v_user_id
  where organization_id = p_organization_id;

  return v_result;
end;
$$;

revoke all on function public.complete_organization_onboarding(uuid, uuid)
  from public, anon;
revoke all on function public.save_organization_onboarding_step(uuid, smallint, jsonb)
  from public, anon;
grant execute on function public.complete_organization_onboarding(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.save_organization_onboarding_step(uuid, smallint, jsonb)
  to authenticated, service_role;

comment on table public.onboarding_progress is
  'Borrador reanudable del onboarding empresarial, aislado por organización.';
comment on table public.domain_events is
  'Eventos de dominio internos; el evento de onboarding prepara el clasificador futuro.';
comment on function public.complete_organization_onboarding(uuid, uuid) is
  'Finaliza el onboarding de forma atómica, idempotente y autorizada por tenant.';
comment on function public.save_organization_onboarding_step(uuid, smallint, jsonb) is
  'Guarda de forma atómica una sección validada del borrador de onboarding.';

notify pgrst, 'reload schema';
