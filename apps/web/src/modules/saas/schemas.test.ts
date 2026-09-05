import { describe, expect, it } from "vitest";
import { createPlanSchema, planConfiguration, reconciliationResolutionSchema, reconciliationSchema, subscriptionSchema, supportSessionSchema } from "./schemas";

const id = "8cd058fb-6a76-4af6-8e16-9260442b6b9f";
const basePlan = { name: "Empresa", members: "100", sites: "2", storageMb: "2048", copilot: "on", automations: "", imports: "on", analytics: "on", mobile: "" };

describe("SaaS administration validation", () => {
  it("normalizes allowed plan limits and boolean capabilities", () => {
    const parsed = createPlanSchema.parse({ ...basePlan, code: "empresa_2026" });
    expect(parsed.code).toBe("EMPRESA_2026");
    expect(planConfiguration(parsed)).toEqual({ limits: { members: 100, sites: 2, storage_mb: 2048 }, featureFlags: { copilot: true, automations: false, imports: true, analytics: true, mobile: false } });
    expect(createPlanSchema.safeParse({ ...basePlan, code: "plan libre!", members: "-1" }).success).toBe(false);
  });

  it("requires coherent commercial periods and a trial deadline", () => {
    expect(subscriptionSchema.safeParse({ organizationId: id, planVersionId: id, status: "trialing", trialEndsAt: "2026-09-30T18:00", periodStart: "2026-09-01T00:00", periodEnd: "2026-09-30T23:59", customerReference: "", subscriptionReference: "", note: "Prueba" }).success).toBe(true);
    expect(subscriptionSchema.safeParse({ organizationId: id, planVersionId: id, status: "trialing", trialEndsAt: "", periodStart: "2026-10-01T00:00", periodEnd: "2026-09-01T00:00", customerReference: "", subscriptionReference: "", note: "" }).success).toBe(false);
  });

  it("separates pending reconciliation from a human resolution", () => {
    expect(reconciliationSchema.safeParse({ subscriptionId: id, reference: "MAN-001", occurredAt: "2026-09-04T12:00", status: "pending", note: "" }).success).toBe(true);
    expect(reconciliationResolutionSchema.safeParse({ reconciliationId: id, status: "matched", note: "" }).success).toBe(false);
    expect(reconciliationResolutionSchema.safeParse({ reconciliationId: id, status: "matched", note: "Verificada por administración" }).success).toBe(true);
  });

  it("requires an existing session for start and end transitions", () => {
    expect(supportSessionSchema.safeParse({ organizationId: id, action: "request", reason: "Acompañamiento solicitado", sessionId: null }).success).toBe(true);
    expect(supportSessionSchema.safeParse({ organizationId: id, action: "end", reason: "Trabajo completado", sessionId: null }).success).toBe(false);
  });
});
