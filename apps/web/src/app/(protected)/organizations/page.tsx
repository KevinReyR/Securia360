import { ArrowRight, Buildings, GearSix, Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { createOrganization } from "@/modules/organizations/core-actions";
import { organizationCreationMessage } from "@/modules/organizations/creation-feedback";
import { listOrganizations } from "@/modules/organizations/tenant";
import { switchOrganization } from "@/modules/organizations/tenant-actions";
import { getCurrentSaasRole } from "@/modules/saas/access";

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [organizations, internalSaasRole] = await Promise.all([listOrganizations(), getCurrentSaasRole()]);
  const { error } = await searchParams;
  return (
    <main className="min-h-[100dvh] bg-[var(--background)] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
      <BrandMark />
      <header className="mb-8 mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-[var(--brand)]">Espacio de trabajo</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">¿Dónde quieres trabajar?</h1><p className="mt-2 text-sm text-[var(--muted)]">Elige una empresa para continuar. Podrás cambiarla después.</p></div>
        <details className="group relative"><summary className="inline-flex h-10 cursor-pointer list-none items-center justify-center gap-2 rounded-[10px] bg-[var(--brand)] px-4 text-sm font-semibold text-white outline-none hover:bg-[var(--brand-hover)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] [&::-webkit-details-marker]:hidden"><Plus size={17} />Nueva organización</summary><Card className="absolute right-0 top-12 z-10 w-[min(92vw,420px)] shadow-[var(--shadow-overlay)]"><CardHeader><h2 className="font-semibold">Crear organización</h2><p className="mt-1 text-sm text-[var(--muted)]">Solo necesitamos lo esencial. Completarás los datos en el siguiente paso.</p></CardHeader><CardContent><form action={createOrganization} className="grid gap-4"><label className="grid gap-2 text-sm font-medium">Nombre<Input name="name" required minLength={2} /></label><label className="grid gap-2 text-sm font-medium">Dirección corta<Input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="empresa-colombia" /><span className="text-xs font-normal text-[var(--muted)]">Usa minúsculas y guiones.</span></label><label className="grid gap-2 text-sm font-medium">NIT <span className="text-xs font-normal text-[var(--muted)]">Opcional</span><Input name="nit" /></label><Button type="submit">Crear y continuar</Button></form></CardContent></Card></details>
      </header>
      {error ? <p role="alert" className="mb-5 rounded-lg bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger)]">{organizationCreationMessage(error)}</p> : null}
      {internalSaasRole ? <Card className="mb-5 border-[var(--brand-border)] bg-[var(--brand-soft)]"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-[var(--brand)] text-white"><GearSix size={22} weight="duotone" /></span><div><p className="font-semibold">Administración de plataforma</p><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Gestiona la operación comercial y el soporte de Reinova Labs en un espacio separado de las empresas.</p></div></div><Button asChild><Link href="/internal/saas-admin">Abrir administración <ArrowRight size={17} /></Link></Button></CardContent></Card> : null}
      <Card>
          <CardHeader><h2 className="font-semibold">Tus organizaciones</h2><p className="mt-1 text-sm text-[var(--muted)]">{organizations.length ? `${organizations.length} ${organizations.length === 1 ? "organización disponible" : "organizaciones disponibles"}` : "Aún no tienes una organización"}</p></CardHeader>
          <CardContent className="grid gap-2">
            {organizations.length ? organizations.map((organization) => (
              <form key={organization.id} action={switchOrganization} className="group flex items-center justify-between gap-4 rounded-[12px] border border-transparent p-4 transition-colors hover:border-[var(--border)] hover:bg-[var(--muted-surface)]">
                <input type="hidden" name="organizationId" value={organization.id} />
                <div className="flex min-w-0 items-center gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-[var(--brand-soft)] text-[var(--brand)]"><Buildings size={22} weight="duotone" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-semibold">{organization.name}</p>{organization.slug === "empresa-demo-colombia" ? <StatusBadge status="warning">Datos de demostración</StatusBadge> : null}</div><p className="mt-1 text-sm text-[var(--muted)]">{organization.status === "active" ? "Lista para trabajar" : "Acceso limitado"}</p></div></div>
                <Button type="submit" variant="ghost">Abrir <ArrowRight size={17} /></Button>
              </form>
            )) : <div className="py-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-[14px] bg-[var(--muted-surface)] text-[var(--muted)]"><Buildings size={24} /></span><h2 className="mt-4 font-semibold">Crea tu primera organización</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">Configura la empresa y continúa con el asistente de puesta en marcha.</p></div>}
          </CardContent>
      </Card>
      </div>
    </main>
  );
}
