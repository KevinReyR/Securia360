import { describe, expect, it } from "vitest";
import { drillSchema, planSchema, resourceSchema } from "./schemas";

const siteId = "00000000-0000-4000-8000-000000000001";

describe("emergency schemas", () => {
  it("rejects negative stock", () =>
    expect(resourceSchema.safeParse({
      site_id: siteId,
      resource_type: "first_aid",
      name: "Botiquín",
      quantity: -1,
      location_description: null,
      inspection_due_at: null,
      expires_at: null,
    }).success).toBe(false));

  it("accepts a versioned plan", () =>
    expect(planSchema.safeParse({
      site_id: siteId,
      version_number: 1,
      summary: "Plan operativo de emergencia actualizado.",
      effective_from: null,
      effective_to: null,
    }).success).toBe(true));

  it("normalizes a local drill date to UTC", () => {
    const result = drillSchema.safeParse({
      site_id: siteId,
      emergency_scenario_id: null,
      emergency_plan_version_id: null,
      title: "Simulacro de evacuación",
      scheduled_at: "2026-09-12T09:30",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.scheduled_at).toMatch(/^2026-09-12T/);
  });
});
