import { describe, expect, it } from "vitest";
import { improvementActionCreateSchema, improvementActionUpdateSchema, improvementEvidenceSchema, improvementGapClosureSchema, improvementValidationSchema } from "./improvement-schemas";

describe("improvement workflow schemas", () => {
  const ids = {
    action_id: "10000000-0000-4000-8000-000000000001",
    gap_id: "10000000-0000-4000-8000-000000000002",
    responsible_user_id: "10000000-0000-4000-8000-000000000003",
    evidence_document_version_id: "10000000-0000-4000-8000-000000000004",
  };

  it("normalizes a manual action and requires a valid gap identity", () => {
    const action = improvementActionCreateSchema.parse({ gap_id: ids.gap_id, title: "Corregir evidencia", description: "", priority: "high", target_date: "2026-12-01", responsible_user_id: ids.responsible_user_id });
    expect(action.description).toBeNull();
    expect(improvementActionCreateSchema.safeParse({ ...action, gap_id: "cross-tenant" }).success).toBe(false);
  });

  it("accepts only known action states and document version identities", () => {
    expect(improvementActionUpdateSchema.safeParse({ ...ids, title: "Acción", description: "Seguimiento", priority: "medium", status: "evidence_submitted", target_date: "", validation_note: "" }).success).toBe(true);
    expect(improvementActionUpdateSchema.safeParse({ ...ids, title: "Acción", description: "", priority: "medium", status: "verified_elsewhere", target_date: "", validation_note: "" }).success).toBe(false);
    expect(improvementEvidenceSchema.safeParse({ action_id: ids.action_id, existing_version_id: "foreign-version" }).success).toBe(false);
  });

  it("requires a meaningful validation note and a valid gap identity to close", () => {
    expect(improvementValidationSchema.safeParse({ action_id: ids.action_id, validation_note: "Verificado en visita" }).success).toBe(true);
    expect(improvementValidationSchema.safeParse({ action_id: ids.action_id, validation_note: "no" }).success).toBe(false);
    expect(improvementGapClosureSchema.safeParse({ gap_id: ids.gap_id }).success).toBe(true);
  });
});
