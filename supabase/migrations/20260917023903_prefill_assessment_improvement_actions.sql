-- Recommendations are versioned against the exact minimum-standard row used by
-- an assessment snapshot. They are copied into tenant actions, never treated as
-- evidence that work has already been completed.
alter table public.improvement_actions
  add column expected_evidence text,
  add column recommendation_version integer,
  add constraint improvement_actions_expected_evidence_length
    check (expected_evidence is null or length(btrim(expected_evidence)) between 3 and 2000);

create table private.improvement_action_recommendations (
  id uuid primary key default gen_random_uuid(),
  minimum_standard_id uuid not null references public.minimum_standards(id) on delete restrict,
  action_code smallint not null check (action_code between 1 and 20),
  version_number integer not null default 1 check (version_number > 0),
  title text not null check (length(btrim(title)) between 2 and 240),
  description text not null check (length(btrim(description)) between 3 and 2000),
  expected_evidence text not null check (length(btrim(expected_evidence)) between 3 and 2000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (minimum_standard_id, action_code, version_number)
);
create unique index improvement_recommendations_active_key
  on private.improvement_action_recommendations(minimum_standard_id, action_code)
  where active;
create index improvement_recommendations_standard_idx
  on private.improvement_action_recommendations(minimum_standard_id, action_code)
  where active;
alter table private.improvement_action_recommendations enable row level security;
revoke all on private.improvement_action_recommendations from public, anon, authenticated, service_role;

-- A blank override uses the reviewed standard's criterion and evidence list.
-- Multiple rows are used only for independently executable deliverables.
with proposals(code, action_code, title, description_override, evidence_override) as (
  values
  ('1.1.1',1,'Designar formalmente al responsable del SG-SST',null,null),
  ('1.1.2',1,'Asignar y comunicar responsabilidades de SST',null,null),
  ('1.1.3',1,'Aprobar los recursos para el SG-SST',null,null),
  ('1.1.4',1,'Verificar afiliación y pagos a seguridad social',null,null),
  ('1.1.5',1,'Identificar cargos de alto riesgo y validar cotización especial',null,null),
  ('1.1.6',1,'Conformar el COPASST','Convocar la elección, elegir representantes y formalizar la conformación del COPASST.','Convocatoria, registros de elección, designaciones y acta de conformación.'),
  ('1.1.6',2,'Poner en funcionamiento el COPASST','Programar reuniones y documentar las actividades y decisiones del comité.','Cronograma, actas de reunión y soportes de funcionamiento.'),
  ('1.1.7',1,'Capacitar a los integrantes del COPASST',null,null),
  ('1.1.8',1,'Conformar el Comité de Convivencia Laboral','Convocar, elegir o designar integrantes y formalizar el comité.','Convocatoria, elección o designaciones y acta de conformación.'),
  ('1.1.8',2,'Documentar el funcionamiento del Comité de Convivencia','Aprobar el reglamento y programar reuniones y gestión de casos conforme a su competencia.','Reglamento, actas de reunión y soportes de gestión.'),
  ('1.2.1',1,'Elaborar y ejecutar el programa anual de capacitación',null,null),
  ('1.2.2',1,'Realizar inducción y reinducción en SST',null,null),
  ('1.2.3',1,'Verificar el curso obligatorio del responsable SST',null,null),
  ('2.1.1',1,'Aprobar y divulgar la política de SST',null,null),
  ('2.2.1',1,'Definir objetivos y metas medibles del SG-SST',null,null),
  ('2.3.1',1,'Realizar y documentar la evaluación inicial',null,null),
  ('2.4.1',1,'Formular y aprobar el plan anual de trabajo',null,null),
  ('2.5.1',1,'Implementar el archivo y la retención documental',null,null),
  ('2.6.1',1,'Realizar la rendición anual de cuentas del SG-SST',null,null),
  ('2.7.1',1,'Actualizar la matriz legal aplicable',null,null),
  ('2.8.1',1,'Habilitar canales de comunicación y autorreporte',null,null),
  ('2.9.1',1,'Incorporar criterios SST en las adquisiciones',null,null),
  ('2.10.1',1,'Evaluar proveedores y contratistas con criterios SST',null,null),
  ('2.11.1',1,'Evaluar los riesgos de SST de cada cambio',null,null),
  ('3.1.1',1,'Elaborar el perfil sociodemográfico y diagnóstico de salud',null,null),
  ('3.1.2',1,'Ejecutar actividades de promoción y prevención en salud',null,null),
  ('3.1.3',1,'Entregar perfiles de cargo y exposición al médico evaluador',null,null),
  ('3.1.4',1,'Programar evaluaciones médicas ocupacionales','Definir la periodicidad y programar las evaluaciones médicas ocupacionales según cargo y exposición.','Programa de evaluaciones, remisiones y constancias de programación.'),
  ('3.1.4',2,'Gestionar conceptos y seguimiento de evaluaciones médicas','Recibir los conceptos de aptitud y gestionar recomendaciones sin almacenar historias clínicas en el expediente operativo.','Conceptos de aptitud, constancias de entrega y seguimiento de recomendaciones.'),
  ('3.1.5',1,'Asegurar la custodia de historias clínicas ocupacionales',null,null),
  ('3.1.6',1,'Implementar restricciones y recomendaciones médicas',null,null),
  ('3.1.7',1,'Desarrollar actividades de estilos de vida saludable',null,null),
  ('3.1.8',1,'Verificar disponibilidad de servicios de higiene',null,null),
  ('3.1.9',1,'Implementar la gestión segura de residuos',null,null),
  ('3.2.1',1,'Reportar accidentes y enfermedades laborales',null,null),
  ('3.2.2',1,'Investigar incidentes, accidentes y enfermedades laborales',null,null),
  ('3.2.3',1,'Consolidar y analizar estadísticas de AT y EL',null,null),
  ('3.3.1',1,'Medir mensualmente la frecuencia de accidentes',null,null),
  ('3.3.2',1,'Medir mensualmente la severidad de accidentes',null,null),
  ('3.3.3',1,'Calcular la proporción anual de accidentes mortales',null,null),
  ('3.3.4',1,'Calcular la prevalencia de enfermedad laboral',null,null),
  ('3.3.5',1,'Calcular la incidencia de enfermedad laboral',null,null),
  ('3.3.6',1,'Medir y analizar el ausentismo por causa médica',null,null),
  ('4.1.1',1,'Documentar la metodología de identificación y valoración de riesgos','Definir la metodología, los criterios de valoración y la periodicidad de actualización.','Metodología documentada y criterios de valoración aprobados.'),
  ('4.1.1',2,'Aplicar y actualizar la matriz de peligros y riesgos','Identificar peligros de procesos y actividades, valorar sus riesgos y mantener la matriz vigente.','Matriz de peligros y riesgos vigente, fechas de actualización y control de cambios.'),
  ('4.1.2',1,'Involucrar trabajadores en la identificación de peligros',null,null),
  ('4.1.3',1,'Identificar y controlar sustancias de alta peligrosidad',null,null),
  ('4.1.4',1,'Realizar mediciones ambientales de riesgos prioritarios',null,null),
  ('4.2.1',1,'Definir controles según la jerarquía de intervención','Priorizar medidas de eliminación, sustitución, ingeniería, administrativas y EPP para los riesgos identificados.','Matriz de controles y plan de intervención priorizado.'),
  ('4.2.1',2,'Implementar y verificar medidas de control','Ejecutar las medidas definidas y comprobar su eficacia frente a los riesgos priorizados.','Soportes de implementación de controles y registros de seguimiento de eficacia.'),
  ('4.2.2',1,'Verificar la aplicación de controles por trabajadores',null,null),
  ('4.2.3',1,'Elaborar y divulgar procedimientos seguros de trabajo',null,null),
  ('4.2.4',1,'Programar y ejecutar inspecciones de seguridad',null,null),
  ('4.2.5',1,'Ejecutar mantenimiento preventivo y correctivo',null,null),
  ('4.2.6',1,'Definir y entregar los EPP requeridos','Determinar los EPP por peligro, entregar y reponer los elementos requeridos.','Matriz de EPP, fichas técnicas y actas de entrega y reposición.'),
  ('4.2.6',2,'Capacitar y verificar el uso de EPP','Instruir a trabajadores y contratistas en el uso de EPP y comprobar su aplicación.','Registros de capacitación, inspecciones de uso y soportes de contratistas.'),
  ('5.1.1',1,'Elaborar y divulgar el plan de emergencias','Analizar amenazas y vulnerabilidad y definir rutas, recursos y procedimientos de respuesta.','Plan de emergencias, análisis de amenazas, planos, rutas e inventario de recursos.'),
  ('5.1.1',2,'Ejecutar simulacros y evaluar la respuesta','Realizar simulacros, documentar resultados y ajustar el plan de emergencias.','Registros de simulacros, divulgación, evaluación y acciones de mejora.'),
  ('5.1.2',1,'Conformar y dotar la brigada de emergencias','Designar integrantes, definir perfiles y suministrar la dotación necesaria.','Acto o listado de brigadistas, perfiles e inventario de dotación.'),
  ('5.1.2',2,'Capacitar y entrenar la brigada de emergencias','Ejecutar la formación y los ejercicios prácticos de la brigada.','Plan de formación, certificados y registros de entrenamiento y simulacros.'),
  ('6.1.1',1,'Definir y medir los indicadores del SG-SST',null,null),
  ('6.1.2',1,'Ejecutar la auditoría anual del SG-SST',null,null),
  ('6.1.3',1,'Realizar la revisión anual por la Alta Dirección',null,null),
  ('6.1.4',1,'Planificar la auditoría con el COPASST',null,null),
  ('7.1.1',1,'Definir y ejecutar acciones preventivas y correctivas',null,null),
  ('7.1.2',1,'Ejecutar mejoras de la revisión por la Alta Dirección',null,null),
  ('7.1.3',1,'Ejecutar mejoras derivadas de investigaciones de AT y EL',null,null),
  ('7.1.4',1,'Atender requerimientos de autoridades o ARL',null,null)
)
insert into private.improvement_action_recommendations
  (minimum_standard_id, action_code, title, description, expected_evidence)
select ms.id, p.action_code, p.title,
  coalesce(p.description_override, ms.criterion),
  coalesce(p.evidence_override, ms.expected_evidence)
from proposals p
join public.minimum_standards ms on ms.code = p.code
where ms.status = 'active' and ms.expert_review_status = 'reviewed';

do $$
begin
  if (select count(*) from public.minimum_standards
      where status='active' and expert_review_status='reviewed') <> 60
     or (select count(distinct ms.id) from public.minimum_standards ms
      join private.improvement_action_recommendations r on r.minimum_standard_id=ms.id
      where ms.status='active' and ms.expert_review_status='reviewed') <> 60 then
    raise exception 'all 60 reviewed active minimum standards require action recommendations';
  end if;
end $$;

create or replace function private.populate_gap_recommendations(
  p_organization_id uuid, p_gap_id uuid, p_standard_id uuid, p_actor uuid
) returns void language plpgsql security definer set search_path = '' as $$
declare
  recommendation record;
  generated text;
  legacy_id uuid;
  recommendation_count integer := 0;
begin
  if not exists (select 1 from public.improvement_gaps
                 where id=p_gap_id and organization_id=p_organization_id and status='open') then
    return;
  end if;
  for recommendation in
    select action_code, version_number, title, description, expected_evidence
    from private.improvement_action_recommendations
    where minimum_standard_id=p_standard_id and active
    order by action_code
  loop
    recommendation_count := recommendation_count + 1;
    generated := 'standard:' || p_standard_id || ':gap:' || p_gap_id || ':action:' || recommendation.action_code;
    if exists (select 1 from public.improvement_actions
               where organization_id=p_organization_id and gap_id=p_gap_id
                 and status <> 'cancelled' and lower(btrim(title))=lower(btrim(recommendation.title))) then
      continue;
    end if;

    if recommendation.action_code=1 then
      select id into legacy_id from public.improvement_actions
      where organization_id=p_organization_id and gap_id=p_gap_id
        and generated_key='default:' || p_gap_id
        and title='Definir y ejecutar acción de mejora'
        and status in ('pending','cancelled')
        and description is null and expected_evidence is null
        and responsible_user_id is null and target_date is null
        and evidence_document_version_id is null and validation_note is null
      for update;
      if legacy_id is not null then
        update public.improvement_actions
        set title=recommendation.title,
            description=recommendation.description,
            expected_evidence=recommendation.expected_evidence,
            recommendation_version=recommendation.version_number,
            generated_key=generated,
            status='pending'
        where id=legacy_id;
        continue;
      end if;
    end if;

    insert into public.improvement_actions
      (organization_id,gap_id,title,description,expected_evidence,
       priority,status,generated_key,recommendation_version,created_by)
    values
      (p_organization_id,p_gap_id,recommendation.title,recommendation.description,
       recommendation.expected_evidence,'high','pending',generated,
       recommendation.version_number,p_actor)
    on conflict (organization_id,generated_key) do nothing;
  end loop;
  if recommendation_count=0 then
    raise exception 'no active improvement recommendations for standard %', p_standard_id
      using errcode='23514';
  end if;
end;
$$;
revoke all on function private.populate_gap_recommendations(uuid,uuid,uuid,uuid)
  from public, anon, authenticated, service_role;

create or replace function private.sync_assessment_improvement_plan()
returns trigger language plpgsql security definer set search_path = '' as $$
declare item record; gap_id uuid;
begin
  if new.status <> 'completed' or old.status = new.status then return new; end if;
  for item in
    select ai.id as assessment_item_id, si.minimum_standard_id,
           ms.code, ms.functional_description
    from public.assessment_items ai
    join public.organization_standard_snapshot_items si on si.id=ai.snapshot_item_id
    join public.minimum_standards ms on ms.id=si.minimum_standard_id
    where ai.assessment_id=new.id and ai.response='not_met'
  loop
    insert into public.improvement_gaps
      (organization_id,origin_type,assessment_item_id,deduplication_key,
       title,description,priority,last_detected_assessment_id,created_by)
    values
      (new.organization_id,'assessment_item',item.assessment_item_id,
       'minimum_standard:' || item.minimum_standard_id || ':assessment:' || new.id,
       'Brecha · ' || item.code,item.functional_description,'high',new.id,(select auth.uid()))
    on conflict (organization_id,deduplication_key) do update
      set last_detected_assessment_id=excluded.last_detected_assessment_id,
          updated_at=now()
    returning id into gap_id;
    perform private.populate_gap_recommendations(
      new.organization_id,gap_id,item.minimum_standard_id,(select auth.uid()));
  end loop;
  return new;
end;
$$;
revoke all on function private.sync_assessment_improvement_plan()
  from public, anon, authenticated, service_role;

-- Reconcile historical open gaps only. Converted placeholders retain their ID
-- and audit trail; any human-edited or verified action remains untouched.
do $$
declare gap record;
begin
  for gap in
    select g.id, g.organization_id, si.minimum_standard_id
    from public.improvement_gaps g
    join public.assessment_items ai on ai.id=g.assessment_item_id
    join public.organization_standard_snapshot_items si on si.id=ai.snapshot_item_id
    where g.origin_type='assessment_item' and g.status='open'
  loop
    perform private.populate_gap_recommendations(
      gap.organization_id,gap.id,gap.minimum_standard_id,null);
  end loop;
end $$;

notify pgrst, 'reload schema';
