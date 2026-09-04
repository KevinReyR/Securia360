/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { addIncidentAction, addIncidentCause, addIncidentCommunication, addIncidentPerson, downloadIncidentEvidence, reportIncident, startInvestigation, updateIncidentActionState, updateIncidentState, updateInvestigationState, uploadIncidentEvidence } from "@/modules/incidents/actions";
import { displayPersonName } from "@/modules/organizations/directory";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";

const PAGE_SIZE = 20;
const classificationLabels: Record<string, string> = { incident: "Incidente", work_accident: "Accidente de trabajo", occupational_disease_report: "Reporte de enfermedad laboral", near_miss: "Casi accidente" };
const roleLabels: Record<string, string> = { affected_person: "Persona afectada", witness: "Testigo", reporter: "Reportante", investigator: "Investigador" };
const causeLabels: Record<string, string> = { immediate: "Causa inmediata", basic: "Causa básica", contributing: "Factor contribuyente" };
const communicationLabels: Record<string, string> = { internal: "Comunicación interna", authority_preparation: "Preparación para autoridad", insurer_preparation: "Preparación para aseguradora", other: "Otra comunicación" };
const dateTime = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin fecha";

export default async function IncidentsPage({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string; notice?: string }>;
}) {
  const { organizationId } = await params;
  const filter = await searchParams;
  const { supabase } = await requireAuthenticatedUser();
  const db = supabase as any;
  const [read, manage, sensitive, close, membersR, sitesR] = await Promise.all([
    can(organizationId, "incidents.read"), can(organizationId, "incidents.manage"), can(organizationId, "incidents.sensitive"), can(organizationId, "incidents.close"),
    db.from("organization_members").select("id,user_id").eq("organization_id", organizationId).eq("status", "active"),
    db.from("sites").select("id,name").eq("organization_id", organizationId).eq("status", "active"),
  ]);
  if (!read && !manage) return <EmptyState title="Sin acceso a incidentes" description="Solicita acceso al responsable de tu organización." />;
  const q = (filter.q ?? "").slice(0, 120), status = filter.status ?? "all", page = Math.max(1, Number(filter.page ?? "1") || 1);
  let query = db.from("incidents").select("*").eq("organization_id", organizationId).order("reported_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.or(`reference_code.ilike.%${q.replace(/[%_,.()]/g, "")}%,summary.ilike.%${q.replace(/[%_,.()]/g, "")}%`);
  if (status !== "all") query = query.eq("status", status);
  const [incidentsR, investigationsR, causesR, actionsR, peopleR, communicationsR, evidenceR] = await Promise.all([
    query,
    db.from("incident_investigations").select("*").eq("organization_id", organizationId),
    db.from("incident_causes").select("*").eq("organization_id", organizationId),
    db.from("incident_actions").select("*").eq("organization_id", organizationId),
    db.from("incident_people").select("*").eq("organization_id", organizationId),
    db.from("incident_communications").select("*").eq("organization_id", organizationId),
    sensitive ? db.from("incident_evidences").select("*").eq("organization_id", organizationId) : Promise.resolve({ data: [] }),
  ]);
  const incidents = incidentsR.data ?? [], investigations = investigationsR.data ?? [], causes = causesR.data ?? [], actions = actionsR.data ?? [], people = peopleR.data ?? [], communications = communicationsR.data ?? [], evidences = evidenceR.data ?? [], members = membersR.data ?? [], sites = sitesR.data ?? [];
  const userIds = members.map((member: any) => member.user_id);
  const { data: profiles } = userIds.length ? await db.from("profiles").select("id,first_name,middle_name,last_name,second_last_name").in("id", userIds) : { data: [] };
  const memberName = (member: any) => displayPersonName(profiles?.find((profile: any) => profile.id === member.user_id), "Persona con acceso restringido");
  const hidden = <input type="hidden" name="organizationId" value={organizationId} />;
  const reportForm = <form action={reportIncident} className="grid gap-4">{hidden}<label className="grid gap-1.5 text-sm font-medium">Código del caso<Input name="reference_code" placeholder="INC-2026-001" required /></label><label className="grid gap-1.5 text-sm font-medium">Clasificación<Select name="classification"><option value="incident">Incidente</option><option value="work_accident">Accidente de trabajo</option><option value="occupational_disease_report">Reporte de enfermedad laboral</option><option value="near_miss">Casi accidente</option></Select></label><label className="grid gap-1.5 text-sm font-medium">Fecha y hora<Input name="occurred_at" type="datetime-local" /></label><label className="grid gap-1.5 text-sm font-medium">Sede<Select name="site_id"><option value="">Sin sede</option>{sites.map((site: any) => <option key={site.id} value={site.id}>{site.name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Resumen operativo<Textarea name="summary" placeholder="Describe lo ocurrido sin diagnósticos ni información clínica" required /></label><Button>Registrar reporte</Button></form>;

  return <main className="grid gap-7">
    <PageHeader eyebrow="Operación sensible" title="Incidentes e investigaciones" description="Gestiona el caso con acceso mínimo, evidencia privada y revisión humana. No sustituye reportes oficiales ni decisiones profesionales." action={manage ? <FormDrawer triggerLabel="Reportar incidente" title="Nuevo reporte" description="Registra la información operativa mínima para iniciar el seguimiento.">{reportForm}</FormDrawer> : undefined} />
    <OperationsNav organizationId={organizationId} current="incidents" />
    <StatusBanner status={filter.notice} />
    <aside className="rounded-[14px] border border-[var(--warning)] bg-[var(--warning-soft)] p-4 text-sm leading-6 text-[var(--warning)]"><strong>Información sensible.</strong> Usa solo los datos necesarios para investigar. No registres diagnósticos, historias clínicas ni conclusiones jurídicas.</aside>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Casos visibles" value={incidents.length} /><KpiCard label="En investigación" value={incidents.filter((item: any) => item.status === "under_investigation").length} /><KpiCard label="Con acciones abiertas" value={incidents.filter((item: any) => item.status === "actions_open").length} /><KpiCard label="Evidencias protegidas" value={sensitive ? evidences.length : "Restringido"} /></section>
    <Card><CardContent className="pt-5"><form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem_auto]"><Input name="q" defaultValue={q} placeholder="Buscar código o resumen" aria-label="Buscar incidentes" /><Select name="status" defaultValue={status}><option value="all">Todos los estados</option><option value="reported">Reportados</option><option value="under_investigation">En investigación</option><option value="actions_open">Acciones abiertas</option><option value="closed">Cerrados</option></Select><Button variant="secondary">Aplicar filtros</Button></form></CardContent></Card>

    <section className="grid gap-4" aria-label="Casos de incidentes">{incidents.length ? incidents.map((incident: any) => {
      const investigation = investigations.find((item: any) => item.incident_id === incident.id);
      const incidentActions = actions.filter((item: any) => item.incident_id === incident.id);
      const incidentPeople = people.filter((item: any) => item.incident_id === incident.id);
      const incidentEvidence = evidences.filter((item: any) => item.incident_id === incident.id);
      return <Card key={incident.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{incident.reference_code} · {classificationLabels[incident.classification] ?? "Caso reportado"}</CardTitle><p className="mt-1 text-sm text-[var(--muted)]">Reportado {dateTime(incident.reported_at)}</p></div><StatusBadge>{incident.status}</StatusBadge></div></CardHeader><CardContent className="grid gap-5"><p className="max-w-3xl text-sm leading-6">{incident.summary}</p><div className="flex flex-wrap gap-2">{manage ? <FormDrawer triggerLabel="Gestionar investigación" title={`Investigación · ${incident.reference_code}`} description="Registra participantes, causas y acciones sin emitir conclusiones automáticas." variant="secondary"><div className="grid gap-6"><section className="grid gap-3"><h3 className="font-semibold">Persona involucrada</h3><form action={addIncidentPerson} className="grid gap-3">{hidden}<input type="hidden" name="incident_id" value={incident.id} /><Select name="organization_member_id"><option value="">Referencia externa protegida</option>{members.map((member: any) => <option key={member.id} value={member.id}>{memberName(member)}</option>)}</Select><Select name="role"><option value="affected_person">Persona afectada</option><option value="witness">Testigo</option><option value="reporter">Reportante</option><option value="investigator">Investigador</option></Select><Input name="display_reference" placeholder="Referencia mínima" /><Button>Agregar persona</Button></form></section>{!investigation ? <section className="grid gap-3"><h3 className="font-semibold">Iniciar investigación</h3><form action={startInvestigation} className="grid gap-3">{hidden}<input type="hidden" name="incident_id" value={incident.id} /><Textarea name="methodology_note" placeholder="Método o alcance" /><Button>Iniciar investigación</Button></form></section> : <section className="grid gap-3"><h3 className="font-semibold">Registrar causa</h3><form action={addIncidentCause} className="grid gap-3">{hidden}<input type="hidden" name="investigation_id" value={investigation.id} /><Select name="cause_type"><option value="immediate">Inmediata</option><option value="basic">Básica</option><option value="contributing">Contribuyente</option></Select><Textarea name="description" required /><Button>Agregar causa</Button></form>{close && investigation.status !== "closed" ? <form action={updateInvestigationState}>{hidden}<input type="hidden" name="id" value={investigation.id} /><input type="hidden" name="status" value="closed" /><Button variant="secondary">Cerrar investigación</Button></form> : null}</section>}<section className="grid gap-3"><h3 className="font-semibold">Acción de investigación</h3><form action={addIncidentAction} className="grid gap-3">{hidden}<input type="hidden" name="incident_id" value={incident.id} /><Input name="title" placeholder="Acción correctiva o preventiva" required /><Select name="responsible_user_id"><option value="">Sin responsable</option>{members.map((member: any) => <option key={member.id} value={member.user_id}>{memberName(member)}</option>)}</Select><Input name="due_at" type="date" /><Button>Crear acción</Button></form></section><section className="grid gap-3"><h3 className="font-semibold">Comunicación preparada</h3><form action={addIncidentCommunication} className="grid gap-3">{hidden}<input type="hidden" name="incident_id" value={incident.id} /><Select name="communication_type"><option value="internal">Interna</option><option value="authority_preparation">Preparación para autoridad</option><option value="insurer_preparation">Preparación para aseguradora</option><option value="other">Otra</option></Select><Select name="status"><option value="draft">Borrador</option><option value="prepared">Preparada</option></Select><Button>Registrar comunicación</Button></form></section></div></FormDrawer> : null}{manage ? <FormDrawer triggerLabel="Adjuntar evidencia" title={`Evidencia · ${incident.reference_code}`} description="El archivo queda privado y requiere permiso sensible para descargarse." variant="secondary"><form action={uploadIncidentEvidence} className="grid gap-4">{hidden}<input type="hidden" name="incident_id" value={incident.id} /><Input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /><Button>Guardar evidencia privada</Button></form></FormDrawer> : null}</div>
      {incidentActions.length ? <section className="grid gap-2"><h3 className="text-sm font-semibold">Acciones</h3>{incidentActions.map((action: any) => <article key={action.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--border)] p-3"><div><p className="text-sm font-medium">{action.title}</p><div className="mt-1"><StatusBadge>{action.status}</StatusBadge></div></div>{manage && !["verified", "cancelled"].includes(action.status) ? <form action={updateIncidentActionState} className="flex gap-2">{hidden}<input type="hidden" name="id" value={action.id} /><Select name="status"><option value="in_progress">En ejecución</option>{close ? <option value="verified">Verificada</option> : null}<option value="cancelled">Cancelada</option></Select><Button size="sm" variant="secondary">Actualizar</Button></form> : null}</article>)}</section> : null}
      {sensitive && incidentEvidence.length ? <div className="flex flex-wrap gap-2">{incidentEvidence.map((evidence: any) => <form key={evidence.id} action={downloadIncidentEvidence}>{hidden}<input type="hidden" name="document_version_id" value={evidence.document_version_id} /><Button size="sm" variant="secondary">Descargar evidencia protegida</Button></form>)}</div> : null}
      <details className="rounded-[10px] bg-[var(--muted-surface)] p-3"><summary className="cursor-pointer text-sm font-medium">Trazabilidad del caso</summary><div className="mt-3 grid gap-2 text-sm text-[var(--muted-strong)]">{incidentPeople.map((person: any) => <p key={person.id}>{roleLabels[person.role] ?? "Persona relacionada"} · {person.display_reference ?? "Referencia protegida"}</p>)}{investigation ? causes.filter((cause: any) => cause.incident_investigation_id === investigation.id).map((cause: any) => <p key={cause.id}>{causeLabels[cause.cause_type] ?? "Causa"}: {cause.description}</p>) : null}{communications.filter((item: any) => item.incident_id === incident.id).map((item: any) => <p key={item.id}>{communicationLabels[item.communication_type] ?? "Comunicación"} · <StatusBadge>{item.status}</StatusBadge></p>)}</div></details>
      {close && incident.status !== "closed" ? <form action={updateIncidentState}>{hidden}<input type="hidden" name="id" value={incident.id} /><input type="hidden" name="status" value="closed" /><Button variant="secondary">Cerrar caso tras verificar investigación y acciones</Button></form> : null}
      </CardContent></Card>;
    }) : <EmptyState title="No hay incidentes en esta vista" description={q || status !== "all" ? "Cambia los filtros para ampliar la búsqueda." : "Los usuarios autorizados pueden registrar el primer reporte."} />}</section>
    <p className="text-sm text-[var(--muted)]">Página {page} · se muestran hasta {PAGE_SIZE} casos.</p>
  </main>;
}
