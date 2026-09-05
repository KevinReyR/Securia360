import { createClient } from "@/lib/supabase/server";
import { listPermissionCodes } from "@/modules/auth/permissions";
import { listOrganizations, requireTenant } from "@/modules/organizations/tenant";
import { deriveExperienceProfile, type WorkspaceContext } from "./types";
import { getCurrentSaasRole } from "@/modules/saas/access";

export async function loadWorkspaceContext(organizationId: string) {
  const tenant = await requireTenant(organizationId);
  const supabase = await createClient();
  const [organizations, { data: profile }, permissions, internalSaasRole] = await Promise.all([
    listOrganizations(),
    supabase.from("profiles").select("first_name,last_name").eq("id", tenant.userId).maybeSingle(),
    listPermissionCodes(organizationId, tenant.userId),
    getCurrentSaasRole(),
  ]);
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Usuario Securia360";
  const initials = [profile?.first_name, profile?.last_name].filter(Boolean).map((part) => part!.slice(0, 1)).join("").toUpperCase() || tenant.email.slice(0, 2).toUpperCase() || "US";
  const settings = tenant.organization.settings as { is_demo?: boolean } | null;
  const context: WorkspaceContext = {
    user: { id: tenant.userId, displayName, email: tenant.email, initials },
    organization: { id: tenant.organization.id, name: tenant.organization.name, slug: tenant.organization.slug },
    siteId: null,
    permissions,
    experienceProfile: deriveExperienceProfile(permissions),
  };
  return { context, organizations, internalSaasRole, isDemo: settings?.is_demo === true || tenant.organization.slug === "empresa-demo-colombia" };
}
