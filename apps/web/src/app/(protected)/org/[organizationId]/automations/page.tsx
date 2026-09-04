import { Lightning, Play, ShieldWarning, Timer } from "@phosphor-icons/react/dist/ssr";
import { AnalysisNav } from "@/components/analysis-nav";
import { EmptyState } from "@/components/empty-state";
import { FormDrawer } from "@/components/form-drawer";
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
import { requireAuthenticatedUser, requireTenant } from "@/modules/organizations/tenant";
import { approveAutomationVersion, createAutomationRule, createAutomationVersion, dryRunAutomation, retryAutomationExecution, setAutomationStatus } from "@/modules/automations/actions";

const eventLabels: Record<string, string> = {
  "task.overdue": "Una tarea se vence",
  "document.expiring": "Un documento está próximo a vencer",
  "assessment.completed": "Una evaluación se completa",
  "risk.changed": "Un riesgo cambia",
  "organization.created": "Se crea una organización",
  "member.invited": "Se invita una persona",
  "site.created": "Se crea una sede",
  "classification.changed": "Cambia la clasificación",
};
const fieldLabels: Record<string, string> = { name: "Nombre", member_id: "Persona", legal_entity_id: "Razón social", classification_id: "Clasificación", assessment_id: "Evaluación", risk_assessment_id: "Valoración de riesgo", document_id: "Documento", task_id: "Tarea" };
const fields = Object.keys(fieldLabels);
const dateTime = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin fecha";

function describeCondition(input: unknown) {
  if (!input || typeof input !== "object") return "Sin condición configurada";
  const value = input as { operator?: string; field?: string; value?: unknown };
  if (value.operator === "always") return "Siempre que ocurra el evento";
  const field = fieldLabels[value.field ?? ""] ?? "Campo autorizado";
  if (value.operator === "exists") return `Cuando ${field.toLowerCase()} esté informado`;
  if (value.operator === "equals") return `Cuando ${field.toLowerCase()} coincida con “${String(value.value ?? "")}”`;
  return "Condición declarativa";
}

function describeAction(input: unknown) {
  if (!input || typeof input !== "object") return "Registrar la ejecución";
  const value = input as { type?: string; title?: string; priority?: string };
  if (value.type === "create_task") return `Crear la tarea “${value.title ?? "Sin título"}” con prioridad ${value.priority === "critical" ? "crítica" : value.priority === "high" ? "alta" : value.priority === "low" ? "baja" : "media"}`;
  return "Registrar la ejecución sin crear datos operativos";
}

export default async function AutomationsPage({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ status?: string; q?: string; state?: string }>;
}) {
  const { organizationId } = await params;
  const filters = await searchParams;
  const { supabase } = await requireAuthenticatedUser();
  await requireTenant(organizationId);
  const [read, manage, approve, rulesResult, versionsResult, executionsResult, eventsResult] = await Promise.all([
    can(organizationId, "automations.read"),
    can(organizationId, "automations.manage"),
    can(organizationId, "automations.approve"),
    supabase.from("automation_rules").select("id,code,name,status,max_executions_per_hour,activated_at,updated_at").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(100),
    supabase.from("automation_rule_versions").select("id,automation_rule_id,version_number,event_type,conditions,action,status,approved_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(200),
    supabase.from("automation_executions").select("id,automation_rule_version_id,domain_event_id,dry_run,status,attempt_count,available_at,completed_at,last_error,result,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
    supabase.rpc("list_automation_event_candidates", { p_organization_id: organizationId, p_limit: 30 }),
  ]);
  if (!read) return <EmptyState title="Sin acceso a automatizaciones" description="Solicita acceso al responsable de tu organización." />;
  const rules = rulesResult.data ?? [];
  const versions = versionsResult.data ?? [];
  const executions = executionsResult.data ?? [];
  const events = eventsResult.data ?? [];
  const q = (filters.q ?? "").trim().toLowerCase();
  const state = filters.state ?? "all";
  const visibleRules = rules.filter((rule) => (state === "all" || rule.status === state) && (!q || `${rule.code} ${rule.name}`.toLowerCase().includes(q)));
  const activeRules = rules.filter((rule) => rule.status === "active").length;
  const failedExecutions = executions.filter((execution) => ["failed", "rate_limited", "discarded"].includes(execution.status)).length;
  const hidden = <input type="hidden" name="organizationId" value={organizationId} />;

  const ruleForm = <form action={createAutomationRule} className="grid gap-4">{hidden}<label className="grid gap-1.5 text-sm font-medium">Código<Input name="code" required placeholder="TAREA_VENCIDA" /></label><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="name" required placeholder="Crear seguimiento por vencimiento" /></label><label className="grid gap-1.5 text-sm font-medium">Límite por hora<Input name="max_executions_per_hour" type="number" min="1" max="200" defaultValue="25" /></label><p className="text-sm leading-6 text-[var(--muted)]">La regla inicia en borrador y no se activa hasta que una versión sea aprobada.</p><Button><Lightning size={18} />Crear regla</Button></form>;
  const versionForm = <form action={createAutomationVersion} className="grid gap-4">{hidden}<label className="grid gap-1.5 text-sm font-medium">Regla<Select name="automation_rule_id" required><option value="">Selecciona una regla</option>{rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Número de versión<Input name="version_number" type="number" min="1" required /></label><label className="grid gap-1.5 text-sm font-medium">Cuando ocurra<Select name="event_type">{Object.entries(eventLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Condición<Select name="condition_operator"><option value="always">Siempre</option><option value="exists">El campo existe</option><option value="equals">El campo coincide</option></Select></label><label className="grid gap-1.5 text-sm font-medium">Dato a revisar<Select name="condition_field"><option value="">No aplica</option>{fields.map((field) => <option key={field} value={field}>{fieldLabels[field]}</option>)}</Select></label></div><label className="grid gap-1.5 text-sm font-medium">Valor esperado<Input name="condition_value" placeholder="Solo para coincidencia" /></label><label className="grid gap-1.5 text-sm font-medium">Entonces<Select name="action_type"><option value="create_task">Crear una tarea</option><option value="record_only">Solo registrar la ejecución</option></Select></label><label className="grid gap-1.5 text-sm font-medium">Título de la tarea<Input name="task_title" placeholder="Revisar vencimiento" /></label><label className="grid gap-1.5 text-sm font-medium">Descripción<Textarea name="task_description" /></label><label className="grid gap-1.5 text-sm font-medium">Prioridad<Select name="task_priority"><option value="medium">Media</option><option value="low">Baja</option><option value="high">Alta</option><option value="critical">Crítica</option></Select></label><Button disabled={!rules.length}>Crear versión</Button></form>;

  return <main className="grid gap-7">
    <PageHeader eyebrow="Operación controlada" title="Automatizaciones" description="Configura reglas declarativas, limitadas y auditables. Ninguna regla ejecuta SQL, código libre o decisiones críticas." action={manage ? <FormDrawer triggerLabel="Nueva regla" title="Regla de automatización" description="Define el propósito y un límite de ejecución antes de crear su versión.">{ruleForm}</FormDrawer> : undefined} />
    <AnalysisNav organizationId={organizationId} current="automations" />
    <StatusBanner status={filters.status} />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Reglas activas" value={activeRules} icon={<Lightning size={18} />} /><KpiCard label="Versiones aprobadas" value={versions.filter((version) => version.status === "approved").length} icon={<Play size={18} />} /><KpiCard label="Ejecuciones recientes" value={executions.length} icon={<Timer size={18} />} /><KpiCard label="Requieren atención" value={failedExecutions} icon={<ShieldWarning size={18} />} /></section>
    <aside className="rounded-[14px] border border-[var(--warning-border)] bg-[var(--warning-soft)] p-4 text-sm leading-6 text-[var(--warning)]"><strong>Control humano obligatorio.</strong> Aprobar una versión, activarla, reintentar fallos o detener el motor requiere permisos separados. Las simulaciones nunca crean tareas.</aside>
    {manage ? <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5"><div><p className="font-semibold">Constructor seguro</p><p className="mt-1 text-sm text-[var(--muted)]">Combina un evento, una condición permitida y una de las dos acciones disponibles.</p></div><FormDrawer triggerLabel="Nueva versión" title="Versión de la regla" description="La definición queda legible, versionada e inmutable después de aprobarse." variant="secondary" disabled={!rules.length}>{versionForm}</FormDrawer></CardContent></Card> : null}
    <Card><CardContent className="pt-5"><form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem_auto]"><Input name="q" defaultValue={filters.q} placeholder="Buscar regla" aria-label="Buscar automatizaciones" /><Select name="state" defaultValue={state} aria-label="Estado de regla"><option value="all">Todos los estados</option><option value="draft">Borrador</option><option value="active">Activa</option><option value="paused">Pausada</option><option value="emergency_stopped">Detenida por seguridad</option><option value="archived">Archivada</option></Select><Button variant="secondary">Aplicar filtros</Button></form></CardContent></Card>
    <section className="grid gap-3" aria-labelledby="automation-rules"><div className="flex items-center justify-between"><h2 id="automation-rules" className="text-lg font-semibold">Reglas y versiones</h2><span className="text-xs text-[var(--muted)]">{visibleRules.length} visibles</span></div>{visibleRules.length ? visibleRules.map((rule) => { const ruleVersions = versions.filter((version) => version.automation_rule_id === rule.id); return <Card key={rule.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{rule.name}</CardTitle><p className="mt-1 text-sm text-[var(--muted)]">Código {rule.code} · máximo {rule.max_executions_per_hour} ejecuciones por hora</p></div><StatusBadge>{rule.status}</StatusBadge></div></CardHeader><CardContent className="grid gap-4"><div className="flex flex-wrap gap-2">{rule.status !== "active" && approve ? <form action={setAutomationStatus}>{hidden}<input type="hidden" name="id" value={rule.id} /><input type="hidden" name="status" value="active" /><Button size="sm">Activar</Button></form> : null}{rule.status === "active" && manage ? <form action={setAutomationStatus}>{hidden}<input type="hidden" name="id" value={rule.id} /><input type="hidden" name="status" value="paused" /><Button size="sm" variant="secondary">Pausar</Button></form> : null}{approve && rule.status !== "emergency_stopped" ? <form action={setAutomationStatus}>{hidden}<input type="hidden" name="id" value={rule.id} /><input type="hidden" name="status" value="emergency_stopped" /><Button size="sm" variant="danger"><ShieldWarning size={16} />Detener por seguridad</Button></form> : null}</div>{ruleVersions.length ? <div className="grid gap-3">{ruleVersions.map((version) => <article key={version.id} className="rounded-[10px] border border-[var(--border)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">Versión {version.version_number} · {eventLabels[version.event_type] ?? "Evento autorizado"}</p><p className="mt-2 text-sm"><strong>Si:</strong> {describeCondition(version.conditions)}</p><p className="mt-1 text-sm"><strong>Entonces:</strong> {describeAction(version.action)}</p></div><StatusBadge>{version.status}</StatusBadge></div><div className="mt-3 flex flex-wrap gap-2">{version.status === "draft" && approve ? <form action={approveAutomationVersion}>{hidden}<input type="hidden" name="id" value={version.id} /><Button size="sm">Aprobar versión</Button></form> : null}{version.status === "approved" && manage && events.some((event) => event.event_type === version.event_type) ? <form action={dryRunAutomation} className="flex flex-wrap gap-2">{hidden}<input type="hidden" name="versionId" value={version.id} /><Select name="eventId" className="max-w-64">{events.filter((event) => event.event_type === version.event_type).map((event) => <option key={event.id} value={event.id}>Evento del {dateTime(event.occurred_at)}</option>)}</Select><Button size="sm" variant="secondary"><Play size={15} />Simular</Button></form> : null}</div></article>)}</div> : <p className="text-sm text-[var(--muted)]">Esta regla aún no tiene versiones.</p>}</CardContent></Card>; }) : <EmptyState icon={<Lightning size={20} />} title="No hay reglas en esta vista" description={q || state !== "all" ? "Cambia los filtros para ampliar los resultados." : "Crea una regla y configura su primera versión."} />}</section>
    <section className="grid gap-3" aria-labelledby="automation-runs"><div className="flex items-center justify-between"><h2 id="automation-runs" className="text-lg font-semibold">Ejecuciones y reintentos</h2><span className="text-xs text-[var(--muted)]">Últimas {executions.length}</span></div>{executions.length ? <Card><CardContent className="divide-y divide-[var(--border)]">{executions.map((execution) => <article key={execution.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><div className="flex items-center gap-2"><StatusBadge>{execution.status}</StatusBadge>{execution.dry_run ? <span className="text-xs font-medium text-[var(--info)]">Simulación</span> : null}</div><p className="mt-2 text-sm text-[var(--muted)]">{execution.attempt_count} intento{execution.attempt_count === 1 ? "" : "s"} · disponible {dateTime(execution.available_at)}</p>{execution.last_error ? <p className="mt-1 text-sm text-[var(--danger)]">{execution.last_error}</p> : null}</div>{approve && ["failed", "rate_limited", "discarded"].includes(execution.status) && !execution.dry_run ? <form action={retryAutomationExecution}>{hidden}<input type="hidden" name="id" value={execution.id} /><Button size="sm" variant="secondary">Reintentar</Button></form> : null}</article>)}</CardContent></Card> : <EmptyState title="Sin ejecuciones" description="Las ejecuciones y simulaciones aparecerán aquí con su estado e intentos." />}</section>
  </main>;
}
