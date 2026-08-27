create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  entity_type text not null check (entity_type ~ '^[a-z][a-z0-9_]{0,63}$'),
  entity_id uuid not null,
  title text not null check (length(btrim(title)) between 2 and 180),
  status text not null default 'active' check (status in ('active','archived','deleted')),
  expires_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint documents_deleted_state_check check ((status = 'deleted') = (deleted_at is not null))
);
alter table public.documents add constraint documents_tenant_identity_key unique(organization_id,id);
create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  document_id uuid not null,
  version_number integer not null check (version_number > 0),
  bucket_id text not null check (bucket_id in ('organization-documents','evidences')),
  storage_path text not null check (storage_path ~ '^[0-9a-f-]{36}/[a-z][a-z0-9_]{0,63}/[0-9a-f-]{36}/[0-9a-f-]{36}/[^/]+$'),
  original_name text not null check (length(original_name) between 1 and 255),
  mime_type text not null, size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint document_versions_document_fkey foreign key (organization_id, document_id) references public.documents(organization_id,id) on delete restrict,
  constraint document_versions_number_key unique(document_id,version_number),
  constraint document_versions_path_key unique(bucket_id,storage_path)
);
alter table public.document_versions add constraint document_versions_tenant_identity_key unique(organization_id,id);
create table public.document_evidences (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, document_version_id uuid not null,
  entity_type text not null check (entity_type ~ '^[a-z][a-z0-9_]{0,63}$'), entity_id uuid not null,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
  unique(organization_id,document_version_id,entity_type,entity_id),
  foreign key (organization_id,document_version_id) references public.document_versions(organization_id,id) on delete restrict
);
create index documents_org_status_expiry_idx on public.documents(organization_id,status,expires_at) where status = 'active';
create index document_versions_org_document_idx on public.document_versions(organization_id,document_id,version_number desc);
create index document_evidences_org_entity_idx on public.document_evidences(organization_id,entity_type,entity_id);
insert into public.permissions(code,module,action,description) values
 ('documents.read','documents','read','Consultar documentos privados.'),('documents.create','documents','create','Cargar documentos.'),('documents.update','documents','update','Versionar o actualizar documentos.'),('documents.delete','documents','delete','Eliminar lógicamente documentos.') on conflict(code) do nothing;
insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.code like 'documents.%' where r.code='organization_admin' and r.organization_id is null on conflict do nothing;
alter table public.documents enable row level security; alter table public.document_versions enable row level security; alter table public.document_evidences enable row level security;
grant select,insert,update on public.documents,public.document_versions,public.document_evidences to authenticated;
create policy documents_select on public.documents for select to authenticated using ((select private.has_permission(organization_id,'documents.read')));
create policy documents_insert on public.documents for insert to authenticated with check ((select private.has_permission(organization_id,'documents.create')));
create policy documents_update on public.documents for update to authenticated using ((select private.has_permission(organization_id,'documents.update'))) with check ((select private.has_permission(organization_id,'documents.update')));
create policy document_versions_select on public.document_versions for select to authenticated using ((select private.has_permission(organization_id,'documents.read')));
create policy document_versions_insert on public.document_versions for insert to authenticated with check ((select private.has_permission(organization_id,'documents.create')));
create policy document_evidences_select on public.document_evidences for select to authenticated using ((select private.has_permission(organization_id,'documents.read')));
create policy document_evidences_insert on public.document_evidences for insert to authenticated with check ((select private.has_permission(organization_id,'documents.update')));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('organization-documents','organization-documents',false,26214400,array['application/pdf','image/jpeg','image/png','image/webp']),
 ('evidences','evidences',false,26214400,array['application/pdf','image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy documents_storage_select on storage.objects for select to authenticated using (bucket_id in ('organization-documents','evidences') and (select private.has_permission((storage.foldername(name))[1]::uuid,'documents.read')));
create policy documents_storage_insert on storage.objects for insert to authenticated with check (bucket_id in ('organization-documents','evidences') and (select private.has_permission((storage.foldername(name))[1]::uuid,'documents.create')));
create policy documents_storage_update on storage.objects for update to authenticated using (bucket_id in ('organization-documents','evidences') and (select private.has_permission((storage.foldername(name))[1]::uuid,'documents.update'))) with check (bucket_id in ('organization-documents','evidences') and (select private.has_permission((storage.foldername(name))[1]::uuid,'documents.update')));
create trigger documents_set_updated_at before update on public.documents for each row execute function private.set_updated_at();
create trigger documents_capture_audit after insert or update on public.documents for each row execute function private.capture_core_audit();
create trigger document_versions_capture_audit after insert on public.document_versions for each row execute function private.capture_core_audit();
notify pgrst,'reload schema';
