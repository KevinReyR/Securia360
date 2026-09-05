import { describe, expect, it } from "vitest";
import { resolveInitialDestination, type OrganizationSummary } from "./tenant";

const organizations: OrganizationSummary[] = [
  { id: "org-a", name: "Empresa A", slug: "empresa-a", status: "active" },
  { id: "org-b", name: "Empresa B", slug: "empresa-b", status: "active" },
];

describe("initial authenticated destination", () => {
  it("sends active internal operators to platform administration", () => {
    expect(resolveInitialDestination({ internalRole: "saas_admin", organizations: [], preferredOrganizationId: null })).toBe("/internal/saas-admin");
    expect(resolveInitialDestination({ internalRole: "saas_support", organizations, preferredOrganizationId: "org-b" })).toBe("/internal/saas-admin");
  });

  it("preserves the organization flow for regular users", () => {
    expect(resolveInitialDestination({ internalRole: null, organizations, preferredOrganizationId: "org-b" })).toBe("/org/org-b/dashboard");
    expect(resolveInitialDestination({ internalRole: null, organizations: [], preferredOrganizationId: null })).toBe("/organizations");
  });
});
