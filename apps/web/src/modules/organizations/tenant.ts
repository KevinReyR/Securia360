import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { AuthorizationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export const ACTIVE_ORGANIZATION_COOKIE = "securia_active_organization";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export async function requireAuthenticatedUser() {
  const sessionClient = await createClient();
  const { data: userData, error } = await sessionClient.auth.getUser();
  const { data: sessionData } = await sessionClient.auth.getSession();
  const user = userData.user;
  const accessToken = sessionData.session?.access_token;

  if (error || !user || !accessToken) redirect("/auth/login");

  // Server Actions must forward the verified user JWT to PostgREST. This is
  // a user-scoped client, so every query still runs through RLS.
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createSupabaseClient<Database>(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  return { userId: user.id, email: user.email ?? "", supabase };
}

export async function listOrganizations(): Promise<OrganizationSummary[]> {
  const { supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("organizations")
    .select("id,name,slug,status")
    .eq("status", "active")
    .order("name");
  if (error) throw new AuthorizationError("No fue posible consultar las organizaciones.");
  return data;
}

export async function requireTenant(organizationId: string) {
  const { userId, email, supabase } = await requireAuthenticatedUser();
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
