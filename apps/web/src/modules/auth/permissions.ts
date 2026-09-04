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
  "risks.read",
  "risks.manage",
  "risks.validate",
  "planning.read",
  "planning.manage",
  "tasks.update_status",
  "tasks.approve",
  "training.read",
  "training.manage",
  "training.validate",
  "training.participants",
  "ppe.read",
  "ppe.manage",
  "ppe.validate",
  "contractors.read",
  "contractors.manage",
  "contractors.approve",
  "incidents.read",
  "incidents.manage",
  "incidents.sensitive",
  "incidents.close",
  "occupational_health.read",
  "occupational_health.manage",
  "occupational_health.hr_sensitive",
  "occupational_health.medical",
  "occupational_health.confirm",
  "emergencies.read",
  "emergencies.manage",
  "emergencies.approve",
  "emergencies.directory_read",
  "committees.read",
  "committees.manage",
  "committees.approve",
  "audits.read",
  "audits.manage",
  "audits.approve",
  "analytics.read",
  "analytics.manage",
  "analytics.approve",
  "notifications.read",
  "notifications.manage",
  "notifications.templates_approve",
  "automations.read",
  "automations.manage",
  "automations.approve",
  "imports.read",
  "imports.manage",
  "copilot.read",
  "copilot.manage",
  "copilot.confirm_critical",
  "billing.read",
  "billing.manage",
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

export async function listPermissionCodes(organizationId: string, userId: string): Promise<PermissionCode[]> {
  const supabase = await createClient();
  const { data: membership } = await supabase.from("organization_members").select("id").eq("organization_id", organizationId).eq("user_id", userId).eq("status", "active").maybeSingle();
  if (!membership) return [];
  const { data: assignments } = await supabase.from("member_roles").select("role_id").eq("organization_id", organizationId).eq("organization_member_id", membership.id);
  const roleIds = [...new Set((assignments ?? []).map((assignment) => assignment.role_id))];
  if (!roleIds.length) return ["organization.read"];
  const { data } = await supabase.from("role_permissions").select("permissions!inner(code)").in("role_id", roleIds);
  const known = new Set<string>(permissionCodes);
  return [...new Set((data ?? []).flatMap((row) => {
    const permission = row.permissions as unknown as { code?: string } | null;
    return permission?.code && known.has(permission.code) ? [permission.code as PermissionCode] : [];
  }))];
}
