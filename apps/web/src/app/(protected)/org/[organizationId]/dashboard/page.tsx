import { ArrowRight, CalendarCheck, CheckCircle, Clock, FileText, Gauge, MapPin, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { loadRoleDashboard } from "@/modules/workspace/dashboard";
import { requireTenant } from "@/modules/organizations/tenant";

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "America/Bogota" }).format(new Date(value));
}

export default async function TenantDashboard({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const { organization } = await requireTenant(organizationId);
  const dashboard = await loadRoleDashboard(organizationId);
  const score = dashboard.latestAssessment?.score;

  return (
    <div className="grid gap-7">
      <PageHeader title={`Inicio de ${organization.name}`} description="Prioridades, avance y próximos pasos de tu gestión." action={<Button asChild><Link href={`/org/${organizationId}/planning`}>Ver trabajo pendiente <ArrowRight size={17} /></Link></Button>} />

      {dashboard.hasErrors ? <div role="status" className="flex items-start gap-3 rounded-[12px] border border-[var(--warning-border)] bg-[var(--warning-soft)] p-4 text-sm text-[var(--warning)]"><WarningCircle size={19} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Algunos indicadores no están disponibles</p><p className="mt-1 opacity-90">Puedes continuar trabajando. Actualiza la página en unos minutos para consultar el resumen completo.</p></div></div> : null}

      <section aria-label="Indicadores principales" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Evaluación SG-SST" value={typeof score === "number" ? `${score.toLocaleString("es-CO", { maximumFractionDigits: 1 })}%` : "Sin evaluar"} description={dashboard.latestAssessment ? "Último resultado disponible" : "Inicia una evaluación cuando el contenido esté revisado"} icon={<Gauge size={19} />} />
        <KpiCard label="Tareas abiertas" value={dashboard.metrics.open_tasks ?? 0} description={dashboard.latestPlan ? `${dashboard.latestPlan.name} · ${dashboard.latestPlan.year}` : "Sin plan anual activo"} icon={<CalendarCheck size={19} />} />
        <KpiCard label="Acciones de mejora" value={dashboard.metrics.open_actions ?? 0} description="Pendientes de ejecución o verificación" icon={<CheckCircle size={19} />} />
        <KpiCard label="Próximos vencimientos" value={dashboard.dueSoon} description="Tareas, acciones y documentos en 30 días" icon={<Clock size={19} />} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle>Requiere tu atención</CardTitle><CardDescription>Lo más próximo a vencer aparece primero.</CardDescription></div><Badge variant="neutral">{dashboard.inbox.length} pendientes</Badge></CardHeader>
          <CardContent className="p-0">
            {dashboard.inbox.length ? <ul className="divide-y divide-[var(--border)]">{dashboard.inbox.map((item) => {
              return <li key={`${item.type}-${item.id}`}><Link href={item.href} className="group grid gap-2 px-5 py-4 outline-none transition-colors hover:bg-[var(--muted-surface)] focus-visible:bg-[var(--muted-surface)] sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${item.priority === "critical" || item.overdue ? "bg-[var(--danger)]" : item.priority === "high" ? "bg-[var(--warning)]" : "bg-[var(--brand)]"}`} /><p className="truncate text-sm font-semibold">{item.title}</p></div><p className="ml-4 mt-1 text-xs text-[var(--muted)]">{item.context} · {item.dueLabel}</p></div><span className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">{formatDate(item.dueAt)}<ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></span></Link></li>;
            })}</ul> : <div className="p-5"><EmptyState title="Todo al día" description="No hay tareas, acciones ni documentos próximos que requieran atención." /></div>}
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader><CardTitle>Estado por sede</CardTitle><CardDescription>Alcance operativo disponible.</CardDescription></CardHeader>
            <CardContent>{dashboard.sites.length ? <ul className="grid gap-1">{dashboard.sites.slice(0, 5).map((site) => <li key={site.id} className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-2.5"><span className="flex min-w-0 items-center gap-2.5 text-sm font-medium"><MapPin size={17} className="shrink-0 text-[var(--brand)]" /><span className="truncate">{site.name}</span></span><span className="text-xs text-[var(--success)]">Activa</span></li>)}</ul> : <EmptyState title="Sin sedes configuradas" description="Agrega una sede para organizar el trabajo operativo." action={<Button size="sm" variant="secondary" asChild><Link href={`/org/${organizationId}/settings/structure`}>Configurar estructura</Link></Button>} />}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Accesos rápidos</CardTitle></CardHeader>
            <CardContent className="grid gap-1">
              {[["Plan anual y tareas", "planning", CalendarCheck], ["Documentos y evidencias", "documents", FileText], ["Riesgos y controles", "risks", Gauge]].map(([label, suffix, Icon]) => <Link key={String(label)} href={`/org/${organizationId}/${suffix}`} className="flex min-h-10 items-center justify-between rounded-[10px] px-3 text-sm font-semibold outline-none transition-colors hover:bg-[var(--muted-surface)] focus-visible:ring-2 focus-visible:ring-[var(--brand)]"><span className="flex items-center gap-2.5"><Icon size={17} className="text-[var(--brand)]" />{String(label)}</span><ArrowRight size={16} /></Link>)}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
