/* eslint-disable @typescript-eslint/no-explicit-any */
import { CaretDown, ClipboardText, FirstAid, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import { addBrigadeMember, createAction, createBrigade, createDirectoryEntry, createDrill, createFinding, createPlan, createResource, createScenario, recordDrillResult, setActionStatus, setPlanStatus, uploadEmergencyEvidence } from "@/modules/emergencies/actions";
import { emergencyHref, isEmergencyView, parseEmergencyView, type EmergencyView } from "@/modules/emergencies/emergency-navigation";
import { EmergencyTabs } from "@/modules/emergencies/emergency-tabs";
import { ResilientDirectory } from "@/modules/emergencies/resilient-directory";
import { displayPersonName } from "@/modules/organizations/directory";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";

const resourceLabels: Record<string, string> = { first_aid: "Primeros auxilios", firefighting: "Contra incendios", evacuation: "Evacuación", communication: "Comunicación", rescue: "Rescate", other: "Otro" };
const specialtyLabels: Record<string, string> = { evacuation: "Evacuación", first_aid: "Primeros auxilios", firefighting: "Contra incendios", rescue: "Rescate", mixed: "Mixta" };
const outcomeLabels: Record<string, string> = { satisfactory: "Satisfactorio", needs_improvement: "Requiere mejora", unsatisfactory: "Insatisfactorio" };
const displayDate = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(value)) : "Sin fecha";
const emptyResult = { data: [] as any[] };

export default async function EmergenciesPage({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ site?: string; status?: string; view?: string }>;
}) {
  const { organizationId } = await params;
  const filters = await searchParams;
  const { supabase } = await requireAuthenticatedUser();
  const db = supabase as any;
  const [read, manage, approve, directory, sitesResult] = await Promise.all([
    can(organizationId, "emergencies.read"),
    can(organizationId, "emergencies.manage"),
    can(organizationId, "emergencies.approve"),
    can(organizationId, "emergencies.directory_read"),
    db.from("sites").select("id,name").eq("organization_id", organizationId).eq("status", "active").order("name"),
  ]);
  if (!read && !manage) return <EmptyState title="Sin acceso a emergencias" description="Solicita acceso al responsable de tu organización." />;

  const sites = sitesResult.data ?? [];
  const siteId = filters.site && sites.some((site: any) => site.id === filters.site) ? filters.site : sites[0]?.id;
  const requestedView = parseEmergencyView(filters.view);
  if ((filters.view && !isEmergencyView(filters.view)) || (requestedView === "directory" && !directory)) {
    redirect(emergencyHref(organizationId, siteId, "summary"));
  }
  const view: EmergencyView = requestedView;

  let scenarios: any[] = [];
  let resources: any[] = [];
  let brigades: any[] = [];
  let brigadeMembers: any[] = [];
  let plans: any[] = [];
  let drills: any[] = [];
  let results: any[] = [];
  let findings: any[] = [];
  let actions: any[] = [];
  let directoryEntries: any[] = [];
  let improvementActions: any[] = [];
  let scenarioCount = 0;
  let brigadeCount = 0;

  if (siteId && view === "summary") {
    const [scenarioCountResult, resourceResult, brigadeCountResult, planResult, drillResult] = await Promise.all([
      db.from("emergency_scenarios").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("site_id", siteId),
      db.from("emergency_resources").select("id,name,status,inspection_due_at,expires_at").eq("organization_id", organizationId).eq("site_id", siteId).order("inspection_due_at"),
      db.from("emergency_brigades").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("site_id", siteId),
      db.from("emergency_plan_versions").select("id,version_number,summary,status,effective_from,effective_to,document_version_id").eq("organization_id", organizationId).eq("site_id", siteId).order("version_number", { ascending: false }),
      db.from("emergency_drills").select("id,title,status,scheduled_at,conducted_at").eq("organization_id", organizationId).eq("site_id", siteId).order("scheduled_at", { ascending: true }),
    ]);
    scenarioCount = scenarioCountResult.count ?? 0;
    brigadeCount = brigadeCountResult.count ?? 0;
    resources = resourceResult.data ?? [];
    plans = planResult.data ?? [];
    drills = drillResult.data ?? [];
    const drillIds = drills.map((drill) => drill.id);
    const findingResult = drillIds.length ? await db.from("emergency_findings").select("id").eq("organization_id", organizationId).in("emergency_drill_id", drillIds) : emptyResult;
    const findingIds = (findingResult.data ?? []).map((finding: any) => finding.id);
    const actionResult = findingIds.length ? await db.from("emergency_actions").select("id,title,status,due_at,evidence_document_version_id").eq("organization_id", organizationId).in("emergency_finding_id", findingIds) : emptyResult;
    actions = actionResult.data ?? [];
  }

  if (siteId && view === "preparedness") {
    const [scenarioResult, resourceResult, brigadeResult] = await Promise.all([
      db.from("emergency_scenarios").select("*").eq("organization_id", organizationId).eq("site_id", siteId).order("name"),
      db.from("emergency_resources").select("*").eq("organization_id", organizationId).eq("site_id", siteId).order("inspection_due_at"),
      db.from("emergency_brigades").select("*").eq("organization_id", organizationId).eq("site_id", siteId).order("name"),
    ]);
    scenarios = scenarioResult.data ?? [];
    resources = resourceResult.data ?? [];
    brigades = brigadeResult.data ?? [];
    const brigadeIds = brigades.map((brigade) => brigade.id);
    const memberResult = brigadeIds.length ? await db.from("emergency_brigade_members").select("*").eq("organization_id", organizationId).in("emergency_brigade_id", brigadeIds) : emptyResult;
    brigadeMembers = memberResult.data ?? [];
  }

  if (siteId && view === "plans") {
    const planResult = await db.from("emergency_plan_versions").select("*").eq("organization_id", organizationId).eq("site_id", siteId).order("version_number", { ascending: false });
    plans = planResult.data ?? [];
  }

  if (siteId && view === "drills") {
    const [scenarioResult, planResult, drillResult, improvementResult] = await Promise.all([
      db.from("emergency_scenarios").select("id,name").eq("organization_id", organizationId).eq("site_id", siteId).order("name"),
      db.from("emergency_plan_versions").select("id,version_number,status").eq("organization_id", organizationId).eq("site_id", siteId).order("version_number", { ascending: false }),
      db.from("emergency_drills").select("*").eq("organization_id", organizationId).eq("site_id", siteId).order("scheduled_at", { ascending: false }),
      db.from("improvement_actions").select("id,title").eq("organization_id", organizationId).neq("status", "cancelled"),
    ]);
    scenarios = scenarioResult.data ?? [];
    plans = planResult.data ?? [];
    drills = drillResult.data ?? [];
    improvementActions = improvementResult.data ?? [];
    const drillIds = drills.map((drill) => drill.id);
    const [resultResult, findingResult] = await Promise.all([
      drillIds.length ? db.from("emergency_drill_results").select("*").eq("organization_id", organizationId).in("emergency_drill_id", drillIds) : emptyResult,
      drillIds.length ? db.from("emergency_findings").select("*").eq("organization_id", organizationId).in("emergency_drill_id", drillIds) : emptyResult,
    ]);
    results = resultResult.data ?? [];
    findings = findingResult.data ?? [];
    const findingIds = findings.map((finding) => finding.id);
    const actionResult = findingIds.length ? await db.from("emergency_actions").select("*").eq("organization_id", organizationId).in("emergency_finding_id", findingIds) : emptyResult;
    actions = actionResult.data ?? [];
  }

  if (siteId && view === "directory" && directory) {
    const directoryResult = await db.from("emergency_resilient_directory").select("*").eq("organization_id", organizationId).eq("site_id", siteId).order("display_name");
    directoryEntries = directoryResult.data ?? [];
  }

  let members: any[] = [];
  let profiles: any[] = [];
  if (siteId && manage && ["preparedness", "drills"].includes(view)) {
    const memberResult = await db.from("organization_members").select("id,user_id").eq("organization_id", organizationId).eq("status", "active").order("created_at");
    members = memberResult.data ?? [];
    const userIds = members.map((member) => member.user_id);
    const profileResult = userIds.length ? await db.from("profiles").select("id,first_name,middle_name,last_name,second_last_name").in("id", userIds) : emptyResult;
    profiles = profileResult.data ?? [];
  }

  const memberName = (member: any) => displayPersonName(profiles.find((profile: any) => profile.id === member.user_id), "Persona con acceso restringido");
  const contextFields = <><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="return_site" value={siteId ?? ""} /><input type="hidden" name="return_view" value={view} /></>;
  const evidenceFields = (type: string, id: string) => <><input type="hidden" name="entity_type" value={type} /><input type="hidden" name="entity_id" value={id} /><label className="grid gap-1.5 text-sm font-medium">Archivo<Input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /></label><Button>Guardar evidencia</Button></>;
  const nextVersion = plans.length ? Math.max(...plans.map((plan: any) => plan.version_number)) + 1 : 1;
  // This server-rendered page needs the request-time reference to classify due dates.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const expiredResources = resources.filter((resource: any) => [resource.inspection_due_at, resource.expires_at].some((value) => value && new Date(value).getTime() < now));
  const openActions = actions.filter((action: any) => !["verified", "cancelled"].includes(action.status));
  const currentPlan = plans.find((plan: any) => plan.status === "approved") ?? plans[0];
  const nextDrill = drills.find((drill: any) => drill.scheduled_at && new Date(drill.scheduled_at).getTime() >= now && !["completed", "cancelled"].includes(drill.status));

  return <main className="grid gap-6">
    <PageHeader eyebrow="Preparación por sede" title="Emergencias" description="Coordina recursos, brigadas, planes y simulacros desde un espacio de trabajo organizado por función." />
    <StatusBanner status={filters.status} />
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]"><input type="hidden" name="view" value={view} /><label className="grid min-w-[min(100%,18rem)] gap-1.5 text-sm font-medium">Sede<Select name="site" defaultValue={siteId}>{sites.map((site: any) => <option key={site.id} value={site.id}>{site.name}</option>)}</Select></label><Button variant="secondary">Cambiar sede</Button>{siteId ? <p className="ml-auto self-center text-sm text-[var(--muted)]">La información mostrada corresponde solo a esta sede.</p> : null}</form>
    <EmergencyTabs organizationId={organizationId} siteId={siteId} current={view} showDirectory={directory} />

    {!siteId ? <EmptyState title="No hay sedes disponibles" description="Crea una sede para administrar su preparación ante emergencias." /> : null}

    {siteId && view === "summary" ? <section aria-labelledby="emergency-summary" className="grid gap-5">
      <div><h2 id="emergency-summary" className="text-lg font-semibold tracking-[-0.018em]">Estado de la sede</h2><p className="mt-1 text-sm text-[var(--muted)]">Prioridades operativas y accesos directos para continuar la preparación.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Escenarios" value={scenarioCount} description="Situaciones identificadas" icon={<Warning size={19} />} href={emergencyHref(organizationId, siteId, "preparedness")} actionLabel="Ver preparación" /><KpiCard label="Recursos" value={resources.length} description="Elementos disponibles" icon={<FirstAid size={19} />} href={emergencyHref(organizationId, siteId, "preparedness")} actionLabel="Revisar recursos" /><KpiCard label="Alertas de recurso" value={expiredResources.length} description="Inspecciones o vencimientos" icon={<Warning size={19} />} href={emergencyHref(organizationId, siteId, "preparedness")} actionLabel="Atender alertas" /><KpiCard label="Acciones abiertas" value={openActions.length} description="Derivadas de simulacros" icon={<ClipboardText size={19} />} href={emergencyHref(organizationId, siteId, "drills")} actionLabel="Ver acciones" /></div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Card><CardHeader><CardTitle>Preparación vigente</CardTitle></CardHeader><CardContent className="divide-y divide-[var(--border)] p-0"><article className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-semibold">Plan de emergencia</p><p className="mt-1 text-xs text-[var(--muted)]">{currentPlan ? `Versión ${currentPlan.version_number} · ${displayDate(currentPlan.effective_from)}` : "Aún no existe una versión para esta sede."}</p></div>{currentPlan ? <StatusBadge>{currentPlan.status}</StatusBadge> : <Link className="text-sm font-semibold text-[var(--brand)]" href={emergencyHref(organizationId, siteId, "plans")}>Crear plan</Link>}</article><article className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-semibold">Próximo simulacro</p><p className="mt-1 text-xs text-[var(--muted)]">{nextDrill ? `${nextDrill.title} · ${displayDate(nextDrill.scheduled_at)}` : "No hay un simulacro próximo programado."}</p></div>{nextDrill ? <StatusBadge>{nextDrill.status}</StatusBadge> : <Link className="text-sm font-semibold text-[var(--brand)]" href={emergencyHref(organizationId, siteId, "drills")}>Programar</Link>}</article><article className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-semibold">Brigadas</p><p className="mt-1 text-xs text-[var(--muted)]">{brigadeCount} {brigadeCount === 1 ? "equipo registrado" : "equipos registrados"}</p></div><Link className="text-sm font-semibold text-[var(--brand)]" href={emergencyHref(organizationId, siteId, "preparedness")}>Gestionar</Link></article></CardContent></Card>
        <Card><CardHeader><CardTitle>Atención requerida</CardTitle></CardHeader><CardContent className="grid gap-3">{expiredResources.length || openActions.length ? <>{expiredResources.slice(0, 3).map((resource: any) => <div key={resource.id} className="flex items-center justify-between gap-3 rounded-[10px] bg-[var(--warning-soft)] px-3 py-2.5"><div><p className="text-sm font-medium">{resource.name}</p><p className="text-xs text-[var(--warning)]">Revisar inspección o vencimiento</p></div><StatusBadge>overdue</StatusBadge></div>)}{openActions.length ? <Link href={emergencyHref(organizationId, siteId, "drills")} className="flex items-center justify-between gap-3 rounded-[10px] bg-[var(--muted-surface)] px-3 py-2.5 text-sm font-semibold"><span>{openActions.length} {openActions.length === 1 ? "acción abierta" : "acciones abiertas"}</span><span className="text-[var(--brand)]">Revisar</span></Link> : null}</> : <div className="py-6 text-center"><p className="font-semibold">Sin alertas operativas</p><p className="mt-1 text-sm text-[var(--muted)]">No hay vencimientos ni acciones abiertas para esta sede.</p></div>}</CardContent></Card>
      </div>
    </section> : null}

    {siteId && view === "preparedness" ? <section aria-labelledby="preparedness-heading" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="preparedness-heading" className="text-lg font-semibold tracking-[-0.018em]">Preparación de la sede</h2><p className="mt-1 text-sm text-[var(--muted)]">Identifica escenarios y mantén disponibles los recursos y equipos de respuesta.</p></div>{manage ? <div className="flex flex-wrap gap-2"><FormDrawer triggerLabel="Escenario" title="Nuevo escenario" description="Describe una situación que requiere preparación." variant="secondary"><form action={createScenario} className="grid gap-4">{contextFields}<input type="hidden" name="site_id" value={siteId} /><label className="grid gap-1.5 text-sm font-medium">Código<Input name="code" placeholder="INCENDIO" required /></label><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="name" required /></label><label className="grid gap-1.5 text-sm font-medium">Descripción<Textarea name="description" /></label><Button>Crear escenario</Button></form></FormDrawer><FormDrawer triggerLabel="Recurso" title="Nuevo recurso" description="Registra cantidad e hitos de inspección." variant="secondary"><form action={createResource} className="grid gap-4">{contextFields}<input type="hidden" name="site_id" value={siteId} /><label className="grid gap-1.5 text-sm font-medium">Tipo<Select name="resource_type">{Object.entries(resourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="name" required /></label><label className="grid gap-1.5 text-sm font-medium">Cantidad<Input name="quantity" type="number" min="0" defaultValue="1" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Próxima inspección<Input name="inspection_due_at" type="date" /></label><label className="grid gap-1.5 text-sm font-medium">Vencimiento<Input name="expires_at" type="date" /></label></div><Button>Registrar recurso</Button></form></FormDrawer><FormDrawer triggerLabel="Brigada" title="Nueva brigada" description="Define la especialidad operativa de la sede." variant="secondary"><form action={createBrigade} className="grid gap-4">{contextFields}<input type="hidden" name="site_id" value={siteId} /><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="name" required /></label><label className="grid gap-1.5 text-sm font-medium">Especialidad<Select name="specialty">{Object.entries(specialtyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><Button>Crear brigada</Button></form></FormDrawer></div> : null}</div>
      <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
        <Card><CardHeader><CardTitle>Escenarios identificados</CardTitle></CardHeader><CardContent className="p-0">{scenarios.length ? <div className="divide-y divide-[var(--border)]">{scenarios.map((scenario: any) => <article key={scenario.id} className="px-5 py-4"><div className="flex items-start gap-3"><span className="rounded-md bg-[var(--warning-soft)] px-2 py-1 font-mono text-xs font-semibold text-[var(--warning)]">{scenario.code}</span><div><p className="text-sm font-semibold">{scenario.name}</p>{scenario.description ? <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{scenario.description}</p> : null}</div></div></article>)}</div> : <div className="px-5 py-8 text-center"><p className="font-semibold">Sin escenarios</p><p className="mt-1 text-sm text-[var(--muted)]">Registra las situaciones que requieren preparación.</p></div>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Recursos y vencimientos</CardTitle></CardHeader><CardContent className="p-0">{resources.length ? <div className="divide-y divide-[var(--border)]">{resources.map((resource: any) => { const hasAlert = expiredResources.some((item: any) => item.id === resource.id); return <article key={resource.id} className="px-5 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">{resource.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{resourceLabels[resource.resource_type] ?? "Recurso"} · {resource.quantity} disponibles</p><p className="mt-1 text-xs text-[var(--muted)]">Inspección {displayDate(resource.inspection_due_at)} · vence {displayDate(resource.expires_at)}</p></div><div className="flex flex-wrap items-center gap-2"><StatusBadge>{hasAlert ? "overdue" : resource.status}</StatusBadge>{manage ? <FormDrawer triggerLabel="Evidencia" title={`Evidencia · ${resource.name}`} description="La evidencia queda protegida por organización y sede." variant="secondary"><form action={uploadEmergencyEvidence} className="grid gap-4">{contextFields}{evidenceFields("emergency_resource", resource.id)}</form></FormDrawer> : null}</div></div></article>; })}</div> : <div className="px-5 py-8 text-center"><p className="font-semibold">Sin recursos</p><p className="mt-1 text-sm text-[var(--muted)]">Registra equipos, suministros y fechas de inspección.</p></div>}</CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Brigadas y responsables</CardTitle></CardHeader><CardContent className="p-0">{brigades.length ? <div className="divide-y divide-[var(--border)]">{brigades.map((brigade: any) => { const assigned = brigadeMembers.filter((item: any) => item.emergency_brigade_id === brigade.id); return <article key={brigade.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div><p className="text-sm font-semibold">{brigade.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{specialtyLabels[brigade.specialty] ?? "Brigada"} · {assigned.length} integrantes</p></div>{manage ? <FormDrawer triggerLabel="Asignar integrante" title={`Brigada · ${brigade.name}`} description="Define la responsabilidad de una persona activa." variant="secondary"><form action={addBrigadeMember} className="grid gap-4">{contextFields}<input type="hidden" name="emergency_brigade_id" value={brigade.id} /><label className="grid gap-1.5 text-sm font-medium">Persona<Select name="organization_member_id">{members.map((member: any) => <option key={member.id} value={member.id}>{memberName(member)}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Responsabilidad<Select name="responsibility"><option value="member">Integrante</option><option value="leader">Líder</option><option value="alternate">Suplente</option></Select></label><Button>Asignar integrante</Button></form></FormDrawer> : null}</article>; })}</div> : <div className="px-5 py-8 text-center"><p className="font-semibold">Sin brigadas</p><p className="mt-1 text-sm text-[var(--muted)]">Crea los equipos responsables de la respuesta.</p></div>}</CardContent></Card>
    </section> : null}

    {siteId && view === "plans" ? <section aria-labelledby="plans-heading" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="plans-heading" className="text-lg font-semibold tracking-[-0.018em]">Planes de emergencia</h2><p className="mt-1 text-sm text-[var(--muted)]">Consulta el historial y controla la revisión, aprobación y evidencia de cada versión.</p></div>{manage ? <FormDrawer triggerLabel="Crear versión" title="Nueva versión del plan" description="Las versiones aprobadas se conservan sin cambios."><form action={createPlan} className="grid gap-4">{contextFields}<input type="hidden" name="site_id" value={siteId} /><input type="hidden" name="version_number" value={nextVersion} /><label className="grid gap-1.5 text-sm font-medium">Resumen<Textarea name="summary" required /></label><label className="grid gap-1.5 text-sm font-medium">Vigencia desde<Input name="effective_from" type="date" /></label><Button>Crear borrador v{nextVersion}</Button></form></FormDrawer> : null}</div>
      <Card><CardContent className="p-0">{plans.length ? <div className="divide-y divide-[var(--border)]">{plans.map((plan: any) => <article key={plan.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">Plan de emergencia · versión {plan.version_number}</p><StatusBadge>{plan.status}</StatusBadge>{plan.document_version_id ? <span className="text-xs font-medium text-[var(--success)]">Con evidencia</span> : null}</div><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{plan.summary}</p><p className="mt-1 text-xs text-[var(--muted)]">Vigencia desde {displayDate(plan.effective_from)}{plan.effective_to ? ` hasta ${displayDate(plan.effective_to)}` : ""}</p></div><div className="flex flex-wrap gap-2">{manage && !["approved", "archived"].includes(plan.status) ? <form action={setPlanStatus} className="flex flex-wrap gap-2">{contextFields}<input type="hidden" name="id" value={plan.id} /><Select name="status" aria-label={`Nuevo estado del plan versión ${plan.version_number}`}><option value="reviewed">Enviar a revisión</option>{approve ? <option value="approved">Aprobar</option> : null}<option value="archived">Archivar</option></Select><Button size="sm">Cambiar estado</Button></form> : null}{manage ? <FormDrawer triggerLabel="Evidencia" title={`Plan versión ${plan.version_number}`} description="Adjunta la evidencia privada de esta versión." variant="secondary"><form action={uploadEmergencyEvidence} className="grid gap-4">{contextFields}{evidenceFields("emergency_plan_version", plan.id)}</form></FormDrawer> : null}</div></article>)}</div> : <div className="px-5 py-10 text-center"><p className="font-semibold">Aún no hay un plan versionado</p><p className="mt-1 text-sm text-[var(--muted)]">Crea la primera versión para iniciar su revisión y aprobación.</p></div>}</CardContent></Card>
    </section> : null}

    {siteId && view === "drills" ? <section aria-labelledby="drills-heading" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="drills-heading" className="text-lg font-semibold tracking-[-0.018em]">Simulacros y mejora</h2><p className="mt-1 text-sm text-[var(--muted)]">Programa ejercicios y conserva sus resultados, hallazgos y acciones.</p></div>{manage ? <FormDrawer triggerLabel="Nuevo simulacro" title="Programar simulacro" description="Vincula el escenario y la versión de plan que se pondrán a prueba."><form action={createDrill} className="grid gap-4">{contextFields}<input type="hidden" name="site_id" value={siteId} /><label className="grid gap-1.5 text-sm font-medium">Escenario<Select name="emergency_scenario_id"><option value="">Sin escenario</option>{scenarios.map((scenario: any) => <option key={scenario.id} value={scenario.id}>{scenario.name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Plan<Select name="emergency_plan_version_id"><option value="">Sin plan</option>{plans.map((plan: any) => <option key={plan.id} value={plan.id}>Versión {plan.version_number}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="title" required /></label><label className="grid gap-1.5 text-sm font-medium">Fecha y hora<Input name="scheduled_at" type="datetime-local" /></label><Button>Programar simulacro</Button></form></FormDrawer> : null}</div>
      {drills.length ? <div className="grid gap-3">{drills.map((drill: any) => { const result = results.find((item: any) => item.emergency_drill_id === drill.id); const drillFindings = findings.filter((item: any) => item.emergency_drill_id === drill.id); return <details key={drill.id} className="group overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"><summary className="grid cursor-pointer list-none gap-3 px-5 py-4 outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{drill.title}</p><StatusBadge>{drill.status}</StatusBadge></div><p className="mt-1 text-xs text-[var(--muted)]">Programado {displayDate(drill.scheduled_at)} · {drillFindings.length} {drillFindings.length === 1 ? "hallazgo" : "hallazgos"}</p></div><span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">Ver detalle<CaretDown size={15} className="transition-transform group-open:rotate-180" /></span></summary><div className="grid gap-4 border-t border-[var(--border)] p-5">{result ? <div className="rounded-[10px] bg-[var(--muted-surface)] p-3 text-sm"><strong>{outcomeLabels[result.outcome] ?? "Resultado registrado"}</strong><p className="mt-1 leading-6 text-[var(--muted)]">{result.summary}</p></div> : manage ? <FormDrawer triggerLabel="Registrar resultado" title={`Resultado · ${drill.title}`} description="Registra participantes, duración y conclusión operativa." variant="secondary"><form action={recordDrillResult} className="grid gap-4">{contextFields}<input type="hidden" name="emergency_drill_id" value={drill.id} /><label className="grid gap-1.5 text-sm font-medium">Participantes<Input name="participant_count" type="number" min="0" /></label><label className="grid gap-1.5 text-sm font-medium">Duración en segundos<Input name="duration_seconds" type="number" min="0" /></label><label className="grid gap-1.5 text-sm font-medium">Resultado<Select name="outcome">{Object.entries(outcomeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Resumen<Textarea name="summary" required /></label><Button>Guardar resultado</Button></form></FormDrawer> : null}<div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Hallazgos y acciones</h3>{manage ? <FormDrawer triggerLabel="Registrar hallazgo" title={`Hallazgo · ${drill.title}`} description="Describe la oportunidad observada durante el simulacro." variant="secondary"><form action={createFinding} className="grid gap-4">{contextFields}<input type="hidden" name="emergency_drill_id" value={drill.id} /><label className="grid gap-1.5 text-sm font-medium">Título<Input name="title" required /></label><label className="grid gap-1.5 text-sm font-medium">Severidad<Select name="severity"><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="critical">Crítica</option></Select></label><label className="grid gap-1.5 text-sm font-medium">Descripción<Textarea name="description" /></label><Button>Crear hallazgo</Button></form></FormDrawer> : null}</div>{drillFindings.length ? <div className="grid gap-3">{drillFindings.map((finding: any) => { const findingActions = actions.filter((action: any) => action.emergency_finding_id === finding.id); return <article key={finding.id} className="rounded-[10px] border border-[var(--border)]"><div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-semibold">{finding.title}</p>{finding.description ? <p className="mt-1 text-xs text-[var(--muted)]">{finding.description}</p> : null}</div><div className="flex flex-wrap items-center gap-2"><StatusBadge>{finding.severity}</StatusBadge>{manage ? <FormDrawer triggerLabel="Crear acción" title={`Acción · ${finding.title}`} description="Asigna responsable, fecha y vínculo con mejoramiento." variant="secondary"><form action={createAction} className="grid gap-4">{contextFields}<input type="hidden" name="emergency_finding_id" value={finding.id} /><label className="grid gap-1.5 text-sm font-medium">Acción<Input name="title" required /></label><label className="grid gap-1.5 text-sm font-medium">Responsable<Select name="responsible_user_id"><option value="">Sin responsable</option>{members.map((member: any) => <option key={member.id} value={member.user_id}>{memberName(member)}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Fecha objetivo<Input name="due_at" type="date" /></label><label className="grid gap-1.5 text-sm font-medium">Acción de mejora<Select name="improvement_action_id"><option value="">Sin vínculo</option>{improvementActions.map((item: any) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></label><Button>Crear acción</Button></form></FormDrawer> : null}</div></div>{findingActions.length ? <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">{findingActions.map((action: any) => <div key={action.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium">{action.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{action.responsible_user_id ? profiles.find((profile) => profile.id === action.responsible_user_id)?.first_name ?? "Responsable asignado" : "Sin responsable"} · {displayDate(action.due_at)}</p></div><div className="flex flex-wrap items-center gap-2"><StatusBadge>{action.status}</StatusBadge>{manage ? <FormDrawer triggerLabel="Evidencia" title={`Evidencia · ${action.title}`} description="Adjunta una evidencia privada antes de verificar." variant="secondary"><form action={uploadEmergencyEvidence} className="grid gap-4">{contextFields}{evidenceFields("emergency_action", action.id)}</form></FormDrawer> : null}{manage && action.status !== "verified" ? <form action={setActionStatus} className="flex flex-wrap gap-2">{contextFields}<input type="hidden" name="id" value={action.id} /><Select name="status" aria-label={`Nuevo estado de ${action.title}`}><option value="in_progress">En ejecución</option>{approve ? <option value="verified">Verificar</option> : null}<option value="cancelled">Cancelar</option></Select><Button size="sm" variant="secondary">Actualizar</Button></form> : null}</div></div>)}</div> : <p className="border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">Este hallazgo aún no tiene acciones.</p>}</article>; })}</div> : <p className="rounded-[10px] border border-dashed border-[var(--border-strong)] px-4 py-5 text-center text-sm text-[var(--muted)]">No se registraron hallazgos para este simulacro.</p>}</div></details>; })}</div> : <EmptyState title="No hay simulacros" description="Programa un simulacro para evaluar el plan y generar acciones de mejora." />}
    </section> : null}

    {siteId && view === "directory" && directory ? <section aria-labelledby="directory-heading" className="grid gap-4"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="directory-heading" className="text-lg font-semibold tracking-[-0.018em]">Directorio operativo resiliente</h2><p className="mt-1 text-sm text-[var(--muted)]">Contactos autorizados y copia cifrada de contingencia para esta sede.</p></div>{manage ? <FormDrawer triggerLabel="Agregar contacto" title="Contacto operativo" description="La visibilidad queda limitada al personal autorizado de esta sede."><form action={createDirectoryEntry} className="grid gap-4">{contextFields}<input type="hidden" name="site_id" value={siteId} /><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="display_name" required /></label><label className="grid gap-1.5 text-sm font-medium">Responsabilidad<Input name="operational_role" required /></label><label className="grid gap-1.5 text-sm font-medium">Teléfono<Input name="contact_phone" /></label><label className="grid gap-1.5 text-sm font-medium">Correo<Input name="contact_email" type="email" /></label><label className="grid gap-1.5 text-sm font-medium">Visibilidad<Select name="visibility"><option value="emergency_team">Equipo de emergencia</option><option value="site_staff">Personal de la sede</option></Select></label><Button>Agregar contacto</Button></form></FormDrawer> : null}</div><ResilientDirectory organizationId={organizationId} siteId={siteId} entries={directoryEntries} /></section> : null}
  </main>;
}
