-- Run after the recommendation migration. All fixture changes are rolled back.
begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);

do $$
declare
  fixture_org uuid := gen_random_uuid();
  fixture_finding uuid := gen_random_uuid();
  fixture_gap uuid := gen_random_uuid();
  single_gap uuid := gen_random_uuid();
  legacy_action uuid := gen_random_uuid();
  verified_action uuid := gen_random_uuid();
  standard_id uuid;
  action_count integer;
begin
  if (select count(distinct minimum_standard_id)
      from private.improvement_action_recommendations where active) <> 60 then
    raise exception 'all 60 standards must have recommendations';
  end if;

  select id into standard_id from public.minimum_standards
    where code='1.1.6' and status='active' and expert_review_status='reviewed';
  if standard_id is null then raise exception 'COPASST standard is unavailable'; end if;

  insert into public.organizations(id,name,slug)
    values(fixture_org,'Prueba de recomendaciones','recommendations-' || replace(fixture_org::text,'-',''));
  insert into public.improvement_findings(id,organization_id,title)
    values(fixture_finding,fixture_org,'Hallazgo de prueba');
  insert into public.improvement_gaps
    (id,organization_id,origin_type,finding_id,deduplication_key,title)
    values(fixture_gap,fixture_org,'finding',fixture_finding,'recommendations:' || fixture_gap,'Brecha de prueba');
  insert into public.improvement_actions
    (id,organization_id,gap_id,title,priority,generated_key)
    values(legacy_action,fixture_org,fixture_gap,'Definir y ejecutar acción de mejora','high','default:' || fixture_gap);

  perform private.populate_gap_recommendations(fixture_org,fixture_gap,standard_id,null);
  select count(*) into action_count from public.improvement_actions where gap_id=fixture_gap;
  if action_count <> 2 then raise exception 'COPASST gap requires two actions, found %',action_count; end if;
  if not exists (
    select 1 from public.improvement_actions
    where id=legacy_action and status='pending'
      and title='Conformar el COPASST'
      and description is not null and expected_evidence is not null
      and evidence_document_version_id is null
  ) then raise exception 'legacy action was not converted correctly'; end if;

  update public.improvement_actions set description='Instrucción editada por una persona'
    where id=legacy_action;
  perform private.populate_gap_recommendations(fixture_org,fixture_gap,standard_id,null);
  if (select count(*) from public.improvement_actions where gap_id=fixture_gap) <> 2 then
    raise exception 'recommendations were duplicated';
  end if;
  if (select description from public.improvement_actions where id=legacy_action)
     <> 'Instrucción editada por una persona' then
    raise exception 'a human edit was overwritten';
  end if;

  insert into public.improvement_actions
    (id,organization_id,gap_id,title,description,priority,status)
  values
    (verified_action,fixture_org,fixture_gap,'Acción verificada por una persona',
     'Resultado humano conservado','high','verified');
  perform private.populate_gap_recommendations(fixture_org,fixture_gap,standard_id,null);
  if (select count(*) from public.improvement_actions where gap_id=fixture_gap) <> 3
     or not exists (
       select 1 from public.improvement_actions
       where id=verified_action and status='verified'
         and description='Resultado humano conservado'
     ) then
    raise exception 'verified actions must remain intact';
  end if;

  select id into standard_id from public.minimum_standards
    where code='2.1.1' and status='active' and expert_review_status='reviewed';
  insert into public.improvement_gaps
    (id,organization_id,origin_type,finding_id,deduplication_key,title)
    values(single_gap,fixture_org,'finding',fixture_finding,'recommendations:' || single_gap,'Brecha única');
  perform private.populate_gap_recommendations(fixture_org,single_gap,standard_id,null);
  if (select count(*) from public.improvement_actions where gap_id=single_gap) <> 1 then
    raise exception 'policy gap requires exactly one action';
  end if;
end $$;

rollback;
