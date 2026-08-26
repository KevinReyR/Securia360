import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  const metrics = [
    ["Cumplimiento SG-SST", "Sin evaluación", "La evaluación normativa se habilitará en la siguiente etapa."],
    ["Razones sociales", String(entities.count ?? 0), "Estructura jurídica activa"],
    ["Sedes", String(sites.count ?? 0), "Centros de trabajo activos"],
    ["Áreas", String(areas.count ?? 0), "Áreas organizacionales activas"],
    ["Miembros", String(members.count ?? 0), "Personas con acceso activo"],
  ];
  return (
    <div className="grid gap-7">
      <PageHeader title={`Hola, ${organization.name}`} description="Este es el estado del núcleo empresarial de tu organización." action={<Badge>Tenant protegido</Badge>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, metric, help]) => <Card key={label}><CardContent><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-3 text-2xl font-semibold tracking-tight">{metric}</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{help}</p></CardContent></Card>)}
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <Card><CardContent><h2 className="font-semibold">Próximos vencimientos</h2><div className="mt-5"><EmptyState title="Sin vencimientos registrados" description="Los documentos, tareas y alertas se conectarán en las etapas operativas posteriores." /></div></CardContent></Card>
        <Card><CardContent><h2 className="font-semibold">Configuración del núcleo</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Completa la estructura para preparar los módulos SG-SST.</p><div className="mt-5 grid gap-2"><Link href={`/org/${organizationId}/settings/structure`} className="flex items-center justify-between rounded-lg bg-[var(--muted-surface)] px-4 py-3 text-sm font-semibold hover:bg-[var(--brand-soft)]">Estructura empresarial<ArrowRight size={17} /></Link><Link href={`/org/${organizationId}/settings/members`} className="flex items-center justify-between rounded-lg bg-[var(--muted-surface)] px-4 py-3 text-sm font-semibold hover:bg-[var(--brand-soft)]">Miembros y roles<ArrowRight size={17} /></Link></div></CardContent></Card>
      </section>
    </div>
  );
}
