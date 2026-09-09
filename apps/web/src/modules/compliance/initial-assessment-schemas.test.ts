import { describe, expect, it } from "vitest";
import { initialAssessmentCompleteSchema, initialAssessmentResponseSchema } from "./initial-assessment-schemas";
import { countPendingAssessmentItems } from "./assessment-presentation";

const organizationId = "11111111-1111-4111-8111-111111111111";
const assessmentId = "22222222-2222-4222-8222-222222222222";
const itemId = "33333333-3333-4333-8333-333333333333";

describe("evaluación inicial empresarial", () => {
  it("admite únicamente Cumple o No cumple", () => {
    expect(initialAssessmentResponseSchema.safeParse({ organizationId, assessmentId, itemId, response: "met" }).success).toBe(true);
    expect(initialAssessmentResponseSchema.safeParse({ organizationId, assessmentId, itemId, response: "not_met" }).success).toBe(true);
    expect(initialAssessmentResponseSchema.safeParse({ organizationId, assessmentId, itemId, response: "pending" }).success).toBe(false);
    expect(initialAssessmentResponseSchema.safeParse({ organizationId, assessmentId, itemId, response: "not_applicable" }).success).toBe(false);
  });

  it("valida la finalización y cuenta respuestas pendientes", () => {
    expect(initialAssessmentCompleteSchema.safeParse({ organizationId, assessmentId }).success).toBe(true);
    expect(countPendingAssessmentItems([{ response: "met" }, { response: "pending" }, { response: "not_met" }])).toBe(1);
  });
});
