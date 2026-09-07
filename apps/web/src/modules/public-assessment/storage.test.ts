import { describe, expect, it } from "vitest";
import { createAssessmentRecord } from "./logic";
import { clearAssessments, deleteAssessment, findAssessment, PUBLIC_ASSESSMENT_STORAGE_KEY, readAssessments, saveAssessment } from "./storage";
import type { PublicAssessmentProfile } from "./schemas";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

const profile: PublicAssessmentProfile = {
  code: "RES0312_P07", name: "Perfil de 7 estándares", description: null, versionCode: "1.0.0",
  source: { title: "Resolución 0312 de 2019", versionCode: "2019", officialReference: "Resolución 0312 de 2019", officialUrl: null },
  scoring: { code: "RULE", versionNumber: 1, multipliers: { met: 100, notMet: 0 } },
  standards: [{ code: "1", title: "Estándar uno", phvaCycle: "PLAN", criterion: null, expectedEvidence: null, weight: 100 }],
};

const record = createAssessmentRecord({ legalName: "Empresa Demo SAS", taxId: "", employeeCount: 8, riskClass: 1, ciiuCode: "", economicActivity: "" }, profile, "11111111-1111-4111-8111-111111111111", "2026-09-06T12:00:00.000Z");

describe("public assessment local storage", () => {
  it("saves, updates, finds and deletes a versioned assessment", () => {
    const storage = memoryStorage();
    saveAssessment(record, storage);
    expect(findAssessment(record.id, storage)?.company.legalName).toBe("Empresa Demo SAS");
    saveAssessment({ ...record, company: { ...record.company, legalName: "Empresa Actualizada SAS" } }, storage);
    expect(readAssessments(storage).records).toHaveLength(1);
    expect(findAssessment(record.id, storage)?.company.legalName).toBe("Empresa Actualizada SAS");
    deleteAssessment(record.id, storage);
    expect(readAssessments(storage).records).toEqual([]);
  });

  it("recovers valid records from a partially corrupted store", () => {
    const storage = memoryStorage();
    storage.setItem(PUBLIC_ASSESSMENT_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, assessments: [record, { broken: true }] }));
    expect(readAssessments(storage)).toMatchObject({ records: [record], corrupted: true });
  });

  it("does not crash on malformed JSON and can clear it", () => {
    const storage = memoryStorage();
    storage.setItem(PUBLIC_ASSESSMENT_STORAGE_KEY, "not-json");
    expect(readAssessments(storage)).toEqual({ records: [], corrupted: true });
    clearAssessments(storage);
    expect(storage.getItem(PUBLIC_ASSESSMENT_STORAGE_KEY)).toBeNull();
  });
});
