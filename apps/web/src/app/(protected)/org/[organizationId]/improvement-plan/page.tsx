import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
import { requireTenant } from "@/modules/organizations/tenant";

const flow = ["Detectar", "Priorizar", "Asignar", "Ejecutar", "Evidenciar", "Verificar", "Mejorar"];

export default async function ImprovementPlanPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  await requireTenant(organizationId);
  const [mayRead, supabase] = await Promise.all([can(organizationId, "improvements.read"), createClient()]);
  if (!mayRead) return <EmptyState title="Sin permiso para ver el plan" description="Solicita acceso de lectura de mejoramiento a un administrador." />;
  const [{ data: gaps }, { data: actions }] = await Promise.all([
    supabase.from("improvement_gaps").select("id,title,priority,status,origin_type,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    supabase.from("improvement_actions").select("id,gap_id,title,priority,status,target_date,evidence_document_version_id").eq("organization_id", organizationId).order("target_date", { ascending: true, nullsFirst: false }),
  ]);
  const pending = actions?.filter((item) => !["verified", "cancelled"].includes(item.status)).length ?? 0;
  return <div className="grid gap-7"><PageHeader eyebrow="Cierre de brechas" title="Plan de mejoramiento" description="Del estándar a la evidencia validada, sin duplicar acciones al recalcular." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Brechas abiertas" value={gaps?.filter((item) => item.status !== "resolved").length ?? 0} /><KpiCard label="Acciones pendientes" value={pending} /><KpiCard label="Con evidencia" value={actions?.filter((item) => item.evidence_document_version_id).length ?? 0} /><KpiCard label="Validadas" value={actions?.filter((item) => item.status === "verified").length ?? 0} /></div>
    <Card><CardHeader><h2 className="font-semibold">Flujo de mejora continua</h2></CardHeader><CardContent><ol className="flex flex-wrap gap-2">{flow.map((step, index) => <li key={step} className="rounded-full bg-[var(--muted-surface)] px-3 py-1.5 text-sm font-medium">{index + 1}. {step}</li>)}</ol></CardContent></Card>
    <div className="grid gap-5 xl:grid-cols-2"><Card><CardHeader><h2 className="font-semibold">Detectar y priorizar</h2></CardHeader><CardContent className="grid gap-3">{gaps?.length ? gaps.map((gap) => <article key={gap.id} className="rounded-lg border border-[var(--border)] p-3"><div className="flex items-center justify-between gap-3"><strong>{gap.title}</strong><StatusBadge status={gap.priority === "critical" ? "danger" : gap.priority === "high" ? "warning" : "inactive"}>{gap.priority}</StatusBadge></div><p className="mt-1 text-xs text-[var(--muted)]">Origen: {gap.origin_type} · Estado: {gap.status}</p></article>) : <EmptyState title="Sin brechas detectadas" description="Los ítems no cumplidos crearán una brecha y su acción inicial al completar la evaluación." />}</CardContent></Card>
    <Card><CardHeader><h2 className="font-semibold">Asignar, ejecutar y verificar</h2></CardHeader><CardContent className="grid gap-3">{actions?.length ? actions.map((action) => <article key={action.id} className="rounded-lg border border-[var(--border)] p-3"><div className="flex items-center justify-between gap-3"><strong>{action.title}</strong><StatusBadge status={action.status === "verified" ? "active" : action.status === "evidence_submitted" ? "pending" : "inactive"}>{action.status}</StatusBadge></div><p className="mt-1 text-xs text-[var(--muted)]">{action.target_date ? `Fecha objetivo: ${new Date(`${action.target_date}T00:00:00`).toLocaleDateString("es-CO")}` : "Sin fecha objetivo"}{action.evidence_document_version_id ? " · Evidencia vinculada" : " · Pendiente de evidencia"}</p></article>) : <EmptyState title="Sin acciones pendientes" description="Las acciones se generan solo una vez por brecha, incluso si la evaluación se recalcula." />}</CardContent></Card></div></div>;
}
