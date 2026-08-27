import { createClient } from "@/lib/supabase/server";

export const permissionCodes = [
  "organization.read",
  "organization.update",
  "members.read",
  "members.create",
  "members.update",
  "members.roles_manage",
  "legal_entities.read",
  "legal_entities.create",
  "legal_entities.update",
  "legal_entities.delete",
  "sites.read",
  "sites.create",
  "sites.update",
  "sites.delete",
  "areas.read",
  "areas.create",
  "areas.update",
  "areas.delete",
  "onboarding.manage",
  "audit.read",
  "documents.read",
  "documents.create",
  "documents.update",
  "documents.delete",
  "classifications.read",
  "classifications.manage",
  "applicability.read",
  "applicability.evaluate",
  "snapshots.read",
  "snapshots.create",
  "assessments.read",
  "assessments.manage",
  "assessments.validate",
  "improvements.read",
  "improvements.manage",
  "improvements.validate",
] as const;

export type PermissionCode = (typeof permissionCodes)[number];

export async function can(organizationId: string, permission: PermissionCode, siteId?: string | null) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("can", {
    p_organization_id: organizationId,
    p_permission_code: permission,
    ...(siteId ? { p_site_id: siteId } : {}),
  });
  return !error && data === true;
}
