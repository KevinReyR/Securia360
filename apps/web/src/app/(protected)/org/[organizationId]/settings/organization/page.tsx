import Link from "next/link";
import { ArrowRight, Buildings, MapPin, TreeStructure, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { FormDrawer } from "@/components/form-drawer";
import { OrganizationSettingsNav } from "@/components/organization-settings-nav";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
import { updateOrganization } from "@/modules/organizations/core-actions";
import { requireTenant } from "@/modules/organizations/tenant";

export default async function OrganizationSettings({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId } = await params;
  const { organization } = await requireTenant(organizationId);
  const { status } = await searchParams;
  const supabase = await createClient();
  const [canUpdate, entitiesResult, sitesResult, areasResult, membersResult] = await Promise.all([
    can(organizationId, "organization.update"),
    supabase.from("legal_entities").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("sites").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("areas").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
  ]);

  const metrics = [
    { label: "Razones sociales", value: entitiesResult.count ?? 0, icon: Buildings },
    { label: "Sedes activas", value: sitesResult.count ?? 0, icon: MapPin },
    { label: "Áreas activas", value: areasResult.count ?? 0, icon: TreeStructure },
    { label: "Personas con acceso", value: membersResult.count ?? 0, icon: UsersThree },
  ];

  return (
    <main className="grid gap-7">
      <PageHeader
        eyebrow="Configuración"
        title="Organización"
        description="Una vista clara de la empresa, su estructura y las personas que pueden trabajar en ella."
        action={canUpdate ? (
          <FormDrawer title="Editar organización" description="Actualiza la identidad principal de la empresa." triggerLabel="Editar datos">
            <form action={updateOrganization} className="grid gap-4">
              <input type="hidden" name="organizationId" value={organizationId} />
              <label className="grid gap-2 text-sm font-medium">Nombre<Input name="name" defaultValue={organization.name} required /></label>
              <label className="grid gap-2 text-sm font-medium">Dirección corta<Input name="slug" defaultValue={organization.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /><span className="text-xs font-normal text-[var(--muted)]">Se usa en enlaces internos. Escribe minúsculas y guiones.</span></label>
              <label className="grid gap-2 text-sm font-medium">NIT<Input name="nit" defaultValue={organization.nit ?? ""} /></label>
              <Button type="submit">Guardar cambios</Button>
            </form>
          </FormDrawer>
        ) : null}
      />
      <OrganizationSettingsNav organizationId={organizationId} current="organization" />
      <StatusBanner status={status} />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)]">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b border-[var(--border)] bg-[var(--muted-surface)] px-6 py-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid size-14 shrink-0 place-items-center rounded-[14px] bg-[var(--brand)] text-white"><Buildings size={27} weight="duotone" aria-hidden /></span>
                  <div className="min-w-0"><h2 className="truncate text-xl font-semibold tracking-[-0.025em]">{organization.name}</h2><p className="mt-1 text-sm text-[var(--muted)]">{organization.nit ? `NIT ${organization.nit}` : "NIT pendiente de registrar"}</p></div>
                </div>
                <StatusBadge>{organization.status}</StatusBadge>
              </div>
            </div>
            <dl className="grid gap-px bg-[var(--border)] sm:grid-cols-2">
              <div className="bg-[var(--surface)] px-6 py-5"><dt className="text-xs font-medium text-[var(--muted)]">País</dt><dd className="mt-1.5 text-sm font-semibold">{organization.country_code === "CO" ? "Colombia" : organization.country_code}</dd></div>
              <div className="bg-[var(--surface)] px-6 py-5"><dt className="text-xs font-medium text-[var(--muted)]">Zona horaria</dt><dd className="mt-1.5 text-sm font-semibold">{organization.timezone}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold">Siguiente paso recomendado</h2><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Mantén la estructura al día para asignar responsables y filtrar el trabajo por sede.</p></CardHeader>
          <CardContent className="grid gap-2">
            <Link href={`/org/${organizationId}/settings/structure`} className="group flex items-center justify-between rounded-[10px] px-3 py-3 text-sm font-medium transition-colors hover:bg-[var(--muted-surface)]">Revisar estructura <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" /></Link>
            <Link href={`/org/${organizationId}/settings/members`} className="group flex items-center justify-between rounded-[10px] px-3 py-3 text-sm font-medium transition-colors hover:bg-[var(--muted-surface)]">Gestionar personas <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" /></Link>
            <Link href={`/org/${organizationId}/onboarding`} className="group flex items-center justify-between rounded-[10px] px-3 py-3 text-sm font-medium transition-colors hover:bg-[var(--muted-surface)]">Revisar configuración inicial <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" /></Link>
          </CardContent>
        </Card>
      </section>

      <section aria-label="Resumen de estructura" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-4 border-b border-[var(--border)] px-1 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)]"><Icon size={20} weight="duotone" aria-hidden /></span>
            <div><p className="font-mono text-2xl font-semibold tabular-nums tracking-[-0.04em]">{value}</p><p className="mt-0.5 text-xs text-[var(--muted)]">{label}</p></div>
          </div>
        ))}
      </section>
    </main>
  );
}
