import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { loadWorkspaceContext } from "@/modules/workspace/context";

export const dynamic = "force-dynamic";

export default async function OrganizationLayout({ children, params }: { children: React.ReactNode; params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  let workspace;
  try { workspace = await loadWorkspaceContext(organizationId); } catch { redirect("/organizations?error=access"); }
  return <AppShell organizationId={organizationId} organizations={workspace.organizations} allowedPermissions={workspace.context.permissions} experienceProfile={workspace.context.experienceProfile} isDemo={workspace.isDemo} user={workspace.context.user}>{children}</AppShell>;
}
