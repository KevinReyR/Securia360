import { describe, expect, it } from "vitest";
import { assessmentCreateSchema, assessmentItemSchema, classificationProposalSchema, snapshotSchema } from "./schemas";

const id = "10000000-0000-4000-8000-000000000001";
describe("compliance schemas", () => {
  it("requires explicit, tenant-safe classification inputs", () => {
    expect(classificationProposalSchema.safeParse({ organizationId: id, employee_count: 25, risk_class: 3, ciiu_code: "1234", economic_activity: "Actividad", standard_profile_id: id, evaluator_version_id: id, proposed_effective_from: "2026-08-28", reason: "Cambio de trabajadores" }).success).toBe(true);
    expect(classificationProposalSchema.safeParse({ organizationId: "x", employee_count: -1 }).success).toBe(false);
  });
  it("requires immutable snapshot reason and structured assessment responses", () => {
    expect(snapshotSchema.safeParse({ organizationId: id, reason: "Cierre mensual", snapshotDate: "2026-08-01" }).success).toBe(true);
    expect(snapshotSchema.safeParse({ organizationId: id, reason: "x" }).success).toBe(false);
    expect(assessmentCreateSchema.safeParse({ organizationId: id, snapshotId: id, scoringRuleId: id, responsibleUserId: "" }).success).toBe(true);
    expect(assessmentItemSchema.safeParse({ organizationId: id, assessmentId: id, itemId: id, response: "met", observation: "", justification: "", responsibleUserId: "" }).success).toBe(true);
  });
});
