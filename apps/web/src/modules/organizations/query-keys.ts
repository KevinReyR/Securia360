export const tenantQueryKeys = {
  root: (organizationId: string) => ["organization", organizationId] as const,
  dashboard: (organizationId: string) => [...tenantQueryKeys.root(organizationId), "dashboard"] as const,
  members: (organizationId: string) => [...tenantQueryKeys.root(organizationId), "members"] as const,
  structure: (organizationId: string) => [...tenantQueryKeys.root(organizationId), "structure"] as const,
  profile: (organizationId: string) => [...tenantQueryKeys.root(organizationId), "profile"] as const,
};
