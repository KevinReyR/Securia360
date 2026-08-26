import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createOrganization } from "@/modules/organizations/core-actions";
import { listOrganizations } from "@/modules/organizations/tenant";
import { switchOrganization } from "@/modules/organizations/tenant-actions";

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const organizations = await listOrganizations();
  const { error } = await searchParams;
  return (
    <main className="mx-auto min-h-[100dvh] max-w-5xl px-5 py-10">
      <header className="mb-8">
        <p className="text-sm font-bold tracking-wide text-[var(--brand)]">SECURIA360</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Elige una organización</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Cada empresa mantiene datos, permisos y navegación completamente separados.</p>
      </header>
      {error ? <p role="alert" className="mb-5 rounded-lg bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger)]">No fue posible completar la operación.</p> : null}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader><h2 className="font-semibold">Tus organizaciones</h2></CardHeader>
          <CardContent className="grid gap-3">
            {organizations.length ? organizations.map((organization) => (
              <form key={organization.id} action={switchOrganization} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-4">
                <input type="hidden" name="organizationId" value={organization.id} />
                <div className="min-w-0"><p className="truncate font-semibold">{organization.name}</p><p className="text-sm text-[var(--muted)]">{organization.slug}</p></div>
                <Button type="submit" variant="secondary">Abrir</Button>
              </form>
            )) : <p className="py-8 text-center text-sm text-[var(--muted)]">Aún no perteneces a ninguna organización.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Crear organización</h2></CardHeader>
          <CardContent>
            <form action={createOrganization} className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">Nombre<Input name="name" required minLength={2} /></label>
              <label className="grid gap-2 text-sm font-medium">Identificador URL<Input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="empresa-colombia" /></label>
              <label className="grid gap-2 text-sm font-medium">NIT<Input name="nit" /></label>
              <Button type="submit">Crear y configurar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
