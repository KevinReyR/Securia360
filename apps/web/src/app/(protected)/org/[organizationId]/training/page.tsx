/* eslint-disable @typescript-eslint/no-explicit-any */
import { CalendarCheck, Certificate, GraduationCap, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/empty-state";
import { FormDrawer } from "@/components/form-drawer";
import { OperationsNav } from "@/components/operations-nav";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { can } from "@/modules/auth/permissions";
import { displayPersonName, matchesDirectorySearch } from "@/modules/organizations/directory";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { addQuestion, createCatalog, createPlan, createSession, createTemplate, invite, recordAttendance } from "@/modules/training/actions";
import { TrainingEvaluationForm } from "@/modules/training/evaluation-form";

const dateTime = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin fecha";

export default async function TrainingPage({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ q?: string; state?: string; status?: string }>;
}) {
  const { organizationId } = await params;
  const filters = await searchParams;
  const { supabase } = await requireAuthenticatedUser();
  const db = supabase as any;
  const [read, manage, validate] = await Promise.all([can(organizationId, "training.read"), can(organizationId, "training.manage"), can(organizationId, "training.validate")]);
  if (!read) return <EmptyState title="Sin acceso a capacitaciones" description="Solicita acceso al responsable de tu organización." />;

  const [catalogR, plansR, sessionsR, membersR, enrollmentsR, attendancesR, templatesR, questionsR, optionsR, evaluationsR, certificatesR, indicatorsR] = await Promise.all([
    db.from("training_catalog").select("*").eq("organization_id", organizationId).order("title"),
    db.from("training_plans").select("*").eq("organization_id", organizationId).order("year", { ascending: false }),
    db.from("training_sessions").select("*").eq("organization_id", organizationId).order("starts_at", { ascending: false }),
    db.from("organization_members").select("id,user_id").eq("organization_id", organizationId).eq("status", "active"),
    db.from("training_enrollments").select("*").eq("organization_id", organizationId),
    db.from("training_attendances").select("*").eq("organization_id", organizationId),
    db.from("training_evaluation_templates").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    db.from("training_evaluation_questions").select("*").eq("organization_id", organizationId).order("display_order"),
    db.from("training_evaluation_options").select("*").eq("organization_id", organizationId).order("display_order"),
    db.from("training_evaluations").select("*").eq("organization_id", organizationId),
    db.from("training_certificates").select("*").eq("organization_id", organizationId).order("issued_at", { ascending: false }),
    db.from("training_plan_indicators").select("*").eq("organization_id", organizationId),
  ]);
  const catalog = catalogR.data ?? [], plans = plansR.data ?? [], sessions = sessionsR.data ?? [], members = membersR.data ?? [], enrollments = enrollmentsR.data ?? [], attendances = attendancesR.data ?? [], templates = templatesR.data ?? [], questions = questionsR.data ?? [], options = optionsR.data ?? [], evaluations = evaluationsR.data ?? [], certificates = certificatesR.data ?? [], indicators = indicatorsR.data ?? [];
  const userIds = members.map((member: any) => member.user_id);
  const { data: profiles } = userIds.length ? await db.from("profiles").select("id,first_name,middle_name,last_name,second_last_name").in("id", userIds) : { data: [] };
  const memberNames = new Map<string, string>(members.map((member: any) => [
    String(member.id),
    displayPersonName(profiles?.find((profile: any) => profile.id === member.user_id), "Persona con acceso restringido"),
  ]));
  const q = (filters.q ?? "").slice(0, 120);
  const state = filters.state ?? "all";
  const visibleSessions = sessions.filter((session: any) => (state === "all" || session.status === state) && matchesDirectorySearch([session.title], q));
  const hidden = <input type="hidden" name="organizationId" value={organizationId} />;

  const catalogForm = <form action={createCatalog} className="grid gap-4">{hidden}<label className="grid gap-1.5 text-sm font-medium">Código<Input name="code" placeholder="INDUCCION_SST" required /></label><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="title" placeholder="Inducción de seguridad y salud" required /></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Duración en minutos<Input name="duration_minutes" type="number" min="1" /></label><label className="grid gap-1.5 text-sm font-medium">Vigencia en días<Input name="validity_days" type="number" min="1" /></label></div><Button>Crear capacitación</Button></form>;
  const planForm = <form action={createPlan} className="grid gap-4">{hidden}<label className="grid gap-1.5 text-sm font-medium">Año<Input name="year" type="number" defaultValue={new Date().getUTCFullYear()} /></label><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="title" placeholder="Plan anual de capacitación" required /></label><label className="grid gap-1.5 text-sm font-medium">Capacitación de referencia<Select name="training_catalog_id" required>{catalog.map((item: any) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></label><Button disabled={!catalog.length}>Crear plan</Button></form>;
  const sessionForm = <form action={createSession} className="grid gap-4">{hidden}<label className="grid gap-1.5 text-sm font-medium">Plan<Select name="plan_id" required>{plans.map((item: any) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Capacitación<Select name="catalog_id" required>{catalog.map((item: any) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Nombre de la sesión<Input name="title" required /></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Inicio<Input name="starts_at" type="datetime-local" required /></label><label className="grid gap-1.5 text-sm font-medium">Fin<Input name="ends_at" type="datetime-local" required /></label></div><label className="grid gap-1.5 text-sm font-medium">Cupo<Input name="capacity" type="number" min="1" /></label><Button disabled={!plans.length || !catalog.length}>Programar sesión</Button></form>;

  const publishedTemplates: Array<{
    id: string;
    title: string;
    questions: Array<{ id: string; template_id: string; prompt: string; options: Array<{ id: string; question_id: string; label: string }> }>;
  }> = templates.filter((template: any) => template.status === "published").map((template: any) => ({
    id: String(template.id),
    title: String(template.title),
    questions: questions.filter((question: any) => question.template_id === template.id).map((question: any) => ({
      id: String(question.id),
      template_id: String(template.id),
      prompt: String(question.prompt),
      options: options.filter((option: any) => option.question_id === question.id).map((option: any) => ({
        id: String(option.id),
        question_id: String(question.id),
        label: String(option.label),
      })),
    })),
  }));
  const pendingEvaluationEnrollments = enrollments.filter((enrollment: any) => attendances.some((attendance: any) => attendance.training_enrollment_id === enrollment.id && attendance.status === "present") && !evaluations.some((evaluation: any) => evaluation.training_enrollment_id === enrollment.id && evaluation.status === "graded"));

  return <main className="grid gap-7">
    <PageHeader eyebrow="Operación preventiva" title="Capacitaciones y competencias" description="Organiza el plan, confirma asistencia y conserva evaluaciones y certificados trazables." action={manage ? <FormDrawer triggerLabel="Programar sesión" title="Nueva sesión" description="Selecciona el plan, el contenido y el horario de la actividad.">{sessionForm}</FormDrawer> : undefined} />
    <OperationsNav organizationId={organizationId} current="training" />
    <StatusBanner status={filters.status} />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Capacitaciones" value={catalog.length} icon={<GraduationCap size={18} />} /><KpiCard label="Sesiones" value={sessions.length} icon={<CalendarCheck size={18} />} /><KpiCard label="Participaciones" value={enrollments.length} icon={<UsersThree size={18} />} /><KpiCard label="Certificados" value={certificates.length} icon={<Certificate size={18} />} /></section>

    {manage ? <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5"><div><p className="font-semibold">Configura el programa</p><p className="mt-1 text-sm text-[var(--muted)]">Crea el catálogo y el plan antes de programar sesiones.</p></div><div className="flex flex-wrap gap-2"><FormDrawer triggerLabel="Nueva capacitación" title="Catálogo de capacitación" description="Define duración y vigencia del contenido." variant="secondary">{catalogForm}</FormDrawer><FormDrawer triggerLabel="Nuevo plan" title="Plan de capacitación" description="Agrupa la programación del año." variant="secondary" disabled={!catalog.length}>{planForm}</FormDrawer></div></CardContent></Card> : null}

    <Card><CardContent className="pt-5"><form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"><Input name="q" defaultValue={q} placeholder="Buscar sesión" aria-label="Buscar sesiones" /><Select name="state" defaultValue={state} aria-label="Estado de sesión"><option value="all">Todos los estados</option><option value="scheduled">Programadas</option><option value="completed">Completadas</option><option value="cancelled">Canceladas</option></Select><Button variant="secondary">Aplicar filtros</Button></form></CardContent></Card>

    <section className="grid gap-3" aria-labelledby="training-sessions"><div className="flex items-center justify-between"><h2 id="training-sessions" className="text-lg font-semibold">Sesiones y convocatorias</h2><span className="text-xs text-[var(--muted)]">{visibleSessions.length} visibles</span></div>{visibleSessions.length ? visibleSessions.map((session: any) => { const sessionEnrollments = enrollments.filter((enrollment: any) => enrollment.training_session_id === session.id); return <Card key={session.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{session.title}</CardTitle><p className="mt-1 text-sm text-[var(--muted)]">{dateTime(session.starts_at)} · {sessionEnrollments.length} personas convocadas</p></div><StatusBadge>{session.status}</StatusBadge></div></CardHeader><CardContent className="grid gap-3">{manage ? <FormDrawer triggerLabel="Convocar persona" title={`Convocatoria · ${session.title}`} description="Selecciona una persona activa de la organización." variant="secondary"><form action={invite} className="grid gap-4">{hidden}<input type="hidden" name="session_id" value={session.id} /><label className="grid gap-1.5 text-sm font-medium">Persona<Select name="member_id" required>{members.map((member: any) => <option key={member.id} value={member.id}>{memberNames.get(member.id)}</option>)}</Select></label><Button>Enviar convocatoria</Button></form></FormDrawer> : null}{sessionEnrollments.length ? <div className="divide-y divide-[var(--border)]">{sessionEnrollments.map((enrollment: any) => { const attendance = attendances.find((item: any) => item.training_enrollment_id === enrollment.id); return <div key={enrollment.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{memberNames.get(enrollment.organization_member_id) ?? "Persona con acceso restringido"}</p><div className="mt-1"><StatusBadge>{attendance?.status ?? enrollment.status}</StatusBadge></div></div>{validate ? <form action={recordAttendance} className="flex gap-2">{hidden}<input type="hidden" name="enrollment_id" value={enrollment.id} /><Select name="status" defaultValue={attendance?.status ?? "present"} aria-label="Asistencia"><option value="present">Asistió</option><option value="absent">No asistió</option><option value="excused">Ausencia justificada</option></Select><Button size="sm" variant="secondary">Guardar asistencia</Button></form> : null}</div>; })}</div> : <p className="text-sm text-[var(--muted)]">Todavía no hay personas convocadas.</p>}</CardContent></Card>; }) : <EmptyState title="No hay sesiones en esta vista" description={q || state !== "all" ? "Cambia los filtros para ampliar los resultados." : "Crea un catálogo, un plan y programa la primera sesión."} />}</section>

    {manage ? <section className="grid gap-3"><h2 className="text-lg font-semibold">Evaluaciones objetivas</h2><div className="grid gap-3 lg:grid-cols-2"><Card><CardHeader><CardTitle>Plantillas publicadas</CardTitle></CardHeader><CardContent className="grid gap-3">{templates.length ? templates.map((template: any) => <div key={template.id} className="flex items-center justify-between gap-3 border-b border-[var(--border)] py-2"><div><p className="text-sm font-medium">{template.title}</p><p className="text-xs text-[var(--muted)]">Aprobación desde {template.passing_percent}% · {questions.filter((question: any) => question.template_id === template.id).length} preguntas</p></div><StatusBadge>{template.status}</StatusBadge></div>) : <p className="text-sm text-[var(--muted)]">Aún no hay plantillas.</p>}<FormDrawer triggerLabel="Nueva plantilla" title="Plantilla de evaluación" description="Define el umbral de aprobación; la calificación se realiza en el servidor." variant="secondary"><form action={createTemplate} className="grid gap-4">{hidden}<label className="grid gap-1.5 text-sm font-medium">Capacitación<Select name="catalog_id" required>{catalog.map((item: any) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="title" required /></label><label className="grid gap-1.5 text-sm font-medium">Porcentaje de aprobación<Input name="passing_percent" type="number" defaultValue="70" min="0" max="100" /></label><Button disabled={!catalog.length}>Publicar plantilla</Button></form></FormDrawer></CardContent></Card><Card><CardHeader><CardTitle>Banco de preguntas</CardTitle></CardHeader><CardContent><FormDrawer triggerLabel="Agregar pregunta" title="Nueva pregunta" description="Añade una opción correcta y una alternativa; nunca se solicita información libre al evaluado." variant="secondary" disabled={!templates.length}><form action={addQuestion} className="grid gap-4">{hidden}<label className="grid gap-1.5 text-sm font-medium">Plantilla<Select name="template_id" required>{templates.map((item: any) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Pregunta<Textarea name="prompt" required /></label><label className="grid gap-1.5 text-sm font-medium">Peso<Input name="weight" type="number" defaultValue="1" min="0.01" step="0.01" /></label><label className="grid gap-1.5 text-sm font-medium">Respuesta correcta<Input name="correct_label" required /></label><label className="grid gap-1.5 text-sm font-medium">Alternativa<Input name="incorrect_label" required /></label><Button>Agregar pregunta</Button></form></FormDrawer></CardContent></Card></div></section> : null}

    {validate ? <section className="grid gap-3"><h2 className="text-lg font-semibold">Evaluar y certificar</h2>{pendingEvaluationEnrollments.length && publishedTemplates.length ? <div className="grid gap-3 xl:grid-cols-2">{pendingEvaluationEnrollments.map((enrollment: any) => <TrainingEvaluationForm key={enrollment.id} organizationId={organizationId} enrollmentId={enrollment.id} participantName={memberNames.get(enrollment.organization_member_id) ?? "Persona con acceso restringido"} templates={publishedTemplates} />)}</div> : <EmptyState title="No hay evaluaciones pendientes" description="Se habilitan cuando una persona registra asistencia y existe una plantilla publicada con preguntas." />}</section> : null}

    <section className="grid gap-3"><h2 className="text-lg font-semibold">Resultados e indicadores</h2><div className="grid gap-3 lg:grid-cols-2"><Card><CardHeader><CardTitle>Cobertura y eficacia</CardTitle></CardHeader><CardContent className="grid gap-2">{indicators.length ? indicators.map((indicator: any) => <p key={indicator.training_plan_id} className="text-sm">Cobertura <strong>{indicator.coverage_percent ?? "—"}%</strong> · eficacia <strong>{indicator.effectiveness_percent ?? "—"}%</strong></p>) : <p className="text-sm text-[var(--muted)]">Los indicadores se calculan fuera de la interfaz cuando existen participaciones.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Certificados emitidos</CardTitle></CardHeader><CardContent className="grid gap-2">{certificates.length ? certificates.map((certificate: any) => <div key={certificate.id} className="flex items-center justify-between gap-3 border-b border-[var(--border)] py-2"><div><p className="font-mono text-xs font-semibold">{certificate.certificate_code}</p><p className="text-xs text-[var(--muted)]">Vence {dateTime(certificate.expires_at)}</p></div><StatusBadge>active</StatusBadge></div>) : <p className="text-sm text-[var(--muted)]">Aún no se han emitido certificados.</p>}</CardContent></Card></div></section>
  </main>;
}
