import { FormDrawer } from "@/components/form-drawer";
import { OrganizationSettingsNav } from "@/components/organization-settings-nav";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/modules/organizations/core-actions";
import { displayPersonName } from "@/modules/organizations/directory";
import { requireTenant } from "@/modules/organizations/tenant";

export default async function ProfileSettings({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId } = await params;
  const { userId, email } = await requireTenant(organizationId);
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  const { status } = await searchParams;
  const name = displayPersonName(profile, "Completa tu nombre");
  const initials = [profile?.first_name, profile?.last_name].filter(Boolean).map((part) => part?.[0]).join("").toUpperCase() || "TU";

  return (
    <main className="grid gap-7">
      <PageHeader
        eyebrow="Configuración"
        title="Mi perfil"
        description="Estos datos te identifican en las organizaciones donde tienes acceso."
        action={<FormDrawer title="Editar mi perfil" description="Actualiza tus datos personales básicos." triggerLabel="Editar perfil"><form action={updateProfile} className="grid gap-4"><input type="hidden" name="organizationId" value={organizationId} /><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Primer nombre<Input name="first_name" defaultValue={profile?.first_name ?? ""} required /></label><label className="grid gap-2 text-sm font-medium">Segundo nombre<Input name="middle_name" defaultValue={profile?.middle_name ?? ""} /></label><label className="grid gap-2 text-sm font-medium">Primer apellido<Input name="last_name" defaultValue={profile?.last_name ?? ""} required /></label><label className="grid gap-2 text-sm font-medium">Segundo apellido<Input name="second_last_name" defaultValue={profile?.second_last_name ?? ""} /></label></div><label className="grid gap-2 text-sm font-medium">Teléfono<Input name="phone" type="tel" defaultValue={profile?.phone ?? ""} /></label><Button type="submit">Guardar perfil</Button></form></FormDrawer>}
      />
      <OrganizationSettingsNav organizationId={organizationId} current="profile" />
      <StatusBanner status={status} />
      <Card className="max-w-4xl">
        <CardContent className="grid gap-7 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <span className="grid size-20 place-items-center rounded-[18px] bg-[var(--brand)] text-xl font-semibold text-white">{initials}</span>
          <div>
            <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold tracking-[-0.025em]">{name}</h2><StatusBadge>{profile?.status ?? "active"}</StatusBadge></div>
            <p className="mt-2 text-sm text-[var(--muted)]">{email}</p>
            <dl className="mt-6 grid gap-5 border-t border-[var(--border)] pt-5 sm:grid-cols-2"><div><dt className="text-xs text-[var(--muted)]">Teléfono</dt><dd className="mt-1 text-sm font-medium">{profile?.phone ?? "No registrado"}</dd></div><div><dt className="text-xs text-[var(--muted)]">Uso de los datos</dt><dd className="mt-1 text-sm font-medium">Identidad y contacto operativo</dd></div></dl>
          </div>
        </CardContent>
      </Card>
      <p className="max-w-3xl text-xs leading-5 text-[var(--muted)]">Tu perfil se comparte únicamente en los espacios de trabajo a los que perteneces. Los permisos y responsabilidades se administran por separado en cada organización.</p>
    </main>
  );
}
