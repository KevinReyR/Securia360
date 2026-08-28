-- EPP workflow hardening: all stock changes and lifecycle events use audited RPCs.
create table public.ppe_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  inventory_id uuid not null references public.ppe_inventory(id) on delete restrict,
  delivery_id uuid references public.ppe_deliveries(id) on delete restrict,
  movement_type text not null check (movement_type in ('purchase','adjustment','return','delivery')),
  quantity_delta integer not null check (quantity_delta <> 0),
  note text,
  evidence_document_version_id uuid references public.document_versions(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((movement_type in ('purchase','return') and quantity_delta > 0) or (movement_type = 'delivery' and quantity_delta < 0) or movement_type = 'adjustment')
);

alter table public.ppe_assignments add column replacement_required boolean not null default false,
  add column life_expires_at date,
  add column updated_at timestamptz not null default now();
alter table public.ppe_deliveries add column delivery_kind text not null default 'initial' check (delivery_kind in ('initial','replacement'));
alter table public.ppe_inventory_movements enable row level security;

create index ppe_inventory_movements_inventory_created_idx on public.ppe_inventory_movements(organization_id, inventory_id, created_at desc);
create index ppe_assignments_life_expires_idx on public.ppe_assignments(organization_id, life_expires_at) where status = 'active';
create index ppe_assignments_replacement_idx on public.ppe_assignments(organization_id, replacement_required) where status = 'active';

create or replace function private.validate_ppe_workflow_links()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'ppe_inventory_movements' then
    if not exists (select 1 from public.ppe_inventory i where i.id = new.inventory_id and i.organization_id = new.organization_id) then
      raise exception 'ppe movement inventory belongs to another organization' using errcode = '23514';
    end if;
    if new.delivery_id is not null and not exists (select 1 from public.ppe_deliveries d where d.id = new.delivery_id and d.organization_id = new.organization_id and d.inventory_id = new.inventory_id) then
      raise exception 'ppe movement delivery belongs to another organization' using errcode = '23514';
    end if;
    if new.evidence_document_version_id is not null and not exists (select 1 from public.document_versions v where v.id = new.evidence_document_version_id and v.organization_id = new.organization_id) then
      raise exception 'ppe movement evidence belongs to another organization' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.ppe_record_inventory_movement(
  p_inventory_id uuid, p_movement_type text, p_quantity integer, p_note text default null, p_evidence_document_version_id uuid default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare i public.ppe_inventory%rowtype; movement_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into i from public.ppe_inventory where id = p_inventory_id for update;
  if not found then raise exception 'PPE inventory was not found' using errcode = 'P0002'; end if;
  if not private.has_permission(i.organization_id, 'ppe.manage') then raise exception 'insufficient PPE permission' using errcode = '42501'; end if;
  if p_movement_type not in ('purchase','adjustment','return') or p_quantity = 0 then raise exception 'invalid PPE inventory movement' using errcode = '23514'; end if;
  if p_movement_type in ('purchase','return') and p_quantity < 1 then raise exception 'inventory income must be positive' using errcode = '23514'; end if;
  if i.quantity_on_hand + p_quantity < 0 then raise exception 'insufficient PPE stock' using errcode = '23514'; end if;
  insert into public.ppe_inventory_movements(organization_id, inventory_id, movement_type, quantity_delta, note, evidence_document_version_id, created_by)
  values (i.organization_id, i.id, p_movement_type, p_quantity, nullif(btrim(p_note), ''), p_evidence_document_version_id, (select auth.uid())) returning id into movement_id;
  update public.ppe_inventory set quantity_on_hand = quantity_on_hand + p_quantity, updated_at = now() where id = i.id;
  return movement_id;
end;
$$;

create or replace function private.create_ppe_inventory(p_organization_id uuid, p_site_id uuid, p_ppe_catalog_id uuid, p_size_label text default '', p_reorder_point integer default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare inventory_id uuid;
begin
  if (select auth.uid()) is null or not private.has_permission(p_organization_id, 'ppe.manage') then raise exception 'insufficient PPE permission' using errcode = '42501'; end if;
  if p_reorder_point is not null and p_reorder_point < 0 then raise exception 'invalid PPE reorder point' using errcode = '23514'; end if;
  insert into public.ppe_inventory(organization_id, site_id, ppe_catalog_id, size_label, reorder_point)
  values(p_organization_id, p_site_id, p_ppe_catalog_id, coalesce(p_size_label, ''), p_reorder_point)
  returning id into inventory_id;
  return inventory_id;
end;
$$;

create or replace function private.deliver_ppe(
  p_assignment_id uuid, p_inventory_id uuid, p_quantity integer, p_evidence_document_version_id uuid default null, p_delivery_kind text default 'initial'
) returns uuid language plpgsql security definer set search_path = '' as $$
declare a public.ppe_assignments%rowtype; i public.ppe_inventory%rowtype; useful_days integer; delivery_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into a from public.ppe_assignments where id = p_assignment_id for update;
  select * into i from public.ppe_inventory where id = p_inventory_id for update;
  if not found or a.organization_id <> i.organization_id or a.status <> 'active' or a.ppe_catalog_id <> i.ppe_catalog_id or a.size_label <> i.size_label or p_quantity < 1 or i.quantity_on_hand < p_quantity then
    raise exception 'invalid PPE delivery or insufficient stock' using errcode = '23514';
  end if;
  if p_delivery_kind not in ('initial','replacement') then raise exception 'invalid PPE delivery kind' using errcode = '23514'; end if;
  if not private.has_permission(a.organization_id, 'ppe.validate') then raise exception 'insufficient PPE permission' using errcode = '42501'; end if;
  select useful_life_days into useful_days from public.ppe_catalog where id = a.ppe_catalog_id;
  insert into public.ppe_deliveries(organization_id, ppe_assignment_id, inventory_id, quantity, evidence_document_version_id, created_by, delivery_kind)
  values(a.organization_id, a.id, i.id, p_quantity, p_evidence_document_version_id, (select auth.uid()), p_delivery_kind) returning id into delivery_id;
  insert into public.ppe_inventory_movements(organization_id, inventory_id, delivery_id, movement_type, quantity_delta, created_by)
  values(a.organization_id, i.id, delivery_id, 'delivery', -p_quantity, (select auth.uid()));
  update public.ppe_inventory set quantity_on_hand = quantity_on_hand - p_quantity, updated_at = now() where id = i.id;
  update public.ppe_assignments set replacement_required = false, life_expires_at = case when useful_days is null then null else current_date + useful_days end, updated_at = now() where id = a.id;
  return delivery_id;
end;
$$;

create or replace function private.accept_ppe_delivery(p_delivery_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare d public.ppe_deliveries%rowtype; assignment_member uuid;
begin
  if (select auth.uid()) is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into d from public.ppe_deliveries where id = p_delivery_id for update;
  if not found then raise exception 'PPE delivery was not found' using errcode = 'P0002'; end if;
  select organization_member_id into assignment_member from public.ppe_assignments where id = d.ppe_assignment_id;
  if d.accepted_at is not null then raise exception 'PPE delivery was already accepted' using errcode = '23505'; end if;
  if not exists (select 1 from public.organization_members m where m.id = assignment_member and m.organization_id = d.organization_id and m.user_id = (select auth.uid()) and m.status = 'active') then
    raise exception 'only the assigned worker can accept this PPE delivery' using errcode = '42501';
  end if;
  update public.ppe_deliveries set accepted_at = now(), accepted_by = (select auth.uid()) where id = d.id;
end;
$$;

create or replace function private.inspect_ppe(p_assignment_id uuid, p_status text, p_notes text default null, p_evidence_document_version_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare a public.ppe_assignments%rowtype; inspection_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into a from public.ppe_assignments where id = p_assignment_id for update;
  if not found or a.status <> 'active' then raise exception 'PPE assignment is not active' using errcode = '23514'; end if;
  if p_status not in ('suitable','needs_replacement','failed') then raise exception 'invalid PPE inspection status' using errcode = '23514'; end if;
  if not private.has_permission(a.organization_id, 'ppe.validate') then raise exception 'insufficient PPE permission' using errcode = '42501'; end if;
  insert into public.ppe_inspections(organization_id, ppe_assignment_id, status, notes, inspected_by, evidence_document_version_id)
  values(a.organization_id, a.id, p_status, nullif(btrim(p_notes), ''), (select auth.uid()), p_evidence_document_version_id) returning id into inspection_id;
  if p_status in ('needs_replacement','failed') then update public.ppe_assignments set replacement_required = true, updated_at = now() where id = a.id; end if;
  return inspection_id;
end;
$$;

create or replace function private.retire_ppe(p_assignment_id uuid, p_reason text, p_evidence_document_version_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare a public.ppe_assignments%rowtype; retirement_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into a from public.ppe_assignments where id = p_assignment_id for update;
  if not found or a.status <> 'active' or btrim(p_reason) = '' then raise exception 'invalid PPE retirement' using errcode = '23514'; end if;
  if not private.has_permission(a.organization_id, 'ppe.validate') then raise exception 'insufficient PPE permission' using errcode = '42501'; end if;
  insert into public.ppe_retirements(organization_id, ppe_assignment_id, reason, evidence_document_version_id, retired_by)
  values(a.organization_id, a.id, btrim(p_reason), p_evidence_document_version_id, (select auth.uid())) returning id into retirement_id;
  update public.ppe_assignments set status = 'retired', replacement_required = false, updated_at = now() where id = a.id;
  return retirement_id;
end;
$$;

create or replace function public.create_ppe_inventory(p_organization_id uuid, p_site_id uuid, p_ppe_catalog_id uuid, p_size_label text default '', p_reorder_point integer default null)
returns uuid language sql security invoker set search_path = '' as $$ select private.create_ppe_inventory(p_organization_id, p_site_id, p_ppe_catalog_id, p_size_label, p_reorder_point); $$;
create or replace function public.record_ppe_inventory_movement(p_inventory_id uuid, p_movement_type text, p_quantity integer, p_note text default null, p_evidence_document_version_id uuid default null)
returns uuid language sql security invoker set search_path = '' as $$ select private.ppe_record_inventory_movement(p_inventory_id, p_movement_type, p_quantity, p_note, p_evidence_document_version_id); $$;
create or replace function public.deliver_ppe(p_assignment_id uuid, p_inventory_id uuid, p_quantity integer, p_evidence_document_version_id uuid default null, p_delivery_kind text default 'initial')
returns uuid language sql security invoker set search_path = '' as $$ select private.deliver_ppe(p_assignment_id, p_inventory_id, p_quantity, p_evidence_document_version_id, p_delivery_kind); $$;
create or replace function public.accept_ppe_delivery(p_delivery_id uuid)
returns void language sql security invoker set search_path = '' as $$ select private.accept_ppe_delivery(p_delivery_id); $$;
create or replace function public.inspect_ppe(p_assignment_id uuid, p_status text, p_notes text default null, p_evidence_document_version_id uuid default null)
returns uuid language sql security invoker set search_path = '' as $$ select private.inspect_ppe(p_assignment_id, p_status, p_notes, p_evidence_document_version_id); $$;
create or replace function public.retire_ppe(p_assignment_id uuid, p_reason text, p_evidence_document_version_id uuid default null)
returns uuid language sql security invoker set search_path = '' as $$ select private.retire_ppe(p_assignment_id, p_reason, p_evidence_document_version_id); $$;

revoke all on function private.validate_ppe_workflow_links(), private.create_ppe_inventory(uuid,uuid,uuid,text,integer), private.ppe_record_inventory_movement(uuid,text,integer,text,uuid), private.deliver_ppe(uuid,uuid,integer,uuid,text), private.accept_ppe_delivery(uuid), private.inspect_ppe(uuid,text,text,uuid), private.retire_ppe(uuid,text,uuid) from public, anon, authenticated, service_role;
grant execute on function private.create_ppe_inventory(uuid,uuid,uuid,text,integer), private.ppe_record_inventory_movement(uuid,text,integer,text,uuid), private.deliver_ppe(uuid,uuid,integer,uuid,text), private.accept_ppe_delivery(uuid), private.inspect_ppe(uuid,text,text,uuid), private.retire_ppe(uuid,text,uuid) to authenticated;
revoke all on function public.create_ppe_inventory(uuid,uuid,uuid,text,integer), public.record_ppe_inventory_movement(uuid,text,integer,text,uuid), public.deliver_ppe(uuid,uuid,integer,uuid,text), public.accept_ppe_delivery(uuid), public.inspect_ppe(uuid,text,text,uuid), public.retire_ppe(uuid,text,uuid) from public, anon;
grant execute on function public.create_ppe_inventory(uuid,uuid,uuid,text,integer), public.record_ppe_inventory_movement(uuid,text,integer,text,uuid), public.deliver_ppe(uuid,uuid,integer,uuid,text), public.accept_ppe_delivery(uuid), public.inspect_ppe(uuid,text,text,uuid), public.retire_ppe(uuid,text,uuid) to authenticated;

revoke insert, update, delete on public.ppe_inventory, public.ppe_deliveries, public.ppe_inspections, public.ppe_retirements from authenticated;
revoke update, delete on public.ppe_assignments from authenticated;
grant select on public.ppe_inventory_movements to authenticated;
drop policy if exists ppe_inventory_write on public.ppe_inventory;
drop policy if exists ppe_deliveries_insert on public.ppe_deliveries;
drop policy if exists ppe_inspections_insert on public.ppe_inspections;
drop policy if exists ppe_retirements_insert on public.ppe_retirements;
drop policy if exists ppe_assignments_write on public.ppe_assignments;
create policy ppe_inventory_movements_read on public.ppe_inventory_movements for select to authenticated using ((select private.has_permission(organization_id,'ppe.read')));
create policy ppe_assignments_create on public.ppe_assignments for insert to authenticated with check ((select private.has_permission(organization_id,'ppe.manage')) and status = 'active');
create policy ppe_assignments_worker_read on public.ppe_assignments for select to authenticated using (exists (select 1 from public.organization_members m where m.id = organization_member_id and m.user_id = (select auth.uid()) and m.status = 'active'));
create policy ppe_deliveries_worker_read on public.ppe_deliveries for select to authenticated using (exists (select 1 from public.ppe_assignments a join public.organization_members m on m.id = a.organization_member_id where a.id = ppe_assignment_id and m.user_id = (select auth.uid()) and m.status = 'active'));

create trigger ppe_inventory_movements_links before insert on public.ppe_inventory_movements for each row execute function private.validate_ppe_workflow_links();
create trigger ppe_inventory_movements_audit after insert on public.ppe_inventory_movements for each row execute function private.capture_core_audit();
create trigger ppe_assignments_updated before update on public.ppe_assignments for each row execute function private.set_updated_at();
notify pgrst, 'reload schema';
