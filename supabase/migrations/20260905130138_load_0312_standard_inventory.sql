-- Versioned Resolution 0312 minimum-standards inventory.
-- Source workbook SHA-256:
-- F3700F103B53D03EAB076B185084B5DF0F2D5FFEA463FAD5F25C1BCEBC153C57
-- Imported content remains draft/pending until an authorized human review.
-- This migration does not declare legal compliance.

create or replace function private.refresh_standard_profile_publication(p_version_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_weight numeric;
  v_count integer;
  v_all_standards_ready boolean;
  v_all_links_approved boolean;
  v_version_approved boolean;
begin
  select standard_profile_id
  into v_profile_id
  from public.standard_profile_versions
  where id = p_version_id
  for update;

  if v_profile_id is null then
    return;
  end if;

  select
    count(*),
    coalesce(sum(ps.weight), 0),
    coalesce(bool_and(ms.status = 'active' and ms.expert_review_status = 'reviewed'), false),
    coalesce(bool_and(exists(
      select 1
      from public.normative_review_artifacts a
      where a.profile_standard_id = ps.id
        and a.review_status = 'approved'
    )), false)
  into v_count, v_weight, v_all_standards_ready, v_all_links_approved
  from public.profile_standards ps
  join public.minimum_standards ms on ms.id = ps.minimum_standard_id
  where ps.standard_profile_version_id = p_version_id;

  select exists(
    select 1
    from public.normative_review_artifacts a
    where a.standard_profile_version_id = p_version_id
      and a.review_status = 'approved'
  ) into v_version_approved;

  if v_count > 0
     and v_weight = 100
     and v_all_standards_ready
     and v_all_links_approved
     and v_version_approved then
    update public.standard_profile_versions
    set status = 'published',
        expert_review_status = 'reviewed'
    where id = p_version_id
      and status = 'draft';

    update public.standard_profiles
    set status = 'active'
    where id = v_profile_id
      and status = 'draft';
  end if;
end;
$$;

create or replace function private.sync_normative_review_artifact(
  p_artifact_id uuid,
  p_decision text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_artifact public.normative_review_artifacts%rowtype;
  v_version_id uuid;
begin
  select *
  into v_artifact
  from public.normative_review_artifacts
  where id = p_artifact_id;

  if not found then
    raise exception 'review artifact not found' using errcode = 'P0002';
  end if;

  if p_decision = 'reviewed' then
    if v_artifact.normative_source_version_id is not null then
      update public.normative_source_versions
      set expert_review_status = 'reviewed'
      where id = v_artifact.normative_source_version_id
        and expert_review_status = 'pending';
    elsif v_artifact.requirement_id is not null then
      update public.requirements
      set expert_review_status = 'reviewed'
      where id = v_artifact.requirement_id
        and expert_review_status = 'pending';
    elsif v_artifact.minimum_standard_id is not null then
      update public.minimum_standards
      set expert_review_status = 'reviewed'
      where id = v_artifact.minimum_standard_id
        and expert_review_status = 'pending';
    elsif v_artifact.standard_profile_version_id is not null then
      update public.standard_profile_versions
      set expert_review_status = 'reviewed'
      where id = v_artifact.standard_profile_version_id
        and expert_review_status = 'pending';
    elsif v_artifact.assessment_scoring_rule_id is not null then
      update public.assessment_scoring_rules
      set expert_review_status = 'reviewed'
      where id = v_artifact.assessment_scoring_rule_id
        and expert_review_status = 'pending';
    end if;
    return;
  end if;

  if p_decision = 'approved' then
    if v_artifact.normative_source_version_id is not null then
      update public.normative_source_versions
      set expert_review_status = 'reviewed',
          status = case when status = 'draft' then 'published' else status end
      where id = v_artifact.normative_source_version_id;
    elsif v_artifact.requirement_id is not null then
      update public.requirements
      set expert_review_status = 'reviewed',
          status = case when status = 'draft' then 'active' else status end
      where id = v_artifact.requirement_id;
    elsif v_artifact.minimum_standard_id is not null then
      update public.minimum_standards
      set expert_review_status = 'reviewed',
          status = case when status = 'draft' then 'active' else status end
      where id = v_artifact.minimum_standard_id;

      for v_version_id in
        select ps.standard_profile_version_id
        from public.profile_standards ps
        where ps.minimum_standard_id = v_artifact.minimum_standard_id
      loop
        perform private.refresh_standard_profile_publication(v_version_id);
      end loop;
    elsif v_artifact.standard_profile_version_id is not null then
      update public.standard_profile_versions
      set expert_review_status = 'reviewed'
      where id = v_artifact.standard_profile_version_id;

      perform private.refresh_standard_profile_publication(
        v_artifact.standard_profile_version_id
      );
    elsif v_artifact.profile_standard_id is not null then
      select standard_profile_version_id
      into v_version_id
      from public.profile_standards
      where id = v_artifact.profile_standard_id;

      perform private.refresh_standard_profile_publication(v_version_id);
    elsif v_artifact.assessment_scoring_rule_id is not null then
      update public.assessment_scoring_rules
      set expert_review_status = 'reviewed',
          status = 'approved'
      where id = v_artifact.assessment_scoring_rule_id
        and status = 'draft';
    end if;
    return;
  end if;

  if p_decision = 'rejected' then
    if v_artifact.requirement_id is not null then
      update public.requirements
      set expert_review_status = 'pending',
          status = 'draft'
      where id = v_artifact.requirement_id
        and status = 'draft';
    elsif v_artifact.minimum_standard_id is not null then
      update public.minimum_standards
      set expert_review_status = 'pending',
          status = 'draft'
      where id = v_artifact.minimum_standard_id
        and status = 'draft';
    elsif v_artifact.standard_profile_version_id is not null then
      update public.standard_profile_versions
      set expert_review_status = 'pending'
      where id = v_artifact.standard_profile_version_id
        and status = 'draft';
    elsif v_artifact.assessment_scoring_rule_id is not null then
      update public.assessment_scoring_rules
      set expert_review_status = 'pending'
      where id = v_artifact.assessment_scoring_rule_id
        and status = 'draft';
    end if;
  end if;
end;
$$;

create or replace function private.decide_normative_review(
  p_artifact_id uuid,
  p_decision text,
  p_note text,
  p_proposal_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  proposal public.normative_review_proposals%rowtype;
  artifact public.normative_review_artifacts%rowtype;
  decision_id uuid;
  successor_id uuid;
begin
  if not private.is_normative_reviewer(false) then
    raise exception 'active normative reviewer access required' using errcode = '42501';
  end if;

  if p_decision not in ('reviewed','approved','rejected')
     or length(btrim(p_note)) < 3 then
    raise exception 'invalid review decision' using errcode = '22023';
  end if;

  select *
  into artifact
  from public.normative_review_artifacts
  where id = p_artifact_id
  for update;

  if not found then
    raise exception 'review artifact not found' using errcode = 'P0002';
  end if;

  if p_proposal_id is not null then
    select *
    into proposal
    from public.normative_review_proposals
    where id = p_proposal_id
      and artifact_id = p_artifact_id
    for update;

    if not found or proposal.status <> 'pending_review' then
      raise exception 'proposal is not pending review' using errcode = '55000';
    end if;

    if p_decision = 'approved' then
      insert into public.normative_review_artifacts(
        artifact_type,
        artifact_key,
        title,
        source_path,
        content_snapshot,
        review_status,
        supersedes_artifact_id,
        created_by
      )
      values(
        artifact.artifact_type,
        artifact.artifact_key,
        artifact.title,
        artifact.source_path,
        proposal.proposed_content,
        'pending',
        artifact.id,
        actor
      )
      returning id into successor_id;

      update public.normative_review_proposals
      set status = 'approved',
          resolved_by = actor,
          resolved_at = now(),
          successor_artifact_id = successor_id
      where id = proposal.id;

      update public.normative_review_artifacts
      set review_status = 'superseded'
      where id = artifact.id
        and artifact.review_status <> 'approved';
    elsif p_decision = 'rejected' then
      update public.normative_review_proposals
      set status = 'rejected',
          resolved_by = actor,
          resolved_at = now()
      where id = proposal.id;
    else
      raise exception 'a proposal must be approved or rejected' using errcode = '22023';
    end if;
  else
    if artifact.review_status in ('approved','superseded') then
      raise exception 'approved or superseded artifact cannot be changed' using errcode = '55000';
    end if;

    update public.normative_review_artifacts
    set review_status = p_decision
    where id = artifact.id;

    perform private.sync_normative_review_artifact(artifact.id, p_decision);
  end if;

  insert into public.normative_review_decisions(
    artifact_id,
    proposal_id,
    decision,
    note,
    content_snapshot,
    decided_by
  )
  values(
    p_artifact_id,
    p_proposal_id,
    p_decision,
    btrim(p_note),
    coalesce(proposal.proposed_content, artifact.content_snapshot),
    actor
  )
  returning id into decision_id;

  perform private.normative_review_audit(
    'normative_review.decided',
    'normative_review_decision',
    decision_id,
    null,
    jsonb_build_object(
      'decision', p_decision,
      'proposal_id', p_proposal_id,
      'successor_artifact_id', successor_id
    )
  );

  return decision_id;
end;
$$;

revoke all on function private.refresh_standard_profile_publication(uuid) from public, anon, authenticated, service_role;
revoke all on function private.sync_normative_review_artifact(uuid, text) from public, anon, authenticated, service_role;
revoke all on function private.decide_normative_review(uuid, text, text, uuid) from public, anon;
grant execute on function private.decide_normative_review(uuid, text, text, uuid) to authenticated;

do $$
declare
  v_source_version_id uuid;
  v_actor uuid;
  v_profile record;
  v_weight numeric;
  v_count integer;
begin
  select v.id
  into v_source_version_id
  from public.normative_source_versions v
  join public.normative_sources s on s.id = v.source_id
  where s.code = 'RESOLUCION_0312_2019'
    and v.version_code = '2019'
  limit 1;

  if v_source_version_id is null then
    raise exception 'Resolution 0312 source version 2019 is required';
  end if;

  select user_id
  into v_actor
  from public.normative_reviewer_roles
  where status = 'active'
  order by case role when 'review_admin' then 0 else 1 end, granted_at
  limit 1;

  if v_actor is null then
    raise exception 'an active normative reviewer is required to register inventory artifacts';
  end if;

  with inventory as (
    select *
    from jsonb_to_recordset(
      $standards$[{"code":"1.1.1","functional_description":"Responsable del SG-SST","phva_cycle":"PLAN","criterion":"Asignar una persona competente para diseñar e implementar el SG-SST, con el perfil, licencia y formación exigibles según el tipo de empresa.","expected_evidence":"Acto o documento de designación; responsabilidades asignadas; hoja de vida; licencia SST cuando aplique; certificado del curso obligatorio."},{"code":"1.1.2","functional_description":"Responsabilidades en el SG-SST","phva_cycle":"PLAN","criterion":"Asignar y documentar responsabilidades específicas en SST a todos los niveles de la organización para el desarrollo y mejora continua del sistema.","expected_evidence":"Matriz o documento de responsabilidades; manuales/perfiles de cargo; actos internos; evidencia de comunicación o socialización."},{"code":"1.1.3","functional_description":"Asignación de recursos para el SG-SST","phva_cycle":"PLAN","criterion":"Definir y asignar recursos humanos, financieros, técnicos y físicos suficientes para implementar, mantener y mejorar el SG-SST.","expected_evidence":"Presupuesto aprobado; plan de recursos; contratos/órdenes; asignaciones de personal; soportes de disponibilidad de medios e infraestructura."},{"code":"1.1.4","functional_description":"Afiliación al Sistema General de Seguridad Social Integral","phva_cycle":"PLAN","criterion":"Garantizar la afiliación y pago al sistema de salud, pensión y riesgos laborales de los trabajadores conforme a su modalidad de vinculación.","expected_evidence":"Listado de trabajadores; certificados de afiliación; planillas PILA y comprobantes de pago de los periodos objeto de verificación."},{"code":"1.1.5","functional_description":"Trabajadores de alto riesgo y pensión especial","phva_cycle":"PLAN","criterion":"Identificar trabajadores que desarrollan actividades de alto riesgo y efectuar la cotización especial a pensión cuando corresponda.","expected_evidence":"Inventario de cargos/actividades de alto riesgo; soportes de clasificación; planillas PILA con cotización especial; justificación de no aplicabilidad si procede."},{"code":"1.1.6","functional_description":"Conformación y funcionamiento del COPASST","phva_cycle":"PLAN","criterion":"Conformar y asegurar el funcionamiento del COPASST de acuerdo con la normativa aplicable.","expected_evidence":"Convocatoria y elección; acta de conformación; designaciones; cronograma; actas de reunión; evidencias de funcionamiento."},{"code":"1.1.7","functional_description":"Capacitación de integrantes del COPASST","phva_cycle":"PLAN","criterion":"Capacitar a los integrantes del COPASST para el cumplimiento efectivo de sus funciones y responsabilidades.","expected_evidence":"Plan o temario de capacitación; listas de asistencia; certificados; evaluaciones; actas o registros de actividades formativas."},{"code":"1.1.8","functional_description":"Conformación y funcionamiento del Comité de Convivencia Laboral","phva_cycle":"PLAN","criterion":"Conformar y asegurar el funcionamiento del Comité de Convivencia Laboral conforme a la regulación vigente.","expected_evidence":"Convocatoria/elección o designación; acta de conformación; reglamento o procedimiento; actas de reunión y soportes de gestión."},{"code":"1.2.1","functional_description":"Programa anual de capacitación en promoción y prevención","phva_cycle":"PLAN","criterion":"Elaborar y ejecutar un programa anual de capacitación que cubra peligros/riesgos prioritarios y medidas de prevención y control para todos los niveles.","expected_evidence":"Programa anual aprobado; cronograma; contenidos; listas de asistencia; evaluaciones; certificados y evidencias de ejecución."},{"code":"1.2.2","functional_description":"Inducción y reinducción en SST","phva_cycle":"PLAN","criterion":"Realizar inducción y reinducción en SST a trabajadores y demás personal aplicable antes o durante el desarrollo de sus labores, según corresponda.","expected_evidence":"Programa y material de inducción/reinducción; registros de asistencia; evaluaciones; constancias de realización por persona."},{"code":"1.2.3","functional_description":"Curso virtual de capacitación de 50 horas en SST","phva_cycle":"PLAN","criterion":"Asegurar que el responsable del SG-SST cuente con el curso virtual de capacitación exigido por el Ministerio del Trabajo.","expected_evidence":"Certificado vigente o válido de aprobación del curso obligatorio expedido a nombre del responsable."},{"code":"2.1.1","functional_description":"Política de Seguridad y Salud en el Trabajo","phva_cycle":"PLAN","criterion":"Mantener una política de SST documentada, aprobada, firmada, fechada, comunicada y coherente con los riesgos y objetivos del SG-SST.","expected_evidence":"Política firmada y fechada; evidencia de publicación/socialización; comunicación al COPASST; control de versión y revisión."},{"code":"2.2.1","functional_description":"Objetivos del SG-SST","phva_cycle":"PLAN","criterion":"Definir objetivos claros, medibles y coherentes con la política de SST, con metas y mecanismos de seguimiento y revisión.","expected_evidence":"Documento o matriz de objetivos y metas; indicadores; responsables; evidencia de aprobación, seguimiento, revisión y comunicación."},{"code":"2.3.1","functional_description":"Evaluación inicial del SG-SST","phva_cycle":"PLAN","criterion":"Realizar la evaluación inicial para identificar prioridades, brechas y condiciones de SST que orienten la planificación del sistema.","expected_evidence":"Evaluación inicial/autoevaluación; diagnóstico de brechas; priorización; soportes analíticos; plan de acción o mejoramiento derivado."},{"code":"2.4.1","functional_description":"Plan Anual de Trabajo","phva_cycle":"PLAN","criterion":"Formular un plan anual que identifique objetivos, metas, actividades, responsables, recursos y cronograma, firmado por las partes exigidas.","expected_evidence":"Plan anual firmado; cronograma; responsables; recursos; metas; seguimiento de ejecución y evidencias de cumplimiento."},{"code":"2.5.1","functional_description":"Archivo y retención documental del SG-SST","phva_cycle":"PLAN","criterion":"Contar con mecanismos de archivo, conservación, disponibilidad, integridad y retención de los registros y documentos del SG-SST.","expected_evidence":"Procedimiento de gestión documental; tablas de retención cuando apliquen; índice/repositorio; controles de acceso; copias de seguridad; registros conservados."},{"code":"2.6.1","functional_description":"Rendición de cuentas sobre el desempeño","phva_cycle":"PLAN","criterion":"Realizar al menos anualmente la rendición de cuentas interna sobre el desempeño del SG-SST, involucrando los niveles con responsabilidades asignadas.","expected_evidence":"Informes de rendición de cuentas; actas; presentaciones; reportes de responsables/comités; evidencia de revisión y comunicación."},{"code":"2.7.1","functional_description":"Matriz legal","phva_cycle":"PLAN","criterion":"Mantener una matriz legal actualizada con requisitos aplicables en riesgos laborales, SST y normas técnicas relacionadas con los peligros identificados.","expected_evidence":"Matriz legal vigente; fuentes normativas; fechas de actualización; responsables; evaluación de aplicabilidad y cumplimiento."},{"code":"2.8.1","functional_description":"Mecanismos de comunicación y autorreporte","phva_cycle":"PLAN","criterion":"Establecer mecanismos eficaces para comunicar asuntos de SST y permitir el reporte de condiciones, actos, peligros, incidentes y necesidades.","expected_evidence":"Procedimiento/canales de comunicación; formatos o sistema de autorreporte; registros de comunicaciones; trazabilidad de reportes y respuestas."},{"code":"2.9.1","functional_description":"Identificación y evaluación para adquisición de bienes y servicios","phva_cycle":"PLAN","criterion":"Incorporar requisitos de SST en la identificación, evaluación y adquisición de productos, bienes y servicios.","expected_evidence":"Procedimiento de compras con criterios SST; especificaciones técnicas; evaluaciones; órdenes/contratos; muestras de adquisiciones verificadas."},{"code":"2.10.1","functional_description":"Evaluación y selección de proveedores y contratistas","phva_cycle":"PLAN","criterion":"Definir y aplicar criterios de SST en la evaluación y selección de proveedores y contratistas cuando corresponda.","expected_evidence":"Criterios o matriz de evaluación; listas de chequeo; evaluaciones de proveedores/contratistas; cláusulas contractuales; soportes de seguimiento."},{"code":"2.11.1","functional_description":"Gestión del cambio","phva_cycle":"PLAN","criterion":"Evaluar el impacto en SST de cambios internos y externos y establecer controles antes o durante su implementación.","expected_evidence":"Procedimiento de gestión del cambio; evaluaciones de impacto; aprobaciones; planes de acción; actualización de matrices, procedimientos y capacitaciones."},{"code":"3.1.1","functional_description":"Perfil sociodemográfico y diagnóstico de condiciones de salud","phva_cycle":"DO","criterion":"Contar con una descripción sociodemográfica y un diagnóstico de condiciones de salud que permitan orientar acciones de promoción y prevención.","expected_evidence":"Perfil sociodemográfico agregado; diagnóstico de condiciones de salud; análisis estadístico; recomendaciones; protección de datos sensibles."},{"code":"3.1.2","functional_description":"Actividades de promoción y prevención en salud","phva_cycle":"DO","criterion":"Desarrollar actividades de medicina del trabajo, promoción y prevención de acuerdo con los riesgos y condiciones de salud identificadas.","expected_evidence":"Programas y cronogramas; campañas; registros de asistencia; informes; indicadores y evidencias de intervención."},{"code":"3.1.3","functional_description":"Información de perfiles de cargo al médico evaluador","phva_cycle":"DO","criterion":"Suministrar al prestador o médico evaluador información suficiente sobre perfiles de cargo, tareas y peligros asociados para las evaluaciones ocupacionales.","expected_evidence":"Perfiles de cargo; matrices de exposición; comunicaciones/remisiones al médico o IPS; constancias de recepción."},{"code":"3.1.4","functional_description":"Evaluaciones médicas ocupacionales","phva_cycle":"DO","criterion":"Realizar evaluaciones médicas ocupacionales según la normativa, los peligros, la exposición, el estado de salud y la periodicidad definida.","expected_evidence":"Procedimiento/programa; conceptos de aptitud; certificados de realización; periodicidad definida; remisiones; seguimiento de recomendaciones, sin almacenar historias clínicas."},{"code":"3.1.5","functional_description":"Custodia de historias clínicas ocupacionales","phva_cycle":"DO","criterion":"Garantizar que la custodia de las historias clínicas ocupacionales esté a cargo de un prestador o profesional autorizado, preservando reserva y confidencialidad.","expected_evidence":"Contrato/certificación del custodio; licencia o habilitación aplicable; procedimiento de custodia; acuerdos de confidencialidad; evidencia de entrega segura."},{"code":"3.1.6","functional_description":"Restricciones y recomendaciones médico-laborales","phva_cycle":"DO","criterion":"Implementar y hacer seguimiento a las restricciones y recomendaciones médico-laborales emitidas para los trabajadores.","expected_evidence":"Conceptos ocupacionales; planes de adaptación/reubicación; seguimientos; actas de mesas laborales; evidencias de implementación con acceso restringido."},{"code":"3.1.7","functional_description":"Estilos de vida y entorno saludable","phva_cycle":"DO","criterion":"Diseñar y ejecutar acciones para promover estilos de vida y entornos de trabajo saludables y prevenir factores de riesgo asociados.","expected_evidence":"Programa de estilos de vida saludable; campañas; políticas; actividades; registros de participación; indicadores de seguimiento."},{"code":"3.1.8","functional_description":"Servicios de higiene","phva_cycle":"DO","criterion":"Mantener suministro de agua potable, servicios sanitarios y mecanismos adecuados para disposición de excretas y basuras.","expected_evidence":"Registros de inspección; evidencia fotográfica; mantenimientos; certificados o controles de calidad de agua cuando apliquen; registros de limpieza."},{"code":"3.1.9","functional_description":"Manejo de residuos","phva_cycle":"DO","criterion":"Eliminar y gestionar residuos sólidos, líquidos, gaseosos y peligrosos de manera que no generen riesgos para los trabajadores.","expected_evidence":"Plan/procedimiento de residuos; segregación; registros de recolección; manifiestos; contratos con gestores autorizados; inspecciones."},{"code":"3.2.1","functional_description":"Reporte de accidentes de trabajo y enfermedades laborales","phva_cycle":"DO","criterion":"Reportar los accidentes de trabajo y enfermedades laborales a las entidades correspondientes y los eventos graves/mortales a la autoridad competente dentro de los plazos legales.","expected_evidence":"FURAT/FUREL; radicados ante ARL/EPS/Ministerio cuando aplique; constancias de envío; base de casos y fechas de reporte."},{"code":"3.2.2","functional_description":"Investigación de incidentes, accidentes y enfermedades laborales","phva_cycle":"DO","criterion":"Investigar incidentes, accidentes de trabajo y enfermedades laborales con el equipo y metodología exigibles, identificando causas y acciones de intervención.","expected_evidence":"Informes de investigación; análisis de causas; participación del COPASST/equipo investigador cuando aplique; acciones correctivas; firmas y soportes."},{"code":"3.2.3","functional_description":"Registro y análisis estadístico de accidentalidad y enfermedad laboral","phva_cycle":"DO","criterion":"Mantener registros estadísticos y analizar tendencias de accidentes y enfermedades laborales para orientar la mejora del SG-SST.","expected_evidence":"Base consolidada de eventos; análisis estadístico; gráficos/tendencias; conclusiones; decisiones y acciones derivadas."},{"code":"3.3.1","functional_description":"Frecuencia de accidentalidad","phva_cycle":"DO","criterion":"Medir como mínimo mensualmente la frecuencia de accidentes de trabajo y relacionarla con los peligros/riesgos que los originan.","expected_evidence":"Ficha técnica del indicador; datos fuente; cálculo mensual; resultados acumulados; análisis de tendencia y clasificación por peligro/riesgo."},{"code":"3.3.2","functional_description":"Severidad de accidentalidad","phva_cycle":"DO","criterion":"Medir como mínimo mensualmente la severidad de los accidentes de trabajo y analizar su relación con los peligros/riesgos identificados.","expected_evidence":"Ficha técnica del indicador; días perdidos/cargados y demás datos fuente; cálculo mensual; tendencia; análisis por peligro/riesgo."},{"code":"3.3.3","functional_description":"Proporción de accidentes de trabajo mortales","phva_cycle":"DO","criterion":"Medir como mínimo anualmente la proporción de accidentes de trabajo mortales y analizar su origen respecto de los peligros/riesgos.","expected_evidence":"Ficha técnica; consolidado de accidentes y fallecimientos; cálculo anual; análisis y trazabilidad de casos; registro de cero eventos si aplica."},{"code":"3.3.4","functional_description":"Prevalencia de enfermedad laboral","phva_cycle":"DO","criterion":"Medir como mínimo anualmente la prevalencia de enfermedad laboral y analizar su relación con los peligros/riesgos identificados.","expected_evidence":"Ficha técnica; base de casos existentes; población expuesta/relacionada; cálculo anual; análisis por origen del riesgo."},{"code":"3.3.5","functional_description":"Incidencia de enfermedad laboral","phva_cycle":"DO","criterion":"Medir como mínimo anualmente la incidencia de enfermedad laboral y analizar su relación con los peligros/riesgos identificados.","expected_evidence":"Ficha técnica; casos nuevos y datos poblacionales; cálculo anual; análisis por tipo de peligro/riesgo y tendencia."},{"code":"3.3.6","functional_description":"Ausentismo por causa médica","phva_cycle":"DO","criterion":"Medir como mínimo mensualmente el ausentismo por incapacidad de origen común y laboral y analizar sus causas y relación con riesgos.","expected_evidence":"Ficha técnica; consolidado de incapacidades; días de ausencia; cálculo mensual; clasificación por causa/origen; análisis de tendencia."},{"code":"4.1.1","functional_description":"Metodología para identificación de peligros, evaluación y valoración de riesgos","phva_cycle":"DO","criterion":"Definir y aplicar una metodología sistemática para identificar peligros y evaluar y valorar riesgos de todas las actividades y procesos.","expected_evidence":"Metodología documentada; matriz de peligros y riesgos vigente; criterios de valoración; control de cambios y fechas de actualización."},{"code":"4.1.2","functional_description":"Identificación de peligros con participación de todos los niveles","phva_cycle":"DO","criterion":"Realizar la identificación de peligros y evaluación/valoración de riesgos con participación de trabajadores y niveles pertinentes de la organización.","expected_evidence":"Matriz IPVR; actas/talleres; encuestas; inspecciones; reportes de trabajadores; registros de participación y actualización."},{"code":"4.1.3","functional_description":"Sustancias carcinógenas o con toxicidad aguda","phva_cycle":"DO","criterion":"Identificar sustancias o agentes carcinógenos o con toxicidad aguda, priorizar sus riesgos y ejecutar medidas específicas de prevención e intervención.","expected_evidence":"Inventario de químicos; hojas de datos de seguridad; clasificación de peligros; matriz de riesgos; almacenamiento; controles; registros de sustitución/intervención."},{"code":"4.1.4","functional_description":"Mediciones ambientales","phva_cycle":"DO","criterion":"Realizar mediciones ambientales de los riesgos prioritarios derivados de peligros físicos, químicos y/o biológicos cuando se requiera.","expected_evidence":"Informes de medición; competencia/calibración del proveedor o equipos; resultados; recomendaciones; comunicación al COPASST; planes de intervención."},{"code":"4.2.1","functional_description":"Medidas de prevención y control frente a peligros/riesgos","phva_cycle":"DO","criterion":"Implementar medidas de prevención y control conforme a la jerarquía de controles para los peligros y riesgos identificados.","expected_evidence":"Matriz de controles; planes de intervención; evidencias de eliminación/sustitución/ingeniería/administrativos/EPP; seguimiento de eficacia."},{"code":"4.2.2","functional_description":"Aplicación de medidas de prevención y control por los trabajadores","phva_cycle":"DO","criterion":"Verificar que los trabajadores apliquen las medidas de prevención y control definidas por la organización.","expected_evidence":"Inspecciones y observaciones de tarea; listas de chequeo; reportes de supervisión; registros de cumplimiento y acciones frente a desviaciones."},{"code":"4.2.3","functional_description":"Procedimientos e instructivos internos de SST","phva_cycle":"DO","criterion":"Elaborar, mantener y divulgar procedimientos, instructivos, fichas técnicas o protocolos necesarios para ejecutar trabajos de forma segura.","expected_evidence":"Procedimientos/instructivos aprobados y vigentes; control de versiones; registros de divulgación/capacitación; fichas y protocolos asociados."},{"code":"4.2.4","functional_description":"Inspecciones a instalaciones, maquinaria y equipos","phva_cycle":"DO","criterion":"Realizar inspecciones sistemáticas a instalaciones, maquinaria, equipos y elementos de emergencia con participación del COPASST.","expected_evidence":"Programa y formatos de inspección; listas de chequeo diligenciadas; actas/participación COPASST; reportes de hallazgos y seguimiento."},{"code":"4.2.5","functional_description":"Mantenimiento periódico de instalaciones, equipos, máquinas y herramientas","phva_cycle":"DO","criterion":"Ejecutar mantenimiento preventivo y correctivo según inspecciones, reportes de condiciones inseguras y recomendaciones del fabricante.","expected_evidence":"Plan de mantenimiento; órdenes de trabajo; hojas de vida de equipos; registros preventivos/correctivos; cierres de hallazgos."},{"code":"4.2.6","functional_description":"Entrega de EPP y capacitación en uso adecuado","phva_cycle":"DO","criterion":"Suministrar, reponer y controlar los EPP requeridos, capacitar en su uso y verificar el cumplimiento de contratistas y subcontratistas cuando aplique.","expected_evidence":"Matriz de EPP; actas de entrega y reposición; fichas técnicas; registros de capacitación; inspecciones de uso; soportes de contratistas."},{"code":"5.1.1","functional_description":"Plan de prevención, preparación y respuesta ante emergencias","phva_cycle":"DO","criterion":"Elaborar, implementar, divulgar y mantener un plan de emergencias acorde con amenazas, vulnerabilidad, tamaño y características de la organización.","expected_evidence":"Plan de emergencias; análisis de amenazas/vulnerabilidad; planos y rutas; inventario de recursos; simulacros; registros de divulgación y evaluación."},{"code":"5.1.2","functional_description":"Brigada de prevención, preparación y respuesta ante emergencias","phva_cycle":"DO","criterion":"Conformar, capacitar, entrenar y dotar una brigada de emergencias acorde con el nivel de riesgo y las necesidades de la organización.","expected_evidence":"Acto/listado de brigadistas; perfiles; plan de formación; certificados; registros de entrenamiento; inventario de dotación; participación en simulacros."},{"code":"6.1.1","functional_description":"Definición de indicadores del SG-SST","phva_cycle":"CHECK","criterion":"Definir y medir indicadores que permitan evaluar estructura, proceso y resultado del SG-SST, incluidos los mínimos exigidos por la Resolución.","expected_evidence":"Matriz/fichas técnicas de indicadores; metas; periodicidad; responsables; fuentes de datos; resultados e informes de análisis."},{"code":"6.1.2","functional_description":"Auditoría anual del SG-SST","phva_cycle":"CHECK","criterion":"Realizar al menos una auditoría anual de cumplimiento del SG-SST con alcance y criterios definidos y con independencia adecuada.","expected_evidence":"Programa/plan de auditoría; listas de verificación; informe; hallazgos; evidencias; plan de acciones y seguimiento."},{"code":"6.1.3","functional_description":"Revisión anual por la Alta Dirección","phva_cycle":"CHECK","criterion":"Realizar al menos una revisión anual por la Alta Dirección sobre desempeño, resultados, cumplimiento y oportunidades de mejora del SG-SST.","expected_evidence":"Acta o informe de revisión por la dirección; entradas y resultados revisados; decisiones; recursos; acciones; comunicación a responsables pertinentes."},{"code":"6.1.4","functional_description":"Planificación de la auditoría con el COPASST","phva_cycle":"CHECK","criterion":"Planificar la auditoría anual con participación del COPASST conforme a su rol dentro del SG-SST.","expected_evidence":"Acta de planificación; plan/programa de auditoría; evidencia de participación del COPASST; comunicaciones y soportes de acompañamiento."},{"code":"7.1.1","functional_description":"Acciones preventivas y/o correctivas","phva_cycle":"ACT","criterion":"Definir e implementar acciones preventivas y correctivas a partir de supervisión, inspecciones, indicadores, hallazgos y recomendaciones del COPASST.","expected_evidence":"Registro de acciones; análisis de causa; responsables y plazos; soportes de implementación; verificación de cierre y eficacia."},{"code":"7.1.2","functional_description":"Acciones de mejora derivadas de la revisión por la Alta Dirección","phva_cycle":"ACT","criterion":"Implementar acciones correctivas, preventivas o de mejora cuando la revisión de la Alta Dirección evidencie controles inadecuados o oportunidades de mejora.","expected_evidence":"Plan de acciones derivado de la revisión; responsables; fechas; evidencias de implementación; seguimiento y evaluación de eficacia."},{"code":"7.1.3","functional_description":"Acciones de mejora derivadas de investigaciones de AT y EL","phva_cycle":"ACT","criterion":"Implementar acciones preventivas y correctivas basadas en las causas identificadas en investigaciones de accidentes de trabajo y enfermedades laborales.","expected_evidence":"Planes de acción vinculados a investigaciones; responsables; fechas; soportes de cierre; verificación de eficacia."},{"code":"7.1.4","functional_description":"Plan de mejoramiento por requerimientos de autoridades o ARL","phva_cycle":"ACT","criterion":"Implementar medidas y acciones correctivas derivadas de requerimientos o recomendaciones de autoridades administrativas y administradoras de riesgos laborales.","expected_evidence":"Requerimientos/recomendaciones recibidos; plan de mejoramiento; evidencias de ejecución; respuestas formales; cierres y seguimiento."}]$standards$::jsonb
    ) as x(
      code text,
      functional_description text,
      phva_cycle text,
      criterion text,
      expected_evidence text
    )
  )
  insert into public.minimum_standards(
    normative_source_version_id,
    code,
    functional_description,
    phva_cycle,
    criterion,
    expected_evidence,
    effective_from,
    status,
    expert_review_status
  )
  select
    v_source_version_id,
    x.code,
    x.functional_description,
    x.phva_cycle,
    x.criterion,
    x.expected_evidence,
    date '2019-02-13',
    'draft',
    'pending'
  from inventory x
  on conflict (normative_source_version_id, code) do nothing;

  with profiles as (
    select *
    from jsonb_to_recordset(
      $profiles$[{"code":"RES0312_P07","source_code":"RES0312-P07","name":"Hasta 10 trabajadores - Riesgo I, II o III (7 estándares)","version_code":"1.0.0","applicability_rule":"Empresas, empleadores y contratantes con 10 o menos trabajadores, clase de riesgo I, II o III.","normative_basis":"Art. 3","expected_count":7,"official_weight_total":12.5,"weighting_method":"Normalización interna proporcional al valor oficial del art. 27."},{"code":"RES0312_P21","source_code":"RES0312-P21","name":"11 a 50 trabajadores - Riesgo I, II o III (21 estándares)","version_code":"1.0.0","applicability_rule":"Empresas de 11 a 50 trabajadores, clase de riesgo I, II o III.","normative_basis":"Art. 9","expected_count":21,"official_weight_total":37.75,"weighting_method":"Normalización interna proporcional al valor oficial del art. 27."},{"code":"RES0312_P60","source_code":"RES0312-P60","name":"Perfil integral - 60 estándares","version_code":"1.0.0","applicability_rule":"Más de 50 trabajadores en riesgo I-V, o 50 o menos trabajadores en riesgo IV o V.","normative_basis":"Art. 16","expected_count":60,"official_weight_total":100,"weighting_method":"Valor oficial del art. 27; no requiere normalización."}]$profiles$::jsonb
    ) as x(
      code text,
      source_code text,
      name text,
      version_code text,
      applicability_rule text,
      normative_basis text,
      expected_count integer,
      official_weight_total numeric,
      weighting_method text
    )
  )
  insert into public.standard_profiles(code, name, description, status)
  select
    x.code,
    x.name,
    concat(
      x.applicability_rule,
      ' Base indicada: ',
      x.normative_basis,
      '. Código de origen: ',
      x.source_code,
      '. Método de ponderación: ',
      x.weighting_method
    ),
    'draft'
  from profiles x
  on conflict (code) do nothing;

  with profiles as (
    select *
    from jsonb_to_recordset(
      $profiles$[{"code":"RES0312_P07","source_code":"RES0312-P07","name":"Hasta 10 trabajadores - Riesgo I, II o III (7 estándares)","version_code":"1.0.0","applicability_rule":"Empresas, empleadores y contratantes con 10 o menos trabajadores, clase de riesgo I, II o III.","normative_basis":"Art. 3","expected_count":7,"official_weight_total":12.5,"weighting_method":"Normalización interna proporcional al valor oficial del art. 27."},{"code":"RES0312_P21","source_code":"RES0312-P21","name":"11 a 50 trabajadores - Riesgo I, II o III (21 estándares)","version_code":"1.0.0","applicability_rule":"Empresas de 11 a 50 trabajadores, clase de riesgo I, II o III.","normative_basis":"Art. 9","expected_count":21,"official_weight_total":37.75,"weighting_method":"Normalización interna proporcional al valor oficial del art. 27."},{"code":"RES0312_P60","source_code":"RES0312-P60","name":"Perfil integral - 60 estándares","version_code":"1.0.0","applicability_rule":"Más de 50 trabajadores en riesgo I-V, o 50 o menos trabajadores en riesgo IV o V.","normative_basis":"Art. 16","expected_count":60,"official_weight_total":100,"weighting_method":"Valor oficial del art. 27; no requiere normalización."}]$profiles$::jsonb
    ) as x(
      code text,
      source_code text,
      name text,
      version_code text,
      applicability_rule text,
      normative_basis text,
      expected_count integer,
      official_weight_total numeric,
      weighting_method text
    )
  )
  insert into public.standard_profile_versions(
    standard_profile_id,
    version_code,
    status,
    expert_review_status
  )
  select p.id, x.version_code, 'draft', 'pending'
  from profiles x
  join public.standard_profiles p on p.code = x.code
  on conflict (standard_profile_id, version_code) do nothing;

  with links as (
    select *
    from jsonb_to_recordset(
      $links$[{"profile_code":"RES0312_P07","version_code":"1.0.0","standard_code":"1.1.1","weight":4},{"profile_code":"RES0312_P07","version_code":"1.0.0","standard_code":"1.1.4","weight":4},{"profile_code":"RES0312_P07","version_code":"1.0.0","standard_code":"1.2.1","weight":16},{"profile_code":"RES0312_P07","version_code":"1.0.0","standard_code":"2.4.1","weight":16},{"profile_code":"RES0312_P07","version_code":"1.0.0","standard_code":"3.1.4","weight":8},{"profile_code":"RES0312_P07","version_code":"1.0.0","standard_code":"4.1.1","weight":32},{"profile_code":"RES0312_P07","version_code":"1.0.0","standard_code":"4.2.1","weight":20},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"1.1.1","weight":1.32},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"1.1.3","weight":1.32},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"1.1.4","weight":1.32},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"1.1.6","weight":1.32},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"1.1.8","weight":1.32},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"1.2.1","weight":5.3},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"2.1.1","weight":2.65},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"2.4.1","weight":5.3},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"2.5.1","weight":5.3},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"3.1.1","weight":2.65},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"3.1.2","weight":2.65},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"3.1.4","weight":2.65},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"3.1.6","weight":2.65},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"3.2.1","weight":5.3},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"3.2.2","weight":5.3},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"4.1.1","weight":10.6},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"4.2.5","weight":6.62},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"4.2.6","weight":6.62},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"5.1.1","weight":13.25},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"5.1.2","weight":13.25},{"profile_code":"RES0312_P21","version_code":"1.0.0","standard_code":"6.1.3","weight":3.31},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"1.1.1","weight":0.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"1.1.2","weight":0.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"1.1.3","weight":0.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"1.1.4","weight":0.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"1.1.5","weight":0.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"1.1.6","weight":0.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"1.1.7","weight":0.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"1.1.8","weight":0.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"1.2.1","weight":2},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"1.2.2","weight":2},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"1.2.3","weight":2},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"2.1.1","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"2.2.1","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"2.3.1","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"2.4.1","weight":2},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"2.5.1","weight":2},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"2.6.1","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"2.7.1","weight":2},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"2.8.1","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"2.9.1","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"2.10.1","weight":2},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"2.11.1","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.1.1","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.1.2","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.1.3","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.1.4","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.1.5","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.1.6","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.1.7","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.1.8","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.1.9","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.2.1","weight":2},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.2.2","weight":2},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.2.3","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.3.1","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.3.2","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.3.3","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.3.4","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.3.5","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"3.3.6","weight":1},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"4.1.1","weight":4},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"4.1.2","weight":4},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"4.1.3","weight":3},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"4.1.4","weight":4},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"4.2.1","weight":2.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"4.2.2","weight":2.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"4.2.3","weight":2.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"4.2.4","weight":2.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"4.2.5","weight":2.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"4.2.6","weight":2.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"5.1.1","weight":5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"5.1.2","weight":5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"6.1.1","weight":1.25},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"6.1.2","weight":1.25},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"6.1.3","weight":1.25},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"6.1.4","weight":1.25},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"7.1.1","weight":2.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"7.1.2","weight":2.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"7.1.3","weight":2.5},{"profile_code":"RES0312_P60","version_code":"1.0.0","standard_code":"7.1.4","weight":2.5}]$links$::jsonb
    ) as x(
      profile_code text,
      version_code text,
      standard_code text,
      weight numeric
    )
  )
  insert into public.profile_standards(
    standard_profile_version_id,
    minimum_standard_id,
    weight
  )
  select
    pv.id,
    ms.id,
    x.weight
  from links x
  join public.standard_profiles p on p.code = x.profile_code
  join public.standard_profile_versions pv
    on pv.standard_profile_id = p.id
   and pv.version_code = x.version_code
  join public.minimum_standards ms
    on ms.normative_source_version_id = v_source_version_id
   and ms.code = x.standard_code
  on conflict (standard_profile_version_id, minimum_standard_id) do nothing;

  insert into public.assessment_scoring_rules(
    code,
    version_number,
    standard_profile_version_id,
    response_multipliers,
    status,
    expert_review_status
  )
  select
    p.code || '_SCORING',
    1,
    pv.id,
    jsonb_build_object(
      'met', 100,
      'not_met', 0,
      'not_applicable', 0,
      'review_required', 0,
      'pending', 0
    ),
    'draft',
    'pending'
  from public.standard_profiles p
  join public.standard_profile_versions pv on pv.standard_profile_id = p.id
  where p.code in ('RES0312_P07','RES0312_P21','RES0312_P60')
    and pv.version_code = '1.0.0'
  on conflict (code, version_number) do nothing;

  insert into public.normative_review_artifacts(
    artifact_type,
    artifact_key,
    title,
    content_snapshot,
    minimum_standard_id,
    created_by
  )
  select
    'MINIMUM_STANDARD',
    'minimum-standard:' || ms.id,
    ms.code || ' · ' || ms.functional_description,
    to_jsonb(ms) || jsonb_build_object(
      'import_source', 'inventario_estandares_resolucion_0312_con_perfiles.xlsx',
      'source_sha256', 'F3700F103B53D03EAB076B185084B5DF0F2D5FFEA463FAD5F25C1BCEBC153C57'
    ),
    ms.id,
    v_actor
  from public.minimum_standards ms
  where ms.normative_source_version_id = v_source_version_id
    and not exists(
      select 1
      from public.normative_review_artifacts a
      where a.minimum_standard_id = ms.id
    );

  insert into public.normative_review_artifacts(
    artifact_type,
    artifact_key,
    title,
    content_snapshot,
    standard_profile_version_id,
    created_by
  )
  select
    'STANDARD_PROFILE_VERSION',
    'standard-profile-version:' || pv.id,
    p.code || ' · ' || pv.version_code,
    to_jsonb(pv) || jsonb_build_object(
      'profile', to_jsonb(p),
      'import_source', 'inventario_estandares_resolucion_0312_con_perfiles.xlsx',
      'source_sha256', 'F3700F103B53D03EAB076B185084B5DF0F2D5FFEA463FAD5F25C1BCEBC153C57'
    ),
    pv.id,
    v_actor
  from public.standard_profile_versions pv
  join public.standard_profiles p on p.id = pv.standard_profile_id
  where p.code in ('RES0312_P07','RES0312_P21','RES0312_P60')
    and pv.version_code = '1.0.0'
    and not exists(
      select 1
      from public.normative_review_artifacts a
      where a.standard_profile_version_id = pv.id
    );

  insert into public.normative_review_artifacts(
    artifact_type,
    artifact_key,
    title,
    content_snapshot,
    profile_standard_id,
    created_by
  )
  select
    'PROFILE_STANDARD',
    'profile-standard:' || ps.id,
    p.code || ' · ' || ms.code,
    to_jsonb(ps) || jsonb_build_object(
      'profile_code', p.code,
      'standard_code', ms.code,
      'import_source', 'inventario_estandares_resolucion_0312_con_perfiles.xlsx',
      'source_sha256', 'F3700F103B53D03EAB076B185084B5DF0F2D5FFEA463FAD5F25C1BCEBC153C57'
    ),
    ps.id,
    v_actor
  from public.profile_standards ps
  join public.standard_profile_versions pv on pv.id = ps.standard_profile_version_id
  join public.standard_profiles p on p.id = pv.standard_profile_id
  join public.minimum_standards ms on ms.id = ps.minimum_standard_id
  where p.code in ('RES0312_P07','RES0312_P21','RES0312_P60')
    and pv.version_code = '1.0.0'
    and not exists(
      select 1
      from public.normative_review_artifacts a
      where a.profile_standard_id = ps.id
    );

  insert into public.normative_review_artifacts(
    artifact_type,
    artifact_key,
    title,
    content_snapshot,
    assessment_scoring_rule_id,
    created_by
  )
  select
    'ASSESSMENT_SCORING_RULE',
    'scoring-rule:' || r.id,
    r.code || ' v' || r.version_number,
    to_jsonb(r) || jsonb_build_object(
      'draft_notice', 'Technical draft pending expert review; it does not declare legal validity.',
      'import_source', 'inventario_estandares_resolucion_0312_con_perfiles.xlsx',
      'source_sha256', 'F3700F103B53D03EAB076B185084B5DF0F2D5FFEA463FAD5F25C1BCEBC153C57'
    ),
    r.id,
    v_actor
  from public.assessment_scoring_rules r
  where r.code in (
    'RES0312_P07_SCORING',
    'RES0312_P21_SCORING',
    'RES0312_P60_SCORING'
  )
    and r.version_number = 1
    and not exists(
      select 1
      from public.normative_review_artifacts a
      where a.assessment_scoring_rule_id = r.id
    );

  if (
    select count(*)
    from public.minimum_standards
    where normative_source_version_id = v_source_version_id
      and code in (
        select x.code
        from jsonb_to_recordset(
          $standards$[{"code":"1.1.1","functional_description":"Responsable del SG-SST","phva_cycle":"PLAN","criterion":"Asignar una persona competente para diseñar e implementar el SG-SST, con el perfil, licencia y formación exigibles según el tipo de empresa.","expected_evidence":"Acto o documento de designación; responsabilidades asignadas; hoja de vida; licencia SST cuando aplique; certificado del curso obligatorio."},{"code":"1.1.2","functional_description":"Responsabilidades en el SG-SST","phva_cycle":"PLAN","criterion":"Asignar y documentar responsabilidades específicas en SST a todos los niveles de la organización para el desarrollo y mejora continua del sistema.","expected_evidence":"Matriz o documento de responsabilidades; manuales/perfiles de cargo; actos internos; evidencia de comunicación o socialización."},{"code":"1.1.3","functional_description":"Asignación de recursos para el SG-SST","phva_cycle":"PLAN","criterion":"Definir y asignar recursos humanos, financieros, técnicos y físicos suficientes para implementar, mantener y mejorar el SG-SST.","expected_evidence":"Presupuesto aprobado; plan de recursos; contratos/órdenes; asignaciones de personal; soportes de disponibilidad de medios e infraestructura."},{"code":"1.1.4","functional_description":"Afiliación al Sistema General de Seguridad Social Integral","phva_cycle":"PLAN","criterion":"Garantizar la afiliación y pago al sistema de salud, pensión y riesgos laborales de los trabajadores conforme a su modalidad de vinculación.","expected_evidence":"Listado de trabajadores; certificados de afiliación; planillas PILA y comprobantes de pago de los periodos objeto de verificación."},{"code":"1.1.5","functional_description":"Trabajadores de alto riesgo y pensión especial","phva_cycle":"PLAN","criterion":"Identificar trabajadores que desarrollan actividades de alto riesgo y efectuar la cotización especial a pensión cuando corresponda.","expected_evidence":"Inventario de cargos/actividades de alto riesgo; soportes de clasificación; planillas PILA con cotización especial; justificación de no aplicabilidad si procede."},{"code":"1.1.6","functional_description":"Conformación y funcionamiento del COPASST","phva_cycle":"PLAN","criterion":"Conformar y asegurar el funcionamiento del COPASST de acuerdo con la normativa aplicable.","expected_evidence":"Convocatoria y elección; acta de conformación; designaciones; cronograma; actas de reunión; evidencias de funcionamiento."},{"code":"1.1.7","functional_description":"Capacitación de integrantes del COPASST","phva_cycle":"PLAN","criterion":"Capacitar a los integrantes del COPASST para el cumplimiento efectivo de sus funciones y responsabilidades.","expected_evidence":"Plan o temario de capacitación; listas de asistencia; certificados; evaluaciones; actas o registros de actividades formativas."},{"code":"1.1.8","functional_description":"Conformación y funcionamiento del Comité de Convivencia Laboral","phva_cycle":"PLAN","criterion":"Conformar y asegurar el funcionamiento del Comité de Convivencia Laboral conforme a la regulación vigente.","expected_evidence":"Convocatoria/elección o designación; acta de conformación; reglamento o procedimiento; actas de reunión y soportes de gestión."},{"code":"1.2.1","functional_description":"Programa anual de capacitación en promoción y prevención","phva_cycle":"PLAN","criterion":"Elaborar y ejecutar un programa anual de capacitación que cubra peligros/riesgos prioritarios y medidas de prevención y control para todos los niveles.","expected_evidence":"Programa anual aprobado; cronograma; contenidos; listas de asistencia; evaluaciones; certificados y evidencias de ejecución."},{"code":"1.2.2","functional_description":"Inducción y reinducción en SST","phva_cycle":"PLAN","criterion":"Realizar inducción y reinducción en SST a trabajadores y demás personal aplicable antes o durante el desarrollo de sus labores, según corresponda.","expected_evidence":"Programa y material de inducción/reinducción; registros de asistencia; evaluaciones; constancias de realización por persona."},{"code":"1.2.3","functional_description":"Curso virtual de capacitación de 50 horas en SST","phva_cycle":"PLAN","criterion":"Asegurar que el responsable del SG-SST cuente con el curso virtual de capacitación exigido por el Ministerio del Trabajo.","expected_evidence":"Certificado vigente o válido de aprobación del curso obligatorio expedido a nombre del responsable."},{"code":"2.1.1","functional_description":"Política de Seguridad y Salud en el Trabajo","phva_cycle":"PLAN","criterion":"Mantener una política de SST documentada, aprobada, firmada, fechada, comunicada y coherente con los riesgos y objetivos del SG-SST.","expected_evidence":"Política firmada y fechada; evidencia de publicación/socialización; comunicación al COPASST; control de versión y revisión."},{"code":"2.2.1","functional_description":"Objetivos del SG-SST","phva_cycle":"PLAN","criterion":"Definir objetivos claros, medibles y coherentes con la política de SST, con metas y mecanismos de seguimiento y revisión.","expected_evidence":"Documento o matriz de objetivos y metas; indicadores; responsables; evidencia de aprobación, seguimiento, revisión y comunicación."},{"code":"2.3.1","functional_description":"Evaluación inicial del SG-SST","phva_cycle":"PLAN","criterion":"Realizar la evaluación inicial para identificar prioridades, brechas y condiciones de SST que orienten la planificación del sistema.","expected_evidence":"Evaluación inicial/autoevaluación; diagnóstico de brechas; priorización; soportes analíticos; plan de acción o mejoramiento derivado."},{"code":"2.4.1","functional_description":"Plan Anual de Trabajo","phva_cycle":"PLAN","criterion":"Formular un plan anual que identifique objetivos, metas, actividades, responsables, recursos y cronograma, firmado por las partes exigidas.","expected_evidence":"Plan anual firmado; cronograma; responsables; recursos; metas; seguimiento de ejecución y evidencias de cumplimiento."},{"code":"2.5.1","functional_description":"Archivo y retención documental del SG-SST","phva_cycle":"PLAN","criterion":"Contar con mecanismos de archivo, conservación, disponibilidad, integridad y retención de los registros y documentos del SG-SST.","expected_evidence":"Procedimiento de gestión documental; tablas de retención cuando apliquen; índice/repositorio; controles de acceso; copias de seguridad; registros conservados."},{"code":"2.6.1","functional_description":"Rendición de cuentas sobre el desempeño","phva_cycle":"PLAN","criterion":"Realizar al menos anualmente la rendición de cuentas interna sobre el desempeño del SG-SST, involucrando los niveles con responsabilidades asignadas.","expected_evidence":"Informes de rendición de cuentas; actas; presentaciones; reportes de responsables/comités; evidencia de revisión y comunicación."},{"code":"2.7.1","functional_description":"Matriz legal","phva_cycle":"PLAN","criterion":"Mantener una matriz legal actualizada con requisitos aplicables en riesgos laborales, SST y normas técnicas relacionadas con los peligros identificados.","expected_evidence":"Matriz legal vigente; fuentes normativas; fechas de actualización; responsables; evaluación de aplicabilidad y cumplimiento."},{"code":"2.8.1","functional_description":"Mecanismos de comunicación y autorreporte","phva_cycle":"PLAN","criterion":"Establecer mecanismos eficaces para comunicar asuntos de SST y permitir el reporte de condiciones, actos, peligros, incidentes y necesidades.","expected_evidence":"Procedimiento/canales de comunicación; formatos o sistema de autorreporte; registros de comunicaciones; trazabilidad de reportes y respuestas."},{"code":"2.9.1","functional_description":"Identificación y evaluación para adquisición de bienes y servicios","phva_cycle":"PLAN","criterion":"Incorporar requisitos de SST en la identificación, evaluación y adquisición de productos, bienes y servicios.","expected_evidence":"Procedimiento de compras con criterios SST; especificaciones técnicas; evaluaciones; órdenes/contratos; muestras de adquisiciones verificadas."},{"code":"2.10.1","functional_description":"Evaluación y selección de proveedores y contratistas","phva_cycle":"PLAN","criterion":"Definir y aplicar criterios de SST en la evaluación y selección de proveedores y contratistas cuando corresponda.","expected_evidence":"Criterios o matriz de evaluación; listas de chequeo; evaluaciones de proveedores/contratistas; cláusulas contractuales; soportes de seguimiento."},{"code":"2.11.1","functional_description":"Gestión del cambio","phva_cycle":"PLAN","criterion":"Evaluar el impacto en SST de cambios internos y externos y establecer controles antes o durante su implementación.","expected_evidence":"Procedimiento de gestión del cambio; evaluaciones de impacto; aprobaciones; planes de acción; actualización de matrices, procedimientos y capacitaciones."},{"code":"3.1.1","functional_description":"Perfil sociodemográfico y diagnóstico de condiciones de salud","phva_cycle":"DO","criterion":"Contar con una descripción sociodemográfica y un diagnóstico de condiciones de salud que permitan orientar acciones de promoción y prevención.","expected_evidence":"Perfil sociodemográfico agregado; diagnóstico de condiciones de salud; análisis estadístico; recomendaciones; protección de datos sensibles."},{"code":"3.1.2","functional_description":"Actividades de promoción y prevención en salud","phva_cycle":"DO","criterion":"Desarrollar actividades de medicina del trabajo, promoción y prevención de acuerdo con los riesgos y condiciones de salud identificadas.","expected_evidence":"Programas y cronogramas; campañas; registros de asistencia; informes; indicadores y evidencias de intervención."},{"code":"3.1.3","functional_description":"Información de perfiles de cargo al médico evaluador","phva_cycle":"DO","criterion":"Suministrar al prestador o médico evaluador información suficiente sobre perfiles de cargo, tareas y peligros asociados para las evaluaciones ocupacionales.","expected_evidence":"Perfiles de cargo; matrices de exposición; comunicaciones/remisiones al médico o IPS; constancias de recepción."},{"code":"3.1.4","functional_description":"Evaluaciones médicas ocupacionales","phva_cycle":"DO","criterion":"Realizar evaluaciones médicas ocupacionales según la normativa, los peligros, la exposición, el estado de salud y la periodicidad definida.","expected_evidence":"Procedimiento/programa; conceptos de aptitud; certificados de realización; periodicidad definida; remisiones; seguimiento de recomendaciones, sin almacenar historias clínicas."},{"code":"3.1.5","functional_description":"Custodia de historias clínicas ocupacionales","phva_cycle":"DO","criterion":"Garantizar que la custodia de las historias clínicas ocupacionales esté a cargo de un prestador o profesional autorizado, preservando reserva y confidencialidad.","expected_evidence":"Contrato/certificación del custodio; licencia o habilitación aplicable; procedimiento de custodia; acuerdos de confidencialidad; evidencia de entrega segura."},{"code":"3.1.6","functional_description":"Restricciones y recomendaciones médico-laborales","phva_cycle":"DO","criterion":"Implementar y hacer seguimiento a las restricciones y recomendaciones médico-laborales emitidas para los trabajadores.","expected_evidence":"Conceptos ocupacionales; planes de adaptación/reubicación; seguimientos; actas de mesas laborales; evidencias de implementación con acceso restringido."},{"code":"3.1.7","functional_description":"Estilos de vida y entorno saludable","phva_cycle":"DO","criterion":"Diseñar y ejecutar acciones para promover estilos de vida y entornos de trabajo saludables y prevenir factores de riesgo asociados.","expected_evidence":"Programa de estilos de vida saludable; campañas; políticas; actividades; registros de participación; indicadores de seguimiento."},{"code":"3.1.8","functional_description":"Servicios de higiene","phva_cycle":"DO","criterion":"Mantener suministro de agua potable, servicios sanitarios y mecanismos adecuados para disposición de excretas y basuras.","expected_evidence":"Registros de inspección; evidencia fotográfica; mantenimientos; certificados o controles de calidad de agua cuando apliquen; registros de limpieza."},{"code":"3.1.9","functional_description":"Manejo de residuos","phva_cycle":"DO","criterion":"Eliminar y gestionar residuos sólidos, líquidos, gaseosos y peligrosos de manera que no generen riesgos para los trabajadores.","expected_evidence":"Plan/procedimiento de residuos; segregación; registros de recolección; manifiestos; contratos con gestores autorizados; inspecciones."},{"code":"3.2.1","functional_description":"Reporte de accidentes de trabajo y enfermedades laborales","phva_cycle":"DO","criterion":"Reportar los accidentes de trabajo y enfermedades laborales a las entidades correspondientes y los eventos graves/mortales a la autoridad competente dentro de los plazos legales.","expected_evidence":"FURAT/FUREL; radicados ante ARL/EPS/Ministerio cuando aplique; constancias de envío; base de casos y fechas de reporte."},{"code":"3.2.2","functional_description":"Investigación de incidentes, accidentes y enfermedades laborales","phva_cycle":"DO","criterion":"Investigar incidentes, accidentes de trabajo y enfermedades laborales con el equipo y metodología exigibles, identificando causas y acciones de intervención.","expected_evidence":"Informes de investigación; análisis de causas; participación del COPASST/equipo investigador cuando aplique; acciones correctivas; firmas y soportes."},{"code":"3.2.3","functional_description":"Registro y análisis estadístico de accidentalidad y enfermedad laboral","phva_cycle":"DO","criterion":"Mantener registros estadísticos y analizar tendencias de accidentes y enfermedades laborales para orientar la mejora del SG-SST.","expected_evidence":"Base consolidada de eventos; análisis estadístico; gráficos/tendencias; conclusiones; decisiones y acciones derivadas."},{"code":"3.3.1","functional_description":"Frecuencia de accidentalidad","phva_cycle":"DO","criterion":"Medir como mínimo mensualmente la frecuencia de accidentes de trabajo y relacionarla con los peligros/riesgos que los originan.","expected_evidence":"Ficha técnica del indicador; datos fuente; cálculo mensual; resultados acumulados; análisis de tendencia y clasificación por peligro/riesgo."},{"code":"3.3.2","functional_description":"Severidad de accidentalidad","phva_cycle":"DO","criterion":"Medir como mínimo mensualmente la severidad de los accidentes de trabajo y analizar su relación con los peligros/riesgos identificados.","expected_evidence":"Ficha técnica del indicador; días perdidos/cargados y demás datos fuente; cálculo mensual; tendencia; análisis por peligro/riesgo."},{"code":"3.3.3","functional_description":"Proporción de accidentes de trabajo mortales","phva_cycle":"DO","criterion":"Medir como mínimo anualmente la proporción de accidentes de trabajo mortales y analizar su origen respecto de los peligros/riesgos.","expected_evidence":"Ficha técnica; consolidado de accidentes y fallecimientos; cálculo anual; análisis y trazabilidad de casos; registro de cero eventos si aplica."},{"code":"3.3.4","functional_description":"Prevalencia de enfermedad laboral","phva_cycle":"DO","criterion":"Medir como mínimo anualmente la prevalencia de enfermedad laboral y analizar su relación con los peligros/riesgos identificados.","expected_evidence":"Ficha técnica; base de casos existentes; población expuesta/relacionada; cálculo anual; análisis por origen del riesgo."},{"code":"3.3.5","functional_description":"Incidencia de enfermedad laboral","phva_cycle":"DO","criterion":"Medir como mínimo anualmente la incidencia de enfermedad laboral y analizar su relación con los peligros/riesgos identificados.","expected_evidence":"Ficha técnica; casos nuevos y datos poblacionales; cálculo anual; análisis por tipo de peligro/riesgo y tendencia."},{"code":"3.3.6","functional_description":"Ausentismo por causa médica","phva_cycle":"DO","criterion":"Medir como mínimo mensualmente el ausentismo por incapacidad de origen común y laboral y analizar sus causas y relación con riesgos.","expected_evidence":"Ficha técnica; consolidado de incapacidades; días de ausencia; cálculo mensual; clasificación por causa/origen; análisis de tendencia."},{"code":"4.1.1","functional_description":"Metodología para identificación de peligros, evaluación y valoración de riesgos","phva_cycle":"DO","criterion":"Definir y aplicar una metodología sistemática para identificar peligros y evaluar y valorar riesgos de todas las actividades y procesos.","expected_evidence":"Metodología documentada; matriz de peligros y riesgos vigente; criterios de valoración; control de cambios y fechas de actualización."},{"code":"4.1.2","functional_description":"Identificación de peligros con participación de todos los niveles","phva_cycle":"DO","criterion":"Realizar la identificación de peligros y evaluación/valoración de riesgos con participación de trabajadores y niveles pertinentes de la organización.","expected_evidence":"Matriz IPVR; actas/talleres; encuestas; inspecciones; reportes de trabajadores; registros de participación y actualización."},{"code":"4.1.3","functional_description":"Sustancias carcinógenas o con toxicidad aguda","phva_cycle":"DO","criterion":"Identificar sustancias o agentes carcinógenos o con toxicidad aguda, priorizar sus riesgos y ejecutar medidas específicas de prevención e intervención.","expected_evidence":"Inventario de químicos; hojas de datos de seguridad; clasificación de peligros; matriz de riesgos; almacenamiento; controles; registros de sustitución/intervención."},{"code":"4.1.4","functional_description":"Mediciones ambientales","phva_cycle":"DO","criterion":"Realizar mediciones ambientales de los riesgos prioritarios derivados de peligros físicos, químicos y/o biológicos cuando se requiera.","expected_evidence":"Informes de medición; competencia/calibración del proveedor o equipos; resultados; recomendaciones; comunicación al COPASST; planes de intervención."},{"code":"4.2.1","functional_description":"Medidas de prevención y control frente a peligros/riesgos","phva_cycle":"DO","criterion":"Implementar medidas de prevención y control conforme a la jerarquía de controles para los peligros y riesgos identificados.","expected_evidence":"Matriz de controles; planes de intervención; evidencias de eliminación/sustitución/ingeniería/administrativos/EPP; seguimiento de eficacia."},{"code":"4.2.2","functional_description":"Aplicación de medidas de prevención y control por los trabajadores","phva_cycle":"DO","criterion":"Verificar que los trabajadores apliquen las medidas de prevención y control definidas por la organización.","expected_evidence":"Inspecciones y observaciones de tarea; listas de chequeo; reportes de supervisión; registros de cumplimiento y acciones frente a desviaciones."},{"code":"4.2.3","functional_description":"Procedimientos e instructivos internos de SST","phva_cycle":"DO","criterion":"Elaborar, mantener y divulgar procedimientos, instructivos, fichas técnicas o protocolos necesarios para ejecutar trabajos de forma segura.","expected_evidence":"Procedimientos/instructivos aprobados y vigentes; control de versiones; registros de divulgación/capacitación; fichas y protocolos asociados."},{"code":"4.2.4","functional_description":"Inspecciones a instalaciones, maquinaria y equipos","phva_cycle":"DO","criterion":"Realizar inspecciones sistemáticas a instalaciones, maquinaria, equipos y elementos de emergencia con participación del COPASST.","expected_evidence":"Programa y formatos de inspección; listas de chequeo diligenciadas; actas/participación COPASST; reportes de hallazgos y seguimiento."},{"code":"4.2.5","functional_description":"Mantenimiento periódico de instalaciones, equipos, máquinas y herramientas","phva_cycle":"DO","criterion":"Ejecutar mantenimiento preventivo y correctivo según inspecciones, reportes de condiciones inseguras y recomendaciones del fabricante.","expected_evidence":"Plan de mantenimiento; órdenes de trabajo; hojas de vida de equipos; registros preventivos/correctivos; cierres de hallazgos."},{"code":"4.2.6","functional_description":"Entrega de EPP y capacitación en uso adecuado","phva_cycle":"DO","criterion":"Suministrar, reponer y controlar los EPP requeridos, capacitar en su uso y verificar el cumplimiento de contratistas y subcontratistas cuando aplique.","expected_evidence":"Matriz de EPP; actas de entrega y reposición; fichas técnicas; registros de capacitación; inspecciones de uso; soportes de contratistas."},{"code":"5.1.1","functional_description":"Plan de prevención, preparación y respuesta ante emergencias","phva_cycle":"DO","criterion":"Elaborar, implementar, divulgar y mantener un plan de emergencias acorde con amenazas, vulnerabilidad, tamaño y características de la organización.","expected_evidence":"Plan de emergencias; análisis de amenazas/vulnerabilidad; planos y rutas; inventario de recursos; simulacros; registros de divulgación y evaluación."},{"code":"5.1.2","functional_description":"Brigada de prevención, preparación y respuesta ante emergencias","phva_cycle":"DO","criterion":"Conformar, capacitar, entrenar y dotar una brigada de emergencias acorde con el nivel de riesgo y las necesidades de la organización.","expected_evidence":"Acto/listado de brigadistas; perfiles; plan de formación; certificados; registros de entrenamiento; inventario de dotación; participación en simulacros."},{"code":"6.1.1","functional_description":"Definición de indicadores del SG-SST","phva_cycle":"CHECK","criterion":"Definir y medir indicadores que permitan evaluar estructura, proceso y resultado del SG-SST, incluidos los mínimos exigidos por la Resolución.","expected_evidence":"Matriz/fichas técnicas de indicadores; metas; periodicidad; responsables; fuentes de datos; resultados e informes de análisis."},{"code":"6.1.2","functional_description":"Auditoría anual del SG-SST","phva_cycle":"CHECK","criterion":"Realizar al menos una auditoría anual de cumplimiento del SG-SST con alcance y criterios definidos y con independencia adecuada.","expected_evidence":"Programa/plan de auditoría; listas de verificación; informe; hallazgos; evidencias; plan de acciones y seguimiento."},{"code":"6.1.3","functional_description":"Revisión anual por la Alta Dirección","phva_cycle":"CHECK","criterion":"Realizar al menos una revisión anual por la Alta Dirección sobre desempeño, resultados, cumplimiento y oportunidades de mejora del SG-SST.","expected_evidence":"Acta o informe de revisión por la dirección; entradas y resultados revisados; decisiones; recursos; acciones; comunicación a responsables pertinentes."},{"code":"6.1.4","functional_description":"Planificación de la auditoría con el COPASST","phva_cycle":"CHECK","criterion":"Planificar la auditoría anual con participación del COPASST conforme a su rol dentro del SG-SST.","expected_evidence":"Acta de planificación; plan/programa de auditoría; evidencia de participación del COPASST; comunicaciones y soportes de acompañamiento."},{"code":"7.1.1","functional_description":"Acciones preventivas y/o correctivas","phva_cycle":"ACT","criterion":"Definir e implementar acciones preventivas y correctivas a partir de supervisión, inspecciones, indicadores, hallazgos y recomendaciones del COPASST.","expected_evidence":"Registro de acciones; análisis de causa; responsables y plazos; soportes de implementación; verificación de cierre y eficacia."},{"code":"7.1.2","functional_description":"Acciones de mejora derivadas de la revisión por la Alta Dirección","phva_cycle":"ACT","criterion":"Implementar acciones correctivas, preventivas o de mejora cuando la revisión de la Alta Dirección evidencie controles inadecuados o oportunidades de mejora.","expected_evidence":"Plan de acciones derivado de la revisión; responsables; fechas; evidencias de implementación; seguimiento y evaluación de eficacia."},{"code":"7.1.3","functional_description":"Acciones de mejora derivadas de investigaciones de AT y EL","phva_cycle":"ACT","criterion":"Implementar acciones preventivas y correctivas basadas en las causas identificadas en investigaciones de accidentes de trabajo y enfermedades laborales.","expected_evidence":"Planes de acción vinculados a investigaciones; responsables; fechas; soportes de cierre; verificación de eficacia."},{"code":"7.1.4","functional_description":"Plan de mejoramiento por requerimientos de autoridades o ARL","phva_cycle":"ACT","criterion":"Implementar medidas y acciones correctivas derivadas de requerimientos o recomendaciones de autoridades administrativas y administradoras de riesgos laborales.","expected_evidence":"Requerimientos/recomendaciones recibidos; plan de mejoramiento; evidencias de ejecución; respuestas formales; cierres y seguimiento."}]$standards$::jsonb
        ) as x(code text)
      )
  ) <> 60 then
    raise exception 'expected 60 imported minimum standards';
  end if;

  for v_profile in
    select p.code, pv.id
    from public.standard_profiles p
    join public.standard_profile_versions pv on pv.standard_profile_id = p.id
    where p.code in ('RES0312_P07','RES0312_P21','RES0312_P60')
      and pv.version_code = '1.0.0'
  loop
    select count(*), coalesce(sum(weight), 0)
    into v_count, v_weight
    from public.profile_standards
    where standard_profile_version_id = v_profile.id;

    if (v_profile.code = 'RES0312_P07' and v_count <> 7)
       or (v_profile.code = 'RES0312_P21' and v_count <> 21)
       or (v_profile.code = 'RES0312_P60' and v_count <> 60) then
      raise exception 'unexpected standard count for profile %', v_profile.code;
    end if;

    if v_weight <> 100 then
      raise exception 'weights for profile % total %, expected 100', v_profile.code, v_weight;
    end if;
  end loop;

  if (
    select count(*)
    from public.assessment_scoring_rules
    where code in (
      'RES0312_P07_SCORING',
      'RES0312_P21_SCORING',
      'RES0312_P60_SCORING'
    )
      and version_number = 1
      and status = 'draft'
      and expert_review_status = 'pending'
  ) <> 3 then
    raise exception 'expected three draft scoring rules';
  end if;
end;
$$;

-- Reconcile decisions that were approved before operational synchronization existed.
do $$
declare
  v_artifact record;
begin
  for v_artifact in
    select id
    from public.normative_review_artifacts
    where review_status = 'approved'
      and artifact_type in (
        'NORMATIVE_SOURCE_VERSION',
        'REQUIREMENT',
        'MINIMUM_STANDARD',
        'STANDARD_PROFILE_VERSION',
        'PROFILE_STANDARD',
        'ASSESSMENT_SCORING_RULE'
      )
  loop
    perform private.sync_normative_review_artifact(v_artifact.id, 'approved');
  end loop;
end;
$$;

notify pgrst, 'reload schema';
