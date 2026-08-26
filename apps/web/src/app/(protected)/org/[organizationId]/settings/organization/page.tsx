import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateOrganization } from "@/modules/organizations/core-actions";
import { requireTenant } from "@/modules/organizations/tenant";

export default async function OrganizationSettings({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId } = await params;
  const { organization } = await requireTenant(organizationId);
  const { status } = await searchParams;
  return <div><PageHeader title="Organización" description="Identidad y configuración general del tenant activo." action={<Link className="text-sm font-semibold text-[var(--brand)]" href={`/org/${organizationId}/settings/profile`}>Editar mi perfil</Link>} /><div className="mt-6"><StatusBanner status={status} /><Card className="max-w-3xl"><CardContent><form action={updateOrganization} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="organizationId" value={organizationId} /><label className="grid gap-2 text-sm font-medium sm:col-span-2">Nombre<Input name="name" defaultValue={organization.name} required /></label><label className="grid gap-2 text-sm font-medium">Identificador URL<Input name="slug" defaultValue={organization.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label><label className="grid gap-2 text-sm font-medium">NIT<Input name="nit" defaultValue={organization.nit ?? ""} /></label><div className="sm:col-span-2"><Button type="submit">Guardar organización</Button></div></form></CardContent></Card></div></div>;
}
