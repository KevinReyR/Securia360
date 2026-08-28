import { describe, expect, it } from "vitest";
import { auditEngagementSchema, managementReviewSchema, minutesSchema } from "./schemas";

const id = "00000000-0000-4000-8000-000000000001";
describe("governance schemas", () => {
  it("requires meaningful meeting minutes", () => expect(minutesSchema.safeParse({ committee_meeting_id: id, content: "x" }).success).toBe(false));
  it("accepts an audit with independent approval", () => expect(auditEngagementSchema.safeParse({ audit_program_id: id, site_id: "", title: "Auditoría interna anual", scope_summary: "", criteria: "", require_independent_approval: "true", scheduled_at: "" }).success).toBe(true));
  it("rejects reversed management-review periods", () => expect(managementReviewSchema.safeParse({ period_start: "2026-12-31", period_end: "2026-01-01", chair_user_id: "", minutes_content: "Resumen completo de la revisión." }).success).toBe(false));
});
