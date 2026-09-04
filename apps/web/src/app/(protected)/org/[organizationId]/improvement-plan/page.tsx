import { EmptyState } from "@/components/empty-state";
import { FormDrawer } from "@/components/form-drawer";
import { PageHeader } from "@/components/page-header";
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
import { attachImprovementEvidence, closeImprovementGap, updateImprovementAction, validateImprovementAction } from "@/modules/organizations/improvement-actions";
import { ImprovementActionCreateForm } from "@/modules/organizations/improvement-action-create-form";
import { ImprovementStatusBanner } from "@/modules/organizations/improvement-status-banner";
import { requireTenant } from "@/modules/organizations/tenant";

const flow = ["Detectar", "Priorizar", "Asignar", "Ejecutar", "Evidenciar", "Verificar", "Mejorar"];
const originLabels: Record<string, string> = { assessment_item: "Evaluación", requirement: "Requisito", finding: "Hallazgo" };
const priorityLabels: Record<string, string> = { critical: "Crítica", high: "Alta", medium: "Media", low: "Baja" };

function actionStatusOptions(status: string) {
  if (status === "pending") return ["pending", "in_progress", "cancelled"];
  if (status === "in_progress") return ["pending", "in_progress", "evidence_submitted", "cancelled"];
  if (status === "evidence_submitted") return ["in_progress", "evidence_submitted", "cancelled"];
  return [];
}

function formatDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("es-CO") : "Sin fecha objetivo";
}

export default async function ImprovementPlanPage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string; q?: string; state?: string; priority?: string; origin?: string; page?: string }> }) {
  const { organizationId } = await params;
  await requireTenant(organizationId);
  const { status, q = "", state = "all", priority = "all", origin = "all", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = 12;
  const [mayRead, mayManage, mayValidate, mayReadDocuments, mayCreateDocuments, supabase] = await Promise.all([can(organizationId, "improvements.read"), can(organizationId, "improvements.manage"), can(organizationId, "improvements.validate"), can(organizationId, "documents.read"), can(organizationId, "documents.create"), createClient()]);
  if (!mayRead) return <EmptyState title="Sin permiso para ver el plan" description="Solicita acceso de lectura de mejoramiento a un administrador." />;

  let gapsQuery = supabase.from("improvement_gaps").select("id,title,description,priority,status,origin_type,created_at", { count: "exact" }).eq("organization_id", organizationId).order("created_at", { ascending: false });
  if (q.trim()) gapsQuery = gapsQuery.ilike("title", `%${q.trim().replace(/[%_]/g, "")}%`);
  if (state !== "all") gapsQuery = gapsQuery.eq("status", state);
  if (priority !== "all") gapsQuery = gapsQuery.eq("priority", priority);
  if (origin !== "all") gapsQuery = gapsQuery.eq("origin_type", origin);
  const [gapsResult, allActions, membersResult, versionsResult] = await Promise.all([
    gapsQuery.range((currentPage - 1) * pageSize, currentPage * pageSize - 1),
    supabase.from("improvement_actions").select("id,gap_id,title,description,priority,status,target_date,responsible_user_id,evidence_document_version_id,validation_note").eq("organization_id", organizationId).order("created_at", { ascending: true }),
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
  const gaps = gapsResult.data ?? [];
  const actions = allActions.data ?? [];
  const actionsByGap = new Map<string, typeof actions>();
  actions.forEach((action) => actionsByGap.set(action.gap_id, [...(actionsByGap.get(action.gap_id) ?? []), action]));
  const pending = actions.filter((item) => !["verified", "cancelled"].includes(item.status)).length;
  const totalPages = Math.max(1, Math.ceil((gapsResult.count ?? 0) / pageSize));
  const pageHref = (nextPage: number) => `/org/${organizationId}/improvement-plan?${new URLSearchParams({ ...(q ? { q } : {}), ...(state !== "all" ? { state } : {}), ...(priority !== "all" ? { priority } : {}), ...(origin !== "all" ? { origin } : {}), page: String(nextPage) }).toString()}`;

  return <div className="grid gap-7">
    <PageHeader eyebrow="Cierre de brechas" title="Plan de mejoramiento" description="Gestiona brechas, acciones, evidencias y validación sin duplicar el resultado de los recálculos." />
    <ImprovementStatusBanner status={status} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Brechas abiertas" value={gapsResult.count ?? 0} /><KpiCard label="Acciones pendientes" value={pending} /><KpiCard label="Con evidencia" value={actions.filter((item) => item.evidence_document_version_id).length} /><KpiCard label="Validadas" value={actions.filter((item) => item.status === "verified").length} /></div>
    <Card><CardHeader><h2 className="font-semibold">Flujo de mejora continua</h2></CardHeader><CardContent><ol className="flex flex-wrap gap-2">{flow.map((step, index) => <li key={step} className="rounded-full bg-[var(--muted-surface)] px-3 py-1.5 text-sm font-medium">{index + 1}. {step}</li>)}</ol></CardContent></Card>
    <form method="get" className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2 xl:grid-cols-[1.5fr_repeat(3,1fr)_auto]"><Input name="q" aria-label="Buscar brechas" defaultValue={q} placeholder="Buscar por título" /><Select name="state" aria-label="Filtrar por estado" defaultValue={state}><option value="all">Todos los estados</option><option value="open">Abiertas</option><option value="resolved">Resueltas</option></Select><Select name="priority" aria-label="Filtrar por prioridad" defaultValue={priority}><option value="all">Todas las prioridades</option><option value="critical">Crítica</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></Select><Select name="origin" aria-label="Filtrar por origen" defaultValue={origin}><option value="all">Todos los orígenes</option><option value="assessment_item">Evaluación</option><option value="requirement">Requisito</option><option value="finding">Hallazgo</option></Select><Button type="submit" variant="secondary">Filtrar</Button></form>
    {totalPages > 1 ? <nav aria-label="Paginación de brechas" className="flex justify-end gap-3 text-sm"><a href={pageHref(Math.max(1, currentPage - 1))} aria-disabled={currentPage === 1} className="text-[var(--brand)]">Anterior</a><span className="text-[var(--muted)]">Página {currentPage} de {totalPages}</span><a href={pageHref(Math.min(totalPages, currentPage + 1))} aria-disabled={currentPage === totalPages} className="text-[var(--brand)]">Siguiente</a></nav> : null}
    <section className="grid gap-5" aria-label="Brechas y acciones">{gaps.length ? gaps.map((gap) => {
      const gapActions = actionsByGap.get(gap.id) ?? [];
      const hasVerifiedAction = gapActions.some((action) => action.status === "verified");
      return <Card key={gap.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{gap.title}</h2><Badge>{originLabels[gap.origin_type] ?? "Otro origen"}</Badge><StatusBadge status={gap.priority === "critical" ? "danger" : gap.priority === "high" ? "warning" : "inactive"}>{priorityLabels[gap.priority] ?? gap.priority}</StatusBadge><StatusBadge status={gap.status === "resolved" ? "active" : "pending"}>{gap.status}</StatusBadge></div>{gap.description ? <p className="mt-2 text-sm text-[var(--muted)]">{gap.description}</p> : null}<p className="mt-2 text-xs text-[var(--muted)]">Origen: {originLabels[gap.origin_type] ?? "Otro"} · Detectada: {new Date(gap.created_at).toLocaleDateString("es-CO")}</p></div><div className="flex flex-wrap gap-2">{mayManage && gap.status !== "resolved" ? <FormDrawer triggerLabel="Nueva acción" title="Nueva acción de mejora" description="Define el trabajo, responsable, prioridad y fecha objetivo para cerrar esta brecha."><ImprovementActionCreateForm organizationId={organizationId} gapId={gap.id} defaultPriority={gap.priority} members={(membersResult.data ?? []).map((member) => ({ id: member.user_id, label: profiles.get(member.user_id) ?? "Persona sin nombre" }))} /></FormDrawer> : null}{mayValidate && gap.status !== "resolved" && hasVerifiedAction ? <form action={closeImprovementGap}><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="gap_id" value={gap.id} /><Button type="submit" size="sm" variant="secondary">Cerrar brecha validada</Button></form> : null}</div></div></CardHeader><CardContent className="grid gap-5">
        <div className="grid gap-4">{gapActions.length ? gapActions.map((action) => <article key={action.id} className="grid gap-4 rounded-lg border border-[var(--border)] p-4"><div><div className="flex flex-wrap items-center gap-2"><strong>{action.title}</strong><StatusBadge status={action.status === "verified" ? "active" : action.status === "evidence_submitted" ? "pending" : action.status === "cancelled" ? "danger" : "inactive"}>{action.status}</StatusBadge><StatusBadge status={action.priority === "critical" ? "danger" : action.priority === "high" ? "warning" : "inactive"}>{priorityLabels[action.priority] ?? action.priority}</StatusBadge></div>{action.description ? <p className="mt-2 text-sm text-[var(--muted)]">{action.description}</p> : null}<p className="mt-2 text-xs text-[var(--muted)]">{formatDate(action.target_date)} · {action.responsible_user_id ? `Responsable: ${profiles.get(action.responsible_user_id) ?? "Persona sin nombre"}` : "Sin responsable"} · {action.evidence_document_version_id ? "Evidencia vinculada" : "Sin evidencia"}</p>{action.validation_note ? <p className="mt-2 text-xs text-[var(--muted)]">Validación: {action.validation_note}</p> : null}</div>
          {mayManage && actionStatusOptions(action.status).length ? <form action={updateImprovementAction} className="grid gap-3 rounded-lg bg-[var(--muted-surface)] p-3 md:grid-cols-2"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="action_id" value={action.id} /><input type="hidden" name="evidence_document_version_id" value={action.evidence_document_version_id ?? ""} /><input type="hidden" name="validation_note" value={action.validation_note ?? ""} /><label className="grid gap-1 text-sm font-medium md:col-span-2">Título<Input name="title" required defaultValue={action.title} /></label><label className="grid gap-1 text-sm font-medium md:col-span-2">Descripción<Textarea name="description" defaultValue={action.description ?? ""} /></label><label className="grid gap-1 text-sm font-medium">Estado<Select name="status" defaultValue={action.status}>{actionStatusOptions(action.status).map((item) => <option key={item} value={item}>{presentStatus(item).label}</option>)}</Select></label><label className="grid gap-1 text-sm font-medium">Prioridad<Select name="priority" defaultValue={action.priority}>{["critical", "high", "medium", "low"].map((item) => <option key={item} value={item}>{priorityLabels[item]}</option>)}</Select></label><label className="grid gap-1 text-sm font-medium">Responsable<Select name="responsible_user_id" defaultValue={action.responsible_user_id ?? ""}><option value="">Sin asignar</option>{membersResult.data?.map((member) => <option key={member.id} value={member.user_id}>{profiles.get(member.user_id) ?? "Persona sin nombre"}</option>)}</Select></label><label className="grid gap-1 text-sm font-medium">Fecha objetivo<Input name="target_date" type="date" defaultValue={action.target_date ?? ""} /></label><div><Button type="submit" size="sm" variant="secondary">Guardar acción</Button></div></form> : null}
          {mayManage && (mayReadDocuments || mayCreateDocuments) && !["verified", "cancelled"].includes(action.status) ? <form action={attachImprovementEvidence} encType="multipart/form-data" className="grid gap-3 rounded-lg border border-[var(--border)] p-3 md:grid-cols-2"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="action_id" value={action.id} />{mayReadDocuments ? <label className="grid gap-1 text-sm font-medium">Usar versión existente<Select name="existing_version_id" defaultValue=""><option value="">{mayCreateDocuments ? "Selecciona o carga un archivo" : "Selecciona una versión"}</option>{selectableVersions.map((version) => <option key={version.id} value={version.id}>{documents.get(version.document_id)} · v{version.version_number} · {version.original_name}</option>)}</Select></label> : <input type="hidden" name="existing_version_id" value="" />}{mayCreateDocuments ? <label className="grid gap-1 text-sm font-medium">Cargar evidencia privada<Input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" /></label> : null}<div className="md:col-span-2"><Button type="submit" size="sm" variant="secondary">Vincular evidencia</Button></div></form> : null}
          {mayValidate && action.status === "evidence_submitted" ? <form action={validateImprovementAction} className="grid gap-3 rounded-lg border border-[var(--border)] p-3"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="action_id" value={action.id} /><label className="grid gap-1 text-sm font-medium">Nota de validación<Textarea name="validation_note" required minLength={3} placeholder="Describe la verificación realizada." /></label><div><Button type="submit" size="sm">Validar y cerrar acción</Button></div></form> : null}
        </article>) : <EmptyState title="Sin acciones" description="Crea una acción concreta para gestionar esta brecha sin afectar las acciones generadas automáticamente." />}</div>
      </CardContent></Card>;
    }) : <EmptyState title="Sin brechas detectadas" description="Los resultados no cumplidos de una evaluación crearán una brecha y su acción inicial sin duplicarse en recálculos posteriores." />}</section>
  </div>;
}
