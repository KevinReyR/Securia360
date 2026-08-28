import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { listOrganizations, requireTenant } from "@/modules/organizations/tenant";

export const dynamic = "force-dynamic";

export default async function OrganizationLayout({ children, params }: { children: React.ReactNode; params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  let tenant;
  try { tenant = await requireTenant(organizationId); } catch { redirect("/organizations?error=access"); }
  const organizations = await listOrganizations();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("first_name,last_name").eq("id", tenant.userId).maybeSingle();
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Usuario Securia360";
  const initials = [profile?.first_name, profile?.last_name].filter(Boolean).map((part) => part!.slice(0, 1)).join("").toUpperCase() || tenant.email.slice(0, 2).toUpperCase() || "US";
  return <AppShell organizationId={organizationId} organizations={organizations} user={{ id: tenant.userId, displayName, email: tenant.email, initials }}>{children}</AppShell>;
}
