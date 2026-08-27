import { ArrowRight, CalendarCheck, CheckCircle, FileText, Gauge, Timer } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { requireTenant } from "@/modules/organizations/tenant";

export default async function TenantDashboard({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const { organization } = await requireTenant(organizationId);
  const supabase = await createClient();
  const [entities, sites, areas, members] = await Promise.all([
    supabase.from("legal_entities").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("sites").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("areas").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
  ]);
  const structure = [
    ["Razones sociales", entities.count ?? 0],
    ["Sedes", sites.count ?? 0],
    ["Áreas", areas.count ?? 0],
    ["Miembros", members.count ?? 0],
  ];
  return <div className="grid gap-7"><PageHeader eyebrow="Resumen ejecutivo" title={`Hola, ${organization.name}`} description="Una vista clara del estado actual del SG-SST y de la configuración empresarial." action={<StatusBadge status="active">Tenant protegido</StatusBadge>} /><section aria-label="Indicadores principales" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><KpiCard label="Cumplimiento SG-SST" value="Sin evaluar" description="Disponible en la etapa normativa." icon={<Gauge size={19} />} trend={<Badge variant="neutral">Próximamente</Badge>} /><KpiCard label="Plan anual" value="No configurado" description="La planeación se habilitará después." icon={<CalendarCheck size={19} />} /><KpiCard label="Acciones pendientes" value="0" description="Sin acciones registradas todavía." icon={<CheckCircle size={19} />} /><KpiCard label="Documentos" value="0" description="El gestor documental está pendiente." icon={<FileText size={19} />} /><KpiCard label="Próximos vencimientos" value="Sin alertas" description="No hay fechas por atender." icon={<Timer size={19} />} /></section><section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><Card><CardHeader><CardTitle>Próximos vencimientos</CardTitle><CardDescription>Documentos, tareas y seguimientos que necesitarán atención.</CardDescription></CardHeader><CardContent><EmptyState title="Sin vencimientos registrados" description="Las alertas aparecerán aquí cuando se conecten los módulos operativos." /></CardContent></Card><Card><CardHeader><CardTitle>Núcleo empresarial</CardTitle><CardDescription>Elementos activos dentro de la organización.</CardDescription></CardHeader><CardContent><dl className="grid grid-cols-2 gap-3">{structure.map(([label, value]) => <div key={label} className="rounded-lg bg-[var(--muted-surface)] p-3"><dt className="text-xs text-[var(--muted)]">{label}</dt><dd className="mt-1 text-xl font-semibold">{value}</dd></div>)}</dl><div className="mt-5 grid gap-2"><Link href={`/org/${organizationId}/settings/structure`} className="flex min-h-10 items-center justify-between rounded-lg px-3 text-sm font-semibold outline-none transition-colors hover:bg-[var(--brand-soft)] focus-visible:ring-2 focus-visible:ring-[var(--brand)]">Estructura empresarial<ArrowRight size={17} /></Link><Link href={`/org/${organizationId}/settings/members`} className="flex min-h-10 items-center justify-between rounded-lg px-3 text-sm font-semibold outline-none transition-colors hover:bg-[var(--brand-soft)] focus-visible:ring-2 focus-visible:ring-[var(--brand)]">Miembros y roles<ArrowRight size={17} /></Link></div></CardContent></Card></section></div>;
}
