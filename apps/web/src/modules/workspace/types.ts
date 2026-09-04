import type { PermissionCode } from "@/modules/auth/permissions";

export type ExperienceProfile = "executive" | "sst_operations" | "worker" | "auditor" | "administrator";

export type WorkspaceContext = {
  user: { id: string; displayName: string; email: string; initials: string };
  organization: { id: string; name: string; slug: string };
  siteId: string | null;
  permissions: PermissionCode[];
  experienceProfile: ExperienceProfile;
};

export type ActionInboxItem = {
  id: string;
  type: "task" | "improvement" | "document";
  title: string;
  context: string;
  priority: "low" | "normal" | "high" | "critical";
  dueAt: string | null;
  dueLabel: string;
  overdue: boolean;
  href: string;
};

export type EntityReference = {
  id: string;
  kind: "task" | "improvement" | "document" | "site";
  label: string;
  detail: string;
  href: string;
};
export type PageState = "loading" | "empty" | "error" | "forbidden" | "ready";

export function deriveExperienceProfile(permissions: readonly PermissionCode[]): ExperienceProfile {
  const values = new Set(permissions);
  if (values.has("members.roles_manage") && values.has("organization.update")) return "administrator";
  if (values.has("analytics.read") && (values.has("tasks.approve") || values.has("audits.approve"))) return "executive";
  if (values.has("audits.read") && !values.has("risks.manage")) return "auditor";
  if (values.has("tasks.update_status") && !values.has("planning.manage")) return "worker";
  return "sst_operations";
}

export const experienceProfileLabels: Record<ExperienceProfile, string> = {
  administrator: "Administración",
  executive: "Dirección",
  sst_operations: "Gestión SST",
  worker: "Trabajo asignado",
  auditor: "Auditoría",
};
