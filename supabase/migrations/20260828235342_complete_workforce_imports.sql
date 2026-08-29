-- ETAPA 32: secure, replay-safe imports of one business entity per CSV/XLSX.
-- Imported workers are a minimal operational roster, never Auth users or health records.

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  legal_entity_id uuid not null,
  site_id uuid,
  area_id uuid,
  employee_code text not null check (btrim(employee_code) <> ''),
  first_name text not null check (btrim(first_name) <> ''),
  last_name text not null check (btrim(last_name) <> ''),
  work_email text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  imported_from_job_id uuid references public.import_jobs(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, employee_code),
  unique (organization_id, id),
  foreign key (organization_id, legal_entity_id) references public.legal_entities(organization_id,id) on delete restrict,
  foreign key (organization_id, site_id) references public.sites(organization_id,id) on delete restrict,
  foreign key (organization_id, site_id, area_id) references public.areas(organization_id,site_id,id) on delete restrict,
  check (work_email is null or work_email = lower(work_email))
);
create index workers_org_status_idx on public.workers(organization_id,status,employee_code);
create index workers_structure_idx on public.workers(organization_id,legal_entity_id,site_id,area_id);

alter table public.import_jobs add column target_entity_type text check (target_entity_type in ('legal_entity','site','area','worker'));
alter table public.import_jobs add column storage_path text;
alter table public.import_jobs add column mapping_hash text;
alter table public.import_jobs add column rolled_back_at timestamptz;
alter table public.import_jobs drop constraint import_jobs_organization_id_import_type_content_hash_key;
alter table public.import_jobs add constraint import_jobs_idempotency_scope unique(organization_id,target_entity_type,content_hash,mapping_hash);
alter table public.import_job_effects drop constraint import_job_effects_entity_type_check;
alter table public.import_job_effects add constraint import_job_effects_entity_type_check check(entity_type in ('organization_member','legal_entity','site','area','worker'));
alter table public.import_job_effects add column after_data jsonb;
alter table public.import_job_effects add column after_updated_at timestamptz;
alter table public.import_job_effects add column rollback_conflict boolean not null default false;

create table public.workforce_recalculation_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  import_job_id uuid not null unique references public.import_jobs(id) on delete restrict,
  status text not null default 'pending_review' check(status in ('pending_review','processed','cancelled')),
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);
create index workforce_recalculation_org_status_idx on public.workforce_recalculation_requests(organization_id,status,requested_at desc);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('import-staging','import-staging',false,10485760,array['text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function private.assert_import_access(p_organization_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if (select auth.uid()) is null or not private.has_permission(p_organization_id,'imports.manage') then
    raise exception 'import not authorized' using errcode='42501';
  end if;
end; $$;

create or replace function private.validate_worker_links() returns trigger
language plpgsql security definer set search_path='' as $$
declare site_legal_entity uuid;
begin
  if new.site_id is not null then
    select legal_entity_id into site_legal_entity from public.sites where id=new.site_id and organization_id=new.organization_id;
    if site_legal_entity is null or site_legal_entity<>new.legal_entity_id then raise exception 'worker site belongs to another legal entity' using errcode='23514'; end if;
  end if;
  if new.area_id is not null and (new.site_id is null or not exists(select 1 from public.areas where id=new.area_id and site_id=new.site_id and organization_id=new.organization_id)) then
    raise exception 'worker area belongs to another site' using errcode='23514';
  end if;
  return new;
end; $$;

create or replace function private.validate_import_row(p_target text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare errors jsonb:='[]'::jsonb;
begin
  if p_target='legal_entity' and (coalesce(btrim(p_data->>'legal_name'),'')='' or coalesce(btrim(p_data->>'tax_id'),'')='') then errors:=errors||jsonb_build_array(jsonb_build_object('field','legal_name/tax_id','message','Razón social y NIT son obligatorios.')); end if;
  if p_target='site' and (coalesce(btrim(p_data->>'name'),'')='' or coalesce(btrim(p_data->>'code'),'')='' or coalesce(btrim(p_data->>'legal_entity_tax_id'),'')='') then errors:=errors||jsonb_build_array(jsonb_build_object('field','site','message','Nombre, código y NIT de razón social son obligatorios.')); end if;
  if p_target='area' and (coalesce(btrim(p_data->>'name'),'')='' or coalesce(btrim(p_data->>'code'),'')='' or coalesce(btrim(p_data->>'site_code'),'')='') then errors:=errors||jsonb_build_array(jsonb_build_object('field','area','message','Nombre, código y sede son obligatorios.')); end if;
  if p_target='worker' and (coalesce(btrim(p_data->>'employee_code'),'')='' or coalesce(btrim(p_data->>'first_name'),'')='' or coalesce(btrim(p_data->>'last_name'),'')='' or coalesce(btrim(p_data->>'legal_entity_tax_id'),'')='') then errors:=errors||jsonb_build_array(jsonb_build_object('field','worker','message','Código, nombres, apellidos y NIT de razón social son obligatorios.')); end if;
  if p_data ? 'work_email' and nullif(btrim(p_data->>'work_email'),'') is not null and (p_data->>'work_email') !~* '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' then errors:=errors||jsonb_build_array(jsonb_build_object('field','work_email','message','Correo laboral inválido.')); end if;
  return errors;
end; $$;

create or replace function public.stage_import_job(p_job_id uuid,p_organization_id uuid,p_target_entity_type text,p_import_type text,p_file_name text,p_content_hash text,p_mapping_hash text,p_storage_path text,p_mapping jsonb,p_rows jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare existing uuid; row_data jsonb; row_number integer:=0; errors jsonb; valid_rows integer:=0; invalid_rows integer:=0;
begin
  perform private.assert_import_access(p_organization_id);
  if p_target_entity_type not in ('legal_entity','site','area','worker') or p_import_type not in ('workforce_csv','workforce_xlsx','structure_csv','structure_xlsx') then raise exception 'invalid import target' using errcode='22023'; end if;
  select id into existing from public.import_jobs where organization_id=p_organization_id and target_entity_type=p_target_entity_type and content_hash=p_content_hash and mapping_hash=p_mapping_hash;
  if existing is not null then return existing; end if;
  insert into public.import_jobs(id,organization_id,import_type,target_entity_type,file_name,content_hash,mapping_hash,storage_path,idempotency_key,mapping,status,created_by)
  values(p_job_id,p_organization_id,p_import_type,p_target_entity_type,p_file_name,p_content_hash,p_mapping_hash,p_storage_path,gen_random_uuid(),p_mapping,'validating',auth.uid());
  for row_data in select value from jsonb_array_elements(p_rows) loop
    row_number:=row_number+1; errors:=private.validate_import_row(p_target_entity_type,row_data->'normalized_data');
    if errors='[]'::jsonb then valid_rows:=valid_rows+1; else invalid_rows:=invalid_rows+1; end if;
    insert into public.import_rows(organization_id,import_job_id,row_number,raw_data,normalized_data,validation_errors,status)
    values(p_organization_id,p_job_id,coalesce((row_data->>'row_number')::integer,row_number),coalesce(row_data->'raw_data','{}'::jsonb),row_data->'normalized_data',errors,case when errors='[]'::jsonb then 'valid' else 'invalid' end);
  end loop;
  update public.import_jobs set status='preview_ready',summary=jsonb_build_object('rows',row_number,'valid_rows',valid_rows,'invalid_rows',invalid_rows) where id=p_job_id;
  return p_job_id;
exception when unique_violation then
  select id into existing from public.import_jobs where organization_id=p_organization_id and target_entity_type=p_target_entity_type and content_hash=p_content_hash and mapping_hash=p_mapping_hash; return existing;
end; $$;

create or replace function private.apply_import_row(p_job public.import_jobs,p_row public.import_rows) returns void
language plpgsql security definer set search_path='' as $$
declare d jsonb:=p_row.normalized_data; entity uuid; before jsonb; after jsonb; entity_updated_at timestamptz; legal_id uuid; site_uuid uuid; area_uuid uuid;
begin
  if p_job.target_entity_type='legal_entity' then
    select id,to_jsonb(le),updated_at into entity,before,entity_updated_at from public.legal_entities le where organization_id=p_job.organization_id and tax_id=btrim(d->>'tax_id') for update;
    if entity is null then insert into public.legal_entities(organization_id,legal_name,trade_name,tax_id,ciiu_code,economic_activity,risk_class,status,created_by,updated_by) values(p_job.organization_id,btrim(d->>'legal_name'),nullif(btrim(d->>'trade_name'),''),btrim(d->>'tax_id'),nullif(btrim(d->>'ciiu_code'),''),nullif(btrim(d->>'economic_activity'),''),nullif(d->>'risk_class','')::smallint,coalesce(nullif(d->>'status',''),'active'),auth.uid(),auth.uid()) returning id,to_jsonb(public.legal_entities.*),updated_at into entity,after,entity_updated_at; else update public.legal_entities set legal_name=btrim(d->>'legal_name'),trade_name=nullif(btrim(d->>'trade_name'),''),ciiu_code=nullif(btrim(d->>'ciiu_code'),''),economic_activity=nullif(btrim(d->>'economic_activity'),''),risk_class=nullif(d->>'risk_class','')::smallint,status=coalesce(nullif(d->>'status',''),'active'),updated_by=auth.uid() where id=entity returning to_jsonb(public.legal_entities.*),updated_at into after,entity_updated_at; end if;
  elsif p_job.target_entity_type='site' then
    select id into legal_id from public.legal_entities where organization_id=p_job.organization_id and tax_id=btrim(d->>'legal_entity_tax_id'); if legal_id is null then raise exception 'unknown legal entity NIT' using errcode='23514'; end if;
    select id,to_jsonb(s),updated_at into entity,before,entity_updated_at from public.sites s where organization_id=p_job.organization_id and code=btrim(d->>'code') for update;
    if entity is null then insert into public.sites(organization_id,legal_entity_id,name,code,address,city,department,risk_class,status,created_by,updated_by) values(p_job.organization_id,legal_id,btrim(d->>'name'),btrim(d->>'code'),nullif(btrim(d->>'address'),''),nullif(btrim(d->>'city'),''),nullif(btrim(d->>'department'),''),nullif(d->>'risk_class','')::smallint,coalesce(nullif(d->>'status',''),'active'),auth.uid(),auth.uid()) returning id,to_jsonb(public.sites.*),updated_at into entity,after,entity_updated_at; else update public.sites set legal_entity_id=legal_id,name=btrim(d->>'name'),address=nullif(btrim(d->>'address'),''),city=nullif(btrim(d->>'city'),''),department=nullif(btrim(d->>'department'),''),risk_class=nullif(d->>'risk_class','')::smallint,status=coalesce(nullif(d->>'status',''),'active'),updated_by=auth.uid() where id=entity returning to_jsonb(public.sites.*),updated_at into after,entity_updated_at; end if;
  elsif p_job.target_entity_type='area' then
    select id into site_uuid from public.sites where organization_id=p_job.organization_id and code=btrim(d->>'site_code'); if site_uuid is null then raise exception 'unknown site code' using errcode='23514'; end if;
    select id,to_jsonb(a),updated_at into entity,before,entity_updated_at from public.areas a where organization_id=p_job.organization_id and site_id=site_uuid and code=btrim(d->>'code') for update;
    if entity is null then insert into public.areas(organization_id,site_id,name,code,status,created_by,updated_by) values(p_job.organization_id,site_uuid,btrim(d->>'name'),btrim(d->>'code'),coalesce(nullif(d->>'status',''),'active'),auth.uid(),auth.uid()) returning id,to_jsonb(public.areas.*),updated_at into entity,after,entity_updated_at; else update public.areas set name=btrim(d->>'name'),status=coalesce(nullif(d->>'status',''),'active'),updated_by=auth.uid() where id=entity returning to_jsonb(public.areas.*),updated_at into after,entity_updated_at; end if;
  else
    select id into legal_id from public.legal_entities where organization_id=p_job.organization_id and tax_id=btrim(d->>'legal_entity_tax_id'); if legal_id is null then raise exception 'unknown legal entity NIT' using errcode='23514'; end if;
    if nullif(btrim(d->>'site_code'),'') is not null then select id into site_uuid from public.sites where organization_id=p_job.organization_id and code=btrim(d->>'site_code') and legal_entity_id=legal_id; if site_uuid is null then raise exception 'unknown site code for legal entity' using errcode='23514'; end if; end if;
    if nullif(btrim(d->>'area_code'),'') is not null then select id into area_uuid from public.areas where organization_id=p_job.organization_id and site_id=site_uuid and code=btrim(d->>'area_code'); if area_uuid is null then raise exception 'unknown area code for site' using errcode='23514'; end if; end if;
    select id,to_jsonb(w),updated_at into entity,before,entity_updated_at from public.workers w where organization_id=p_job.organization_id and employee_code=btrim(d->>'employee_code') for update;
    if entity is null then insert into public.workers(organization_id,legal_entity_id,site_id,area_id,employee_code,first_name,last_name,work_email,status,imported_from_job_id,created_by,updated_by) values(p_job.organization_id,legal_id,site_uuid,area_uuid,btrim(d->>'employee_code'),btrim(d->>'first_name'),btrim(d->>'last_name'),nullif(lower(btrim(d->>'work_email')),''),coalesce(nullif(d->>'status',''),'active'),p_job.id,auth.uid(),auth.uid()) returning id,to_jsonb(public.workers.*),updated_at into entity,after,entity_updated_at; else update public.workers set legal_entity_id=legal_id,site_id=site_uuid,area_id=area_uuid,first_name=btrim(d->>'first_name'),last_name=btrim(d->>'last_name'),work_email=nullif(lower(btrim(d->>'work_email')),''),status=coalesce(nullif(d->>'status',''),'active'),updated_by=auth.uid() where id=entity returning to_jsonb(public.workers.*),updated_at into after,entity_updated_at; end if;
  end if;
  insert into public.import_job_effects(organization_id,import_job_id,entity_type,entity_id,operation,before_data,after_data,after_updated_at) values(p_job.organization_id,p_job.id,p_job.target_entity_type,entity,case when before is null then 'insert' else 'update' end,before,after,entity_updated_at);
  update public.import_rows set status='imported',target_reference=entity::text where id=p_row.id;
end; $$;

create or replace function public.commit_import_job(p_import_job_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare j public.import_jobs%rowtype; r public.import_rows%rowtype;
begin
  select * into j from public.import_jobs where id=p_import_job_id for update; if not found then raise exception 'import job not found' using errcode='P0002'; end if; perform private.assert_import_access(j.organization_id);
  if j.status='completed' then return j.id; end if;
  if j.status<>'preview_ready' or exists(select 1 from public.import_rows where import_job_id=j.id and status='invalid') then raise exception 'import contains unresolved validation errors' using errcode='23514'; end if;
  update public.import_jobs set status='committing' where id=j.id;
  for r in select * from public.import_rows where import_job_id=j.id and status='valid' order by row_number loop perform private.apply_import_row(j,r); end loop;
  update public.import_jobs set status='completed',mode='commit',completed_at=now(),summary=summary||jsonb_build_object('imported_rows',(select count(*) from public.import_rows where import_job_id=j.id and status='imported')) where id=j.id;
  if j.target_entity_type='worker' then
    insert into public.workforce_recalculation_requests(organization_id,import_job_id,requested_by) values(j.organization_id,j.id,auth.uid()) on conflict(import_job_id) do nothing;
    perform private.enqueue_domain_event(j.organization_id,'workforce.import.completed','import_job',j.id,jsonb_build_object('import_job_id',j.id,'target_entity_type',j.target_entity_type),j.id);
  end if;
  return j.id;
end; $$;

create or replace function public.rollback_import_job(p_import_job_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j public.import_jobs%rowtype; e public.import_job_effects%rowtype; conflicts integer:=0; reverted integer:=0;
begin
  select * into j from public.import_jobs where id=p_import_job_id for update; if not found then raise exception 'import job not found' using errcode='P0002'; end if; perform private.assert_import_access(j.organization_id);
  if j.status not in ('completed','rolled_back') then raise exception 'only completed imports can be rolled back' using errcode='23514'; end if;
  for e in select * from public.import_job_effects where import_job_id=j.id order by created_at desc loop
    if e.entity_type='worker' and not exists(select 1 from public.workers where id=e.entity_id and updated_at=e.after_updated_at) then update public.import_job_effects set rollback_conflict=true where id=e.id; conflicts:=conflicts+1; continue; end if;
    if e.entity_type='legal_entity' and not exists(select 1 from public.legal_entities where id=e.entity_id and updated_at=e.after_updated_at) then update public.import_job_effects set rollback_conflict=true where id=e.id; conflicts:=conflicts+1; continue; end if;
    if e.entity_type='site' and not exists(select 1 from public.sites where id=e.entity_id and updated_at=e.after_updated_at) then update public.import_job_effects set rollback_conflict=true where id=e.id; conflicts:=conflicts+1; continue; end if;
    if e.entity_type='area' and not exists(select 1 from public.areas where id=e.entity_id and updated_at=e.after_updated_at) then update public.import_job_effects set rollback_conflict=true where id=e.id; conflicts:=conflicts+1; continue; end if;
    if e.operation='insert' then
      if e.entity_type='worker' then update public.workers set status='archived',updated_by=auth.uid() where id=e.entity_id; elsif e.entity_type='legal_entity' then update public.legal_entities set status='inactive',updated_by=auth.uid() where id=e.entity_id; elsif e.entity_type='site' then update public.sites set status='inactive',updated_by=auth.uid() where id=e.entity_id; else update public.areas set status='inactive',updated_by=auth.uid() where id=e.entity_id; end if;
    else
      if e.entity_type='worker' then update public.workers set legal_entity_id=(e.before_data->>'legal_entity_id')::uuid,site_id=(e.before_data->>'site_id')::uuid,area_id=(e.before_data->>'area_id')::uuid,first_name=e.before_data->>'first_name',last_name=e.before_data->>'last_name',work_email=e.before_data->>'work_email',status=e.before_data->>'status',updated_by=auth.uid() where id=e.entity_id; elsif e.entity_type='legal_entity' then update public.legal_entities set legal_name=e.before_data->>'legal_name',trade_name=e.before_data->>'trade_name',ciiu_code=e.before_data->>'ciiu_code',economic_activity=e.before_data->>'economic_activity',risk_class=(e.before_data->>'risk_class')::smallint,status=e.before_data->>'status',updated_by=auth.uid() where id=e.entity_id; elsif e.entity_type='site' then update public.sites set legal_entity_id=(e.before_data->>'legal_entity_id')::uuid,name=e.before_data->>'name',address=e.before_data->>'address',city=e.before_data->>'city',department=e.before_data->>'department',risk_class=(e.before_data->>'risk_class')::smallint,status=e.before_data->>'status',updated_by=auth.uid() where id=e.entity_id; else update public.areas set name=e.before_data->>'name',status=e.before_data->>'status',updated_by=auth.uid() where id=e.entity_id; end if;
    end if;
    update public.import_rows set status='rolled_back' where import_job_id=j.id and target_reference=e.entity_id::text; reverted:=reverted+1;
  end loop;
  update public.import_jobs set status='rolled_back',mode='rolled_back',rolled_back_at=now(),summary=summary||jsonb_build_object('rolled_back_effects',reverted,'rollback_conflicts',conflicts) where id=j.id;
  return jsonb_build_object('reverted',reverted,'conflicts',conflicts);
end; $$;

alter table public.workers enable row level security;
alter table public.workforce_recalculation_requests enable row level security;
grant select on public.workers,public.workforce_recalculation_requests to authenticated;
create policy workers_import_read on public.workers for select to authenticated using ((select private.has_permission(organization_id,'imports.read')));
create policy workforce_recalculation_read on public.workforce_recalculation_requests for select to authenticated using ((select private.has_permission(organization_id,'imports.read')));

revoke insert,update,delete on public.import_jobs,public.import_rows,public.import_job_effects from authenticated;
revoke insert,update,delete on public.workers,public.workforce_recalculation_requests from authenticated;
revoke all on function private.assert_import_access(uuid),private.validate_worker_links(),private.validate_import_row(text,jsonb),private.apply_import_row(public.import_jobs,public.import_rows) from public,anon,authenticated;
revoke all on function public.stage_import_job(uuid,uuid,text,text,text,text,text,text,jsonb,jsonb),public.commit_import_job(uuid),public.rollback_import_job(uuid) from public,anon;
grant execute on function public.stage_import_job(uuid,uuid,text,text,text,text,text,text,jsonb,jsonb),public.commit_import_job(uuid),public.rollback_import_job(uuid) to authenticated;

create policy import_staging_select on storage.objects for select to authenticated using (bucket_id='import-staging' and (storage.foldername(name))[1]::uuid is not null and (select private.has_permission((storage.foldername(name))[1]::uuid,'imports.read')));
create policy import_staging_insert on storage.objects for insert to authenticated with check (bucket_id='import-staging' and (storage.foldername(name))[1]::uuid is not null and (select private.has_permission((storage.foldername(name))[1]::uuid,'imports.manage')) and (storage.foldername(name))[2] is not null);
create policy import_staging_delete on storage.objects for delete to authenticated using (bucket_id='import-staging' and (storage.foldername(name))[1]::uuid is not null and (select private.has_permission((storage.foldername(name))[1]::uuid,'imports.manage')));

create trigger workers_validate_links before insert or update on public.workers for each row execute function private.validate_worker_links();
create trigger workers_prevent_org_change before update on public.workers for each row execute function private.prevent_organization_change();
create trigger workers_updated before update on public.workers for each row execute function private.set_updated_at();
create trigger workers_audit after insert or update on public.workers for each row execute function private.capture_core_audit();
create trigger import_rows_audit after insert or update on public.import_rows for each row execute function private.capture_core_audit();
create trigger import_effects_audit after insert or update on public.import_job_effects for each row execute function private.capture_core_audit();
create trigger workforce_recalculation_audit after insert or update on public.workforce_recalculation_requests for each row execute function private.capture_core_audit();
notify pgrst,'reload schema';
