import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
import { verifyRiskControl } from "@/modules/organizations/core-actions";
import { requireTenant } from "@/modules/organizations/tenant";

const hierarchy = [
  ["ELIMINATION", "Eliminación", "Elimina el peligro en su origen."],
  ["SUBSTITUTION", "Sustitución", "Reemplaza el peligro por una alternativa más segura."],
  ["ENGINEERING", "Ingeniería", "Aísla a las personas mediante diseño o barreras técnicas."],
  ["ADMINISTRATIVE", "Administrativo", "Organiza el trabajo, procedimientos y competencias."],
  ["PPE", "EPP", "Última barrera de protección personal."],
] as const;

function asDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("es-CO") : "Sin fecha";
}

export default async function RisksPage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId } = await params;
  await requireTenant(organizationId);
  const [mayRead, mayValidate, supabase] = await Promise.all([can(organizationId, "risks.read"), can(organizationId, "risks.validate"), createClient()]);
  if (!mayRead) return <EmptyState title="Sin permiso para ver riesgos" description="Solicita acceso de lectura de riesgos a un administrador." />;

  const [{ data: controls }, { data: alerts }] = await Promise.all([
    supabase.from("risk_controls").select("id,control_type,description,status,effectiveness,target_date,next_verification_at,last_verified_at,task_id,improvement_action_id,evidence_document_version_id").eq("organization_id", organizationId).order("target_date", { ascending: true, nullsFirst: false }),
    supabase.from("risk_control_alerts").select("id,risk_control_id,alert_type,detected_at").eq("organization_id", organizationId).is("resolved_at", null).order("detected_at", { ascending: false }),
  ]);
  const openAlerts = alerts ?? [];
  const controlAlerts = new Map(openAlerts.map((alert) => [alert.risk_control_id, alert.alert_type]));
  const { status } = await searchParams;

  return <div className="grid gap-7"><PageHeader eyebrow="Matriz de peligros" title="Controles y seguimiento" description="La jerarquía orienta la priorización; la decisión y verificación siguen siendo responsabilidad profesional." /><StatusBanner status={status} />
    <div className="grid gap-3 sm:grid-cols-3"><KpiCard label="Controles registrados" value={controls?.length ?? 0} /><KpiCard label="Alertas abiertas" value={openAlerts.length} /><KpiCard label="Verificados" value={controls?.filter((control) => control.last_verified_at).length ?? 0} /></div>
    <Card><CardHeader><h2 className="font-semibold">Jerarquía de controles</h2></CardHeader><CardContent><ol className="grid gap-2 lg:grid-cols-5">{hierarchy.map(([code, label, description], index) => <li key={code} className="rounded-lg border border-[var(--border)] p-3"><p className="text-xs font-bold text-[var(--brand)]">{index + 1}. {label}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</p></li>)}</ol></CardContent></Card>
    {mayValidate && controls?.length ? <Card><CardHeader><h2 className="font-semibold">Registrar verificación</h2></CardHeader><CardContent><form action={verifyRiskControl} className="grid gap-3 sm:grid-cols-2"><input type="hidden" name="organizationId" value={organizationId} /><label className="grid gap-1 text-sm font-medium sm:col-span-2">Control<select name="risk_control_id" required className="min-h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm">{controls.map((control) => <option key={control.id} value={control.id}>{control.description}</option>)}</select></label><label className="grid gap-1 text-sm font-medium">Eficacia<select name="effectiveness" defaultValue="effective" className="min-h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm"><option value="effective">Eficaz</option><option value="partially_effective">Parcialmente eficaz</option><option value="ineffective">Ineficaz</option></select></label><label className="grid gap-1 text-sm font-medium">Próxima verificación<Input name="next_verification_at" type="date" /></label><label className="grid gap-1 text-sm font-medium sm:col-span-2">Conclusión<textarea name="verification_note" required minLength={3} className="min-h-24 rounded-md border border-[var(--border)] px-3 py-2 text-sm" /></label><div className="sm:col-span-2"><Button type="submit">Guardar verificación</Button></div></form></CardContent></Card> : null}
    <Card><CardHeader><h2 className="font-semibold">Seguimiento de controles</h2></CardHeader><CardContent className="grid gap-3">{controls?.length ? hierarchy.map(([type, label]) => {
      const entries = controls.filter((control) => control.control_type === type);
      if (!entries.length) return null;
      return <section key={type} className="grid gap-2"><h3 className="text-sm font-semibold">{label}</h3>{entries.map((control) => {
        const alert = controlAlerts.get(control.id);
        return <article key={control.id} className="rounded-lg border border-[var(--border)] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{control.description}</strong><div className="flex gap-2">{alert ? <StatusBadge status="danger">{alert === "overdue" ? "Vencido" : "Ineficaz"}</StatusBadge> : null}<StatusBadge status={control.effectiveness === "effective" ? "active" : control.effectiveness === "ineffective" ? "danger" : "pending"}>{control.effectiveness ?? "Pendiente de verificar"}</StatusBadge></div></div><p className="mt-1 text-xs text-[var(--muted)]">Objetivo: {asDate(control.target_date)} · Próxima verificación: {asDate(control.next_verification_at)} · {control.evidence_document_version_id ? "Evidencia privada vinculada" : "Sin evidencia vinculada"}</p><p className="mt-1 text-xs text-[var(--muted)]">{control.task_id ? "Tarea vinculada" : "Sin tarea"} · {control.improvement_action_id ? "Acción de mejora vinculada" : "Sin acción de mejora"}</p></article>;
      })}</section>;
    }) : <EmptyState title="Sin controles registrados" description="Registra una identificación de riesgo y agrega controles estructurados para iniciar el seguimiento." />}</CardContent></Card></div>;
}
