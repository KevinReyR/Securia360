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
    expect(action.description).toBeUndefined();
    expect(improvementActionCreateSchema.safeParse({ ...action, gap_id: "cross-tenant" }).success).toBe(false);
  });

  it("requires only the action title during quick capture", () => {
    expect(improvementActionCreateSchema.parse({ gap_id: ids.gap_id, title: "Actualizar matriz de peligros" })).toEqual({ gap_id: ids.gap_id, title: "Actualizar matriz de peligros" });
    expect(improvementActionCreateSchema.safeParse({ gap_id: ids.gap_id, title: "" }).success).toBe(false);
  });

  it("keeps expected evidence as editable text separate from an uploaded document", () => {
    const created = improvementActionCreateSchema.parse({ gap_id: ids.gap_id, title: "Conformar el comité", expected_evidence: "Acta de conformación y designaciones" });
    expect(created.expected_evidence).toBe("Acta de conformación y designaciones");
    expect(improvementActionCreateSchema.safeParse({ gap_id: ids.gap_id, title: "Conformar el comité", expected_evidence: "x" }).success).toBe(false);
    const updated = improvementActionUpdateSchema.parse({ ...ids, title: "Conformar el comité", description: "Convocar elecciones", expected_evidence: "Acta firmada", priority: "high", status: "pending", target_date: "", validation_note: "" });
    expect(updated.expected_evidence).toBe("Acta firmada");
    expect(updated.evidence_document_version_id).toBe(ids.evidence_document_version_id);
  });

  it("accepts only known action states and document version identities", () => {
    expect(improvementActionUpdateSchema.safeParse({ ...ids, title: "Acción", description: "Seguimiento", expected_evidence: "", priority: "medium", status: "evidence_submitted", target_date: "", validation_note: "" }).success).toBe(true);
    expect(improvementActionUpdateSchema.safeParse({ ...ids, title: "Acción", description: "", expected_evidence: "", priority: "medium", status: "verified_elsewhere", target_date: "", validation_note: "" }).success).toBe(false);
    expect(improvementEvidenceSchema.safeParse({ action_id: ids.action_id, existing_version_id: "foreign-version" }).success).toBe(false);
  });

  it("requires a meaningful validation note and a valid gap identity to close", () => {
    expect(improvementValidationSchema.safeParse({ action_id: ids.action_id, validation_note: "Verificado en visita" }).success).toBe(true);
    expect(improvementValidationSchema.safeParse({ action_id: ids.action_id, validation_note: "no" }).success).toBe(false);
    expect(improvementGapClosureSchema.safeParse({ gap_id: ids.gap_id }).success).toBe(true);
  });
});
