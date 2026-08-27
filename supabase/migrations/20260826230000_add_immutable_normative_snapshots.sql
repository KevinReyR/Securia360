create table public.organization_standard_snapshots (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 snapshot_type text not null check(snapshot_type in ('CURRENT_STATE','MONTHLY_SNAPSHOT','MANUAL_SNAPSHOT','CLASSIFICATION_CHANGE_SNAPSHOT')),
 snapshot_date date not null default current_date, classification_id uuid references public.organization_classifications(id) on delete restrict,
 standard_profile_version_id uuid references public.standard_profile_versions(id) on delete restrict,
 rules_snapshot jsonb not null default '[]'::jsonb check(jsonb_typeof(rules_snapshot)='array'), source_snapshot jsonb not null default '{}'::jsonb check(jsonb_typeof(source_snapshot)='object'),
 reason text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
 check((snapshot_type <> 'MANUAL_SNAPSHOT') or reason is not null and length(btrim(reason)) >= 3),
 check((snapshot_type <> 'CLASSIFICATION_CHANGE_SNAPSHOT') or classification_id is not null),
 check((snapshot_type <> 'MONTHLY_SNAPSHOT') or snapshot_date = date_trunc('month',snapshot_date)::date)
);
create unique index organization_monthly_snapshot_key on public.organization_standard_snapshots(organization_id,snapshot_date) where snapshot_type='MONTHLY_SNAPSHOT';
create index organization_snapshots_history_idx on public.organization_standard_snapshots(organization_id,snapshot_date desc,created_at desc);
create table public.organization_standard_snapshot_items (
 id uuid primary key default gen_random_uuid(), snapshot_id uuid not null references public.organization_standard_snapshots(id) on delete restrict,
 requirement_id uuid references public.requirements(id) on delete restrict, minimum_standard_id uuid references public.minimum_standards(id) on delete restrict,
 organization_requirement_id uuid references public.organization_requirements(id) on delete restrict,
 item_type text not null check(item_type in ('REQUIREMENT','MINIMUM_STANDARD')),
 item_code text not null, applicability_result text check(applicability_result in ('applicable','not_applicable','review_required')),
 item_snapshot jsonb not null check(jsonb_typeof(item_snapshot)='object'), created_at timestamptz not null default now(),
 check((item_type='REQUIREMENT' and requirement_id is not null and minimum_standard_id is null) or (item_type='MINIMUM_STANDARD' and minimum_standard_id is not null and requirement_id is null)), unique(snapshot_id,item_type,item_code)
);
create index snapshot_items_snapshot_idx on public.organization_standard_snapshot_items(snapshot_id);
insert into public.permissions(code,module,action,description) values ('snapshots.read','snapshots','read','Consultar snapshots normativos.'),('snapshots.create','snapshots','create','Crear snapshots normativos.') on conflict(code) do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.code like 'snapshots.%' where r.code='organization_admin' and r.organization_id is null on conflict do nothing;
alter table public.organization_standard_snapshots enable row level security; alter table public.organization_standard_snapshot_items enable row level security;
grant select,insert on public.organization_standard_snapshots,public.organization_standard_snapshot_items to authenticated;
create policy snapshots_read on public.organization_standard_snapshots for select to authenticated using ((select private.has_permission(organization_id,'snapshots.read')));
create policy snapshot_items_read on public.organization_standard_snapshot_items for select to authenticated using (exists(select 1 from public.organization_standard_snapshots s where s.id=snapshot_id and private.has_permission(s.organization_id,'snapshots.read')));
create policy snapshots_insert on public.organization_standard_snapshots for insert to authenticated with check ((select private.has_permission(organization_id,'snapshots.create')));
create policy snapshot_items_insert on public.organization_standard_snapshot_items for insert to authenticated with check (exists(select 1 from public.organization_standard_snapshots s where s.id=snapshot_id and private.has_permission(s.organization_id,'snapshots.create')));
create or replace function private.prevent_snapshot_mutation() returns trigger language plpgsql security definer set search_path='' as $$ begin raise exception 'normative snapshots are immutable' using errcode='55000'; end; $$;
revoke all on function private.prevent_snapshot_mutation() from public,anon,authenticated,service_role;
create trigger snapshots_immutable before update or delete on public.organization_standard_snapshots for each row execute function private.prevent_snapshot_mutation();
create trigger snapshot_items_immutable before update or delete on public.organization_standard_snapshot_items for each row execute function private.prevent_snapshot_mutation();
create trigger snapshots_capture_audit after insert on public.organization_standard_snapshots for each row execute function private.capture_core_audit();
notify pgrst,'reload schema';
