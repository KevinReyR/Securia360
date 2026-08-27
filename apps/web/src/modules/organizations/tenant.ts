import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthorizationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export const ACTIVE_ORGANIZATION_COOKIE = "securia_active_organization";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  if (error || !userId) redirect("/auth/login");
  return { userId, email: typeof claims?.email === "string" ? claims.email : "", supabase };
}

export async function listOrganizations(): Promise<OrganizationSummary[]> {
  await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id,name,slug,status")
    .eq("status", "active")
    .order("name");
  if (error) throw new AuthorizationError("No fue posible consultar las organizaciones.");
  return data;
}

export async function requireTenant(organizationId: string) {
  const { userId, email } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("id,name,slug,nit,country_code,timezone,status,settings")
    .eq("id", organizationId)
    .eq("status", "active")
    .maybeSingle();
  if (error || !organization) throw new AuthorizationError("No tienes acceso a esta organización.");
  return { organization, userId, email };
}

export async function getPreferredOrganizationId() {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;
}

export async function redirectToActiveTenant() {
  const organizations = await listOrganizations();
  if (organizations.length === 0) redirect("/organizations");
  const preferred = await getPreferredOrganizationId();
  const active = organizations.find((item) => item.id === preferred) ?? organizations[0];
  redirect(`/org/${active.id}/dashboard`);
}
