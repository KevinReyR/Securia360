import { describe, expect, it } from "vitest";
import { artifactSchema, decisionSchema, proposalSchema, reviewerSchema } from "./schemas";

const id = "8cd058fb-6a76-4af6-8e16-9260442b6b9f";

describe("normative review validation", () => {
  it("requires a confirmed-account-ready reviewer payload", () => {
    expect(reviewerSchema.safeParse({ email: "expert@example.com", role: "reviewer", status: "active", reason: "Experta SST acreditada" }).success).toBe(true);
    expect(reviewerSchema.safeParse({ email: "not-an-email", role: "reviewer", status: "active", reason: "ok" }).success).toBe(false);
  });

  it("rejects malformed editorial content and invalid transitions", () => {
    expect(artifactSchema.safeParse({ artifactType: "UI_TEXT", artifactKey: "ui.disclaimer", title: "Advertencia", sourcePath: "src/a.tsx", content: '{"text":"Revisión humana"}' }).success).toBe(true);
    expect(proposalSchema.safeParse({ artifactId: id, content: "[]", rationale: "Corregir alcance" }).success).toBe(false);
    expect(decisionSchema.safeParse({ artifactId: id, proposalId: null, decision: "approved", note: "Aprobado por criterio profesional" }).success).toBe(true);
  });
});
