import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SgsstFlowNav } from "@/components/sgsst-flow-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { presentStatus } from "@/lib/status-presentation";
import { can } from "@/modules/auth/permissions";
import { ImprovementActionCreateForm } from "@/modules/organizations/improvement-action-create-form";
import { attachImprovementEvidence, closeImprovementGap, updateImprovementAction, validateImprovementAction } from "@/modules/organizations/improvement-actions";
import { ImprovementStatusBanner } from "@/modules/organizations/improvement-status-banner";
import { requireTenant } from "@/modules/organizations/tenant";

const flow = ["Detectar", "Priorizar", "Asignar", "Ejecutar", "Evidenciar", "Verificar", "Mejorar"];
const originLabels: Record<string, string> = { assessment_item: "Evaluación", requirement: "Requisito", finding: "Hallazgo" };

function actionStatusOptions(status: string) {
  if (status === "pending") return ["pending", "in_progress", "cancelled"];
  if (status === "in_progress") return ["pending", "in_progress", "evidence_submitted", "cancelled"];
  if (status === "evidence_submitted") return ["in_progress", "evidence_submitted", "cancelled"];
  return [];
}

function formatDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("es-CO") : "Sin fecha";
}

type SearchParams = { status?: string; q?: string; state?: string; priority?: string; origin?: string; actionState?: string; focus?: string; page?: string };

export default async function ImprovementPlanPage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<SearchParams> }) {
  const { organizationId } = await params;
  await requireTenant(organizationId);
  const { status, q = "", state = "all", priority = "all", origin = "all", actionState = "active", focus, page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = 12;
  const [mayRead, mayManage, mayValidate, mayReadDocuments, mayCreateDocuments, supabase] = await Promise.all([
    can(organizationId, "improvements.read"),
    can(organizationId, "improvements.manage"),
    can(organizationId, "improvements.validate"),
    can(organizationId, "documents.read"),
    can(organizationId, "documents.create"),
    createClient(),
  ]);
  if (!mayRead) return <EmptyState title="Sin permiso para ver el plan" description="Solicita acceso de lectura de mejoramiento a un administrador." />;

  let gapsQuery = supabase.from("improvement_gaps").select("id,title,description,priority,status,origin_type,created_at", { count: "exact" }).eq("organization_id", organizationId).order("created_at", { ascending: false });
  if (q.trim()) gapsQuery = gapsQuery.ilike("title", `%${q.trim().replace(/[%_]/g, "")}%`);
  if (state !== "all") gapsQuery = gapsQuery.eq("status", state);
  if (priority !== "all") gapsQuery = gapsQuery.eq("priority", priority);
  if (origin !== "all") gapsQuery = gapsQuery.eq("origin_type", origin);

  let actionsQuery = supabase.from("improvement_actions").select("id,gap_id,title,description,priority,status,target_date,responsible_user_id,evidence_document_version_id,validation_note").eq("organization_id", organizationId).order("created_at", { ascending: true });
  if (actionState === "open") actionsQuery = actionsQuery.not("status", "in", "(verified,cancelled)");
  else if (actionState !== "all") actionsQuery = actionsQuery.neq("status", "cancelled");

  const [gapsResult, allActions, membersResult, versionsResult] = await Promise.all([
    gapsQuery.range((currentPage - 1) * pageSize, currentPage * pageSize - 1),
    actionsQuery,
    supabase.from("organization_members").select("id,user_id").eq("organization_id", organizationId).eq("status", "active").order("created_at"),
    supabase.from("document_versions").select("id,document_id,version_number,original_name").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
  ]);
  const memberIds = membersResult.data?.map((member) => member.user_id) ?? [];
  const documentIds = versionsResult.data?.map((version) => version.document_id) ?? [];
  const [profilesResult, documentsResult] = await Promise.all([
    memberIds.length ? supabase.from("profiles").select("id,first_name,last_name").in("id", memberIds) : Promise.resolve({ data: [] }),
    documentIds.length ? supabase.from("documents").select("id,title,status").eq("organization_id", organizationId).in("id", documentIds).neq("status", "deleted") : Promise.resolve({ data: [] }),
  ]);
  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Usuario"]));
  const documents = new Map((documentsResult.data ?? []).map((document) => [document.id, document.title]));
  const selectableVersions = (versionsResult.data ?? []).filter((version) => documents.has(version.document_id));
  const memberOptions = (membersResult.data ?? []).map((member) => ({ id: member.user_id, label: profiles.get(member.user_id) ?? "Persona sin nombre" }));
  const actions = allActions.data ?? [];
  const gaps = actionState === "open" ? (gapsResult.data ?? []).filter((gap) => actions.some((action) => action.gap_id === gap.id)) : (gapsResult.data ?? []);
  const actionsByGap = new Map<string, typeof actions>();
  actions.forEach((action) => actionsByGap.set(action.gap_id, [...(actionsByGap.get(action.gap_id) ?? []), action]));
  const pending = actions.filter((item) => !["verified", "cancelled"].includes(item.status)).length;
  const totalPages = Math.max(1, Math.ceil((gapsResult.count ?? 0) / pageSize));
  const pageHref = (nextPage: number) => `/org/${organizationId}/improvement-plan?${new URLSearchParams({ ...(q ? { q } : {}), ...(state !== "all" ? { state } : {}), ...(priority !== "all" ? { priority } : {}), ...(origin !== "all" ? { origin } : {}), ...(actionState !== "active" ? { actionState } : {}), page: String(nextPage) }).toString()}`;

  return <div className="grid gap-7">
    <PageHeader eyebrow="Cierre de oportunidades de mejora" title="Plan de mejoramiento" description="Convierte cada brecha en trabajo concreto, asigna responsables y conserva la evidencia de su cierre." />
    <SgsstFlowNav organizationId={organizationId} current="improvement" />
    <ImprovementStatusBanner status={status} />
    {focus ? <p role="status" className="rounded-[10px] border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-3 py-2 text-sm text-[var(--brand)]">Mostrando la acción seleccionada desde Inicio.</p> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Oportunidades abiertas" value={gapsResult.count ?? 0} /><KpiCard label="Acciones pendientes" value={pending} /><KpiCard label="Con evidencia" value={actions.filter((item) => item.evidence_document_version_id).length} /><KpiCard label="Validadas" value={actions.filter((item) => item.status === "verified").length} /></div>
    <Card><CardContent className="py-4"><ol aria-label="Flujo de mejora continua" className="flex flex-wrap items-center gap-x-2 gap-y-2">{flow.map((step, index) => <li key={step} className="flex items-center gap-2 text-sm font-medium text-[var(--muted-strong)]"><span className="grid size-6 place-items-center rounded-full bg-[var(--muted-surface)] text-xs tabular-nums">{index + 1}</span>{step}{index < flow.length - 1 ? <span aria-hidden className="hidden text-[var(--border-strong)] sm:inline">/</span> : null}</li>)}</ol></CardContent></Card>
    <form method="get" className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2 xl:grid-cols-[1.5fr_repeat(3,1fr)_auto]"><Input name="q" aria-label="Buscar oportunidades de mejora" defaultValue={q} placeholder="Buscar por título" /><Select name="state" aria-label="Filtrar por estado" defaultValue={state}><option value="all">Todos los estados</option><option value="open">Abiertas</option><option value="resolved">Resueltas</option></Select><Select name="priority" aria-label="Filtrar por prioridad" defaultValue={priority}><option value="all">Todas las prioridades</option><option value="critical">Crítica</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></Select><Select name="origin" aria-label="Filtrar por origen" defaultValue={origin}><option value="all">Todos los orígenes</option><option value="assessment_item">Evaluación</option><option value="requirement">Requisito</option><option value="finding">Hallazgo</option></Select><Button type="submit" variant="secondary">Filtrar</Button></form>
    {totalPages > 1 ? <nav aria-label="Paginación de oportunidades de mejora" className="flex justify-end gap-3 text-sm"><a href={pageHref(Math.max(1, currentPage - 1))} aria-disabled={currentPage === 1} className="text-[var(--brand)]">Anterior</a><span className="text-[var(--muted)]">Página {currentPage} de {totalPages}</span><a href={pageHref(Math.min(totalPages, currentPage + 1))} aria-disabled={currentPage === totalPages} className="text-[var(--brand)]">Siguiente</a></nav> : null}
    <section className="grid gap-5" aria-label="Oportunidades de mejora y acciones">{gaps.length ? gaps.map((gap) => {
      const gapActions = actionsByGap.get(gap.id) ?? [];
      const hasVerifiedAction = gapActions.some((action) => action.status === "verified");
      return <Card key={gap.id} className="overflow-hidden"><CardHeader className="bg-[var(--surface)]"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold tracking-[-0.015em]">{gap.title}</h2><Badge>{originLabels[gap.origin_type] ?? "Otro origen"}</Badge><StatusBadge>{gap.priority}</StatusBadge><StatusBadge>{gap.status}</StatusBadge></div>{gap.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{gap.description}</p> : null}<p className="mt-2 text-xs text-[var(--muted)]">Detectada el {new Date(gap.created_at).toLocaleDateString("es-CO")} · {gapActions.length} {gapActions.length === 1 ? "acción" : "acciones"}</p></div>{mayValidate && gap.status !== "resolved" && hasVerifiedAction ? <form action={closeImprovementGap}><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="gap_id" value={gap.id} /><Button type="submit" size="sm" variant="secondary">Cerrar oportunidad validada</Button></form> : null}</div></CardHeader><CardContent className="grid gap-4 bg-[var(--muted-surface)]/35">
        {mayManage && gap.status !== "resolved" ? <ImprovementActionCreateForm organizationId={organizationId} gapId={gap.id} defaultPriority={gap.priority} members={memberOptions} /> : null}
        {gapActions.length ? <div className="grid gap-2">{gapActions.map((action) => <details key={action.id} id={`action-${action.id}`} tabIndex={-1} open={focus === action.id} className={`group scroll-mt-6 overflow-hidden rounded-[12px] border bg-[var(--surface)] outline-none transition-[border-color,box-shadow] focus-visible:border-[var(--brand)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${focus === action.id ? "border-[var(--brand)] ring-2 ring-[var(--focus-ring)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"}`}>
          <summary className="grid cursor-pointer list-none gap-3 px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm">{action.title}</strong><StatusBadge>{action.status}</StatusBadge><StatusBadge>{action.priority}</StatusBadge></div><p className="mt-1.5 text-xs text-[var(--muted)]">{action.responsible_user_id ? profiles.get(action.responsible_user_id) ?? "Persona sin nombre" : "Sin responsable"} · {formatDate(action.target_date)} · {action.evidence_document_version_id ? "Con evidencia" : "Sin evidencia"}</p></div>
            <span className="inline-flex items-center gap-1 justify-self-start text-xs font-semibold text-[var(--brand)] md:justify-self-end">Ver detalle <CaretDown size={15} className="transition-transform group-open:rotate-180" /></span>
          </summary>
          <div className="grid gap-4 border-t border-[var(--border)] p-4">
            {action.description ? <div><p className="text-xs font-semibold text-[var(--muted)]">Descripción</p><p className="mt-1 max-w-3xl text-sm leading-6">{action.description}</p></div> : null}
            {action.validation_note ? <p className="rounded-lg bg-[var(--success-soft)] px-3 py-2 text-sm text-[var(--success)]"><strong>Validación:</strong> {action.validation_note}</p> : null}
            {mayManage && actionStatusOptions(action.status).length ? <form action={updateImprovementAction} className="grid gap-3 rounded-[10px] bg-[var(--muted-surface)] p-3 md:grid-cols-2"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="action_id" value={action.id} /><input type="hidden" name="evidence_document_version_id" value={action.evidence_document_version_id ?? ""} /><input type="hidden" name="validation_note" value={action.validation_note ?? ""} /><label className="grid gap-1 text-sm font-medium md:col-span-2">Acción<Input name="title" required defaultValue={action.title} /></label><label className="grid gap-1 text-sm font-medium md:col-span-2">Descripción<Textarea name="description" defaultValue={action.description ?? ""} /></label><label className="grid gap-1 text-sm font-medium">Estado<Select name="status" defaultValue={action.status}>{actionStatusOptions(action.status).map((item) => <option key={item} value={item}>{presentStatus(item).label}</option>)}</Select></label><label className="grid gap-1 text-sm font-medium">Prioridad<Select name="priority" defaultValue={action.priority}>{["critical", "high", "medium", "low"].map((item) => <option key={item} value={item}>{presentStatus(item).label}</option>)}</Select></label><label className="grid gap-1 text-sm font-medium">Responsable<Select name="responsible_user_id" defaultValue={action.responsible_user_id ?? ""}><option value="">Sin asignar</option>{memberOptions.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</Select></label><label className="grid gap-1 text-sm font-medium">Fecha objetivo<Input name="target_date" type="date" defaultValue={action.target_date ?? ""} /></label><div className="md:col-span-2"><Button type="submit" size="sm" variant="secondary">Guardar cambios</Button></div></form> : null}
            {mayManage && (mayReadDocuments || mayCreateDocuments) && !["verified", "cancelled"].includes(action.status) ? <form action={attachImprovementEvidence} encType="multipart/form-data" className="grid gap-3 rounded-[10px] border border-[var(--border)] p-3 md:grid-cols-2"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="action_id" value={action.id} />{mayReadDocuments ? <label className="grid gap-1 text-sm font-medium">Usar versión existente<Select name="existing_version_id" defaultValue=""><option value="">{mayCreateDocuments ? "Selecciona o carga un archivo" : "Selecciona una versión"}</option>{selectableVersions.map((version) => <option key={version.id} value={version.id}>{documents.get(version.document_id)} · v{version.version_number} · {version.original_name}</option>)}</Select></label> : <input type="hidden" name="existing_version_id" value="" />}{mayCreateDocuments ? <label className="grid gap-1 text-sm font-medium">Cargar evidencia privada<Input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" /></label> : null}<div className="md:col-span-2"><Button type="submit" size="sm" variant="secondary">Vincular evidencia</Button></div></form> : null}
            {mayValidate && action.status === "evidence_submitted" ? <form action={validateImprovementAction} className="grid gap-3 rounded-[10px] border border-[var(--success-border)] bg-[var(--success-soft)] p-3"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="action_id" value={action.id} /><label className="grid gap-1 text-sm font-medium">Nota de validación<Textarea name="validation_note" required minLength={3} placeholder="Describe la verificación realizada." /></label><div><Button type="submit" size="sm">Validar y cerrar acción</Button></div></form> : null}
          </div>
        </details>)}</div> : <div className="rounded-[12px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-5 py-6"><p className="font-semibold">Aún no hay acciones definidas</p><p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">Agrega el primer trabajo concreto para empezar a cerrar esta oportunidad de mejora.</p></div>}
      </CardContent></Card>;
    }) : <EmptyState title="Sin oportunidades detectadas" description="Los resultados no cumplidos de una evaluación crearán oportunidades de mejora sin generar acciones ficticias." />}</section>
  </div>;
}
