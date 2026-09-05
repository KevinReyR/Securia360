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

  // Server Actions must forward the verified user JWT to PostgREST. The
  // accessToken callback is Supabase's supported way to prevent the client
  // from falling back to the public key for a database request.
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createSupabaseClient<Database>(url, publishableKey, {
    accessToken: async () => accessToken,
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
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

export function resolveInitialDestination(input: {
  internalRole: string | null;
  organizations: OrganizationSummary[];
  preferredOrganizationId: string | null;
}) {
  if (input.internalRole === "saas_admin" || input.internalRole === "saas_support") return "/internal/saas-admin";
  if (input.organizations.length === 0) return "/organizations";
  const active = input.organizations.find((item) => item.id === input.preferredOrganizationId) ?? input.organizations[0];
  return `/org/${active.id}/dashboard`;
}

export async function redirectToActiveTenant() {
  const { userId, supabase } = await requireAuthenticatedUser();
  const { data: internalRole } = await supabase
    .from("saas_admin_roles")
    .select("role,status")
    .eq("user_id", userId)
    .maybeSingle();
  const organizations = await listOrganizations();
  const preferred = await getPreferredOrganizationId();
  redirect(resolveInitialDestination({
    internalRole: internalRole?.status === "active" ? internalRole.role : null,
    organizations,
    preferredOrganizationId: preferred,
  }));
}
