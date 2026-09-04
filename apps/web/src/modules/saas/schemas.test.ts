import { describe, expect, it } from "vitest";
import { subscriptionSchema, supportSessionSchema } from "./schemas";

const id = "8cd058fb-6a76-4af6-8e16-9260442b6b9f";

describe("SaaS administration validation", () => {
  it("validates a commercial period without affecting authorization", () => {
    expect(subscriptionSchema.safeParse({ organizationId: id, planId: id, status: "trialing", trialEndsAt: "2026-09-30T18:00", periodStart: "2026-09-01T00:00", periodEnd: "2026-09-30T23:59", note: "Prueba comercial" }).success).toBe(true);
    expect(subscriptionSchema.safeParse({ organizationId: id, planId: id, status: "active", trialEndsAt: "", periodStart: "2026-10-01T00:00", periodEnd: "2026-09-01T00:00", note: "" }).success).toBe(false);
  });

  it("requires an existing session for start and end transitions", () => {
    expect(supportSessionSchema.safeParse({ organizationId: id, action: "request", reason: "Acompañamiento solicitado", sessionId: null }).success).toBe(true);
    expect(supportSessionSchema.safeParse({ organizationId: id, action: "end", reason: "Trabajo completado", sessionId: null }).success).toBe(false);
  });
});
