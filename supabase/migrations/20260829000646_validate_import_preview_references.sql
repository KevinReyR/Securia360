-- Make relational import errors visible during preview, before any commit.
create or replace function private.validate_import_row(p_organization_id uuid,p_target text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare errors jsonb:='[]'::jsonb; legal_id uuid; site_uuid uuid;
begin
  if p_target='legal_entity' and (coalesce(btrim(p_data->>'legal_name'),'')='' or coalesce(btrim(p_data->>'tax_id'),'')='') then errors:=errors||jsonb_build_array(jsonb_build_object('field','legal_name/tax_id','message','Razón social y NIT son obligatorios.')); end if;
  if p_target='site' then
    if coalesce(btrim(p_data->>'name'),'')='' or coalesce(btrim(p_data->>'code'),'')='' or coalesce(btrim(p_data->>'legal_entity_tax_id'),'')='' then errors:=errors||jsonb_build_array(jsonb_build_object('field','site','message','Nombre, código y NIT de razón social son obligatorios.'));
    elsif not exists(select 1 from public.legal_entities where organization_id=p_organization_id and tax_id=btrim(p_data->>'legal_entity_tax_id')) then errors:=errors||jsonb_build_array(jsonb_build_object('field','legal_entity_tax_id','message','No existe una razón social con ese NIT.')); end if;
  end if;
  if p_target='area' then
    if coalesce(btrim(p_data->>'name'),'')='' or coalesce(btrim(p_data->>'code'),'')='' or coalesce(btrim(p_data->>'site_code'),'')='' then errors:=errors||jsonb_build_array(jsonb_build_object('field','area','message','Nombre, código y sede son obligatorios.'));
    elsif not exists(select 1 from public.sites where organization_id=p_organization_id and code=btrim(p_data->>'site_code')) then errors:=errors||jsonb_build_array(jsonb_build_object('field','site_code','message','No existe una sede con ese código.')); end if;
  end if;
  if p_target='worker' then
    if coalesce(btrim(p_data->>'employee_code'),'')='' or coalesce(btrim(p_data->>'first_name'),'')='' or coalesce(btrim(p_data->>'last_name'),'')='' or coalesce(btrim(p_data->>'legal_entity_tax_id'),'')='' then errors:=errors||jsonb_build_array(jsonb_build_object('field','worker','message','Código, nombres, apellidos y NIT de razón social son obligatorios.')); end if;
    select id into legal_id from public.legal_entities where organization_id=p_organization_id and tax_id=btrim(p_data->>'legal_entity_tax_id');
    if legal_id is null then errors:=errors||jsonb_build_array(jsonb_build_object('field','legal_entity_tax_id','message','No existe una razón social con ese NIT.')); end if;
    if nullif(btrim(p_data->>'site_code'),'') is not null then select id into site_uuid from public.sites where organization_id=p_organization_id and code=btrim(p_data->>'site_code') and legal_entity_id=legal_id; if site_uuid is null then errors:=errors||jsonb_build_array(jsonb_build_object('field','site_code','message','No existe una sede de esa razón social con ese código.')); end if; end if;
    if nullif(btrim(p_data->>'area_code'),'') is not null and (site_uuid is null or not exists(select 1 from public.areas where organization_id=p_organization_id and site_id=site_uuid and code=btrim(p_data->>'area_code'))) then errors:=errors||jsonb_build_array(jsonb_build_object('field','area_code','message','No existe un área con ese código en la sede.')); end if;
  end if;
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
  insert into public.import_jobs(id,organization_id,import_type,target_entity_type,file_name,content_hash,mapping_hash,storage_path,idempotency_key,mapping,status,created_by) values(p_job_id,p_organization_id,p_import_type,p_target_entity_type,p_file_name,p_content_hash,p_mapping_hash,p_storage_path,gen_random_uuid(),p_mapping,'validating',auth.uid());
  for row_data in select value from jsonb_array_elements(p_rows) loop
    row_number:=row_number+1; errors:=private.validate_import_row(p_organization_id,p_target_entity_type,row_data->'normalized_data');
    if p_target_entity_type='worker' and exists(select 1 from public.import_rows where import_job_id=p_job_id and normalized_data->>'employee_code'=row_data->'normalized_data'->>'employee_code') then errors:=errors||jsonb_build_array(jsonb_build_object('field','employee_code','message','Código de trabajador repetido en el archivo.')); end if;
    if errors='[]'::jsonb then valid_rows:=valid_rows+1; else invalid_rows:=invalid_rows+1; end if;
    insert into public.import_rows(organization_id,import_job_id,row_number,raw_data,normalized_data,validation_errors,status) values(p_organization_id,p_job_id,coalesce((row_data->>'row_number')::integer,row_number),coalesce(row_data->'raw_data','{}'::jsonb),row_data->'normalized_data',errors,case when errors='[]'::jsonb then 'valid' else 'invalid' end);
  end loop;
  update public.import_jobs set status='preview_ready',summary=jsonb_build_object('rows',row_number,'valid_rows',valid_rows,'invalid_rows',invalid_rows) where id=p_job_id; return p_job_id;
exception when unique_violation then select id into existing from public.import_jobs where organization_id=p_organization_id and target_entity_type=p_target_entity_type and content_hash=p_content_hash and mapping_hash=p_mapping_hash; return existing;
end; $$;
revoke all on function private.validate_import_row(uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.stage_import_job(uuid,uuid,text,text,text,text,text,text,jsonb,jsonb) from public,anon;
grant execute on function public.stage_import_job(uuid,uuid,text,text,text,text,text,text,jsonb,jsonb) to authenticated;
notify pgrst,'reload schema';
