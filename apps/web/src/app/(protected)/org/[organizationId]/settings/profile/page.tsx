import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/modules/organizations/core-actions";
import { requireTenant } from "@/modules/organizations/tenant";

export default async function ProfileSettings({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId } = await params;
  const { userId } = await requireTenant(organizationId);
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  const { status } = await searchParams;
  return <div><PageHeader title="Mi perfil" description="Datos personales compartidos entre las organizaciones a las que perteneces." /><div className="mt-6"><StatusBanner status={status} /><Card className="max-w-3xl"><CardContent><form action={updateProfile} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="organizationId" value={organizationId} /><label className="grid gap-2 text-sm font-medium">Primer nombre<Input name="first_name" defaultValue={profile?.first_name ?? ""} required /></label><label className="grid gap-2 text-sm font-medium">Segundo nombre<Input name="middle_name" defaultValue={profile?.middle_name ?? ""} /></label><label className="grid gap-2 text-sm font-medium">Primer apellido<Input name="last_name" defaultValue={profile?.last_name ?? ""} required /></label><label className="grid gap-2 text-sm font-medium">Segundo apellido<Input name="second_last_name" defaultValue={profile?.second_last_name ?? ""} /></label><label className="grid gap-2 text-sm font-medium sm:col-span-2">Teléfono<Input name="phone" type="tel" defaultValue={profile?.phone ?? ""} /></label><div className="sm:col-span-2"><Button type="submit">Guardar perfil</Button></div></form></CardContent></Card></div></div>;
}
