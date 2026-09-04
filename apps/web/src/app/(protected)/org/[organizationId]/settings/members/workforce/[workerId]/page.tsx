import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Buildings, EnvelopeSimple, IdentificationCard, MapPin } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
import { requireTenant } from "@/modules/organizations/tenant";

export default async function WorkerDetailPage({ params }: { params: Promise<{ organizationId: string; workerId: string }> }) {
  const { organizationId, workerId } = await params;
  await requireTenant(organizationId);
  const [canRead, canManage] = await Promise.all([can(organizationId, "imports.read"), can(organizationId, "imports.manage")]);
  if (!canRead) return <EmptyState title="Sin acceso" description="No tienes permiso para consultar la nómina operativa." />;

  const supabase = await createClient();
  const { data: worker } = await supabase.from("workers").select("*").eq("organization_id", organizationId).eq("id", workerId).maybeSingle();
  if (!worker) notFound();

  const [entityResult, siteResult, areaResult, importResult] = await Promise.all([
    supabase.from("legal_entities").select("legal_name").eq("organization_id", organizationId).eq("id", worker.legal_entity_id).maybeSingle(),
    worker.site_id ? supabase.from("sites").select("name").eq("organization_id", organizationId).eq("id", worker.site_id).maybeSingle() : Promise.resolve({ data: null }),
    worker.area_id ? supabase.from("areas").select("name").eq("organization_id", organizationId).eq("id", worker.area_id).maybeSingle() : Promise.resolve({ data: null }),
    worker.imported_from_job_id ? supabase.from("import_jobs").select("file_name,completed_at").eq("organization_id", organizationId).eq("id", worker.imported_from_job_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return (
    <main className="grid gap-7">
      <Link href={`/org/${organizationId}/settings/members?view=workforce`} className={`${buttonVariants({ variant: "link" })} w-fit`}><ArrowLeft size={16} />Volver a nómina operativa</Link>
      <PageHeader
        eyebrow="Trabajador"
        title={`${worker.first_name} ${worker.last_name}`}
        description="Registro operativo de la empresa. No concede acceso a la plataforma ni almacena información clínica."
        action={canManage ? <Button asChild variant="secondary"><Link href={`/org/${organizationId}/imports`}>Gestionar mediante importación</Link></Button> : null}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4"><div><h2 className="font-semibold">Información laboral</h2><p className="mt-1 text-sm text-[var(--muted)]">Datos mínimos necesarios para organizar actividades y responsables.</p></div><StatusBadge>{worker.status}</StatusBadge></CardHeader>
          <CardContent>
            <dl className="grid gap-6 sm:grid-cols-2">
              <Info icon={<IdentificationCard size={18} />} label="Código de trabajador" value={worker.employee_code} mono />
              <Info icon={<EnvelopeSimple size={18} />} label="Correo laboral" value={worker.work_email ?? "No registrado"} />
              <Info icon={<Buildings size={18} />} label="Razón social" value={entityResult.data?.legal_name ?? "No disponible"} />
              <Info icon={<MapPin size={18} />} label="Sede" value={siteResult.data?.name ?? "Sin sede asignada"} />
              <Info icon={<MapPin size={18} />} label="Área" value={areaResult.data?.name ?? "Sin área asignada"} />
              <Info icon={<IdentificationCard size={18} />} label="Última actualización" value={new Date(worker.updated_at).toLocaleDateString("es-CO", { dateStyle: "long" })} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold">Origen del registro</h2><p className="mt-1 text-sm text-[var(--muted)]">La trazabilidad ayuda a corregir la fuente sin crear duplicados.</p></CardHeader>
          <CardContent>
            {importResult.data ? <div className="rounded-[10px] bg-[var(--muted-surface)] p-4"><p className="text-sm font-semibold">Importación de nómina</p><p className="mt-2 break-words text-sm text-[var(--muted)]">Archivo: {importResult.data.file_name}</p><p className="mt-1 text-xs text-[var(--muted)]">Procesada {importResult.data.completed_at ? new Date(importResult.data.completed_at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "pendiente"}</p></div> : <div className="rounded-[10px] bg-[var(--muted-surface)] p-4"><p className="text-sm font-semibold">Registro operativo</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">No está vinculado a una importación disponible.</p></div>}
            <p className="mt-5 text-xs leading-5 text-[var(--muted)]">Los cambios de nómina se gestionan desde Importaciones para conservar validación por fila, auditoría y reversión segura.</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Info({ icon, label, value, mono = false }: { icon: ReactNode; label: string; value: string; mono?: boolean }) {
  return <div><dt className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">{icon}{label}</dt><dd className={`mt-2 text-sm font-semibold ${mono ? "font-mono tabular-nums" : ""}`}>{value}</dd></div>;
}
