import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";

export type SaasInternalRole = "saas_admin" | "saas_support";

export async function getCurrentSaasRole(): Promise<SaasInternalRole | null> {
  const { userId, supabase } = await requireAuthenticatedUser();
  const { data } = await supabase
    .from("saas_admin_roles")
    .select("role,status")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.status === "active" ? data.role as SaasInternalRole : null;
}

export async function requireSaasRole(options: { adminOnly?: boolean } = {}) {
  const authentication = await requireAuthenticatedUser();
  const { data } = await authentication.supabase
    .from("saas_admin_roles")
    .select("role,status")
    .eq("user_id", authentication.userId)
    .maybeSingle();

  const role = data?.status === "active" ? data.role as SaasInternalRole : null;
  if (!role || (options.adminOnly && role !== "saas_admin")) redirect("/organizations");
  return { ...authentication, role };
}
