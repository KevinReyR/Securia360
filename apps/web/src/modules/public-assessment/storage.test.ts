import { describe, expect, it } from "vitest";
import { createAssessmentRecord } from "./logic";
import { findAssessment, PUBLIC_ASSESSMENT_STORAGE_KEY, readAssessments, saveAssessment } from "./storage";
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

const record = createAssessmentRecord({
  legalName: "Empresa Demo SAS", taxId: "", employeeCount: 8, riskClass: 2,
  economicActivityEntryId: "22222222-2222-4222-8222-222222222222",
  ciiuCode: "161-01", economicActivity: "Almacenamiento y depósito de café.",
  economicActivityCatalogVersion: "DECRETO_768_2022_V1",
  economicActivitySourceReference: "Decreto 768 de 2022",
}, profile, "11111111-1111-4111-8111-111111111111", "2026-09-06T12:00:00.000Z");

describe("public assessment local storage", () => {
  it("saves, updates and finds a versioned assessment", () => {
    const storage = memoryStorage();
    saveAssessment(record, storage);
    expect(findAssessment(record.id, storage)?.company.legalName).toBe("Empresa Demo SAS");
    saveAssessment({ ...record, company: { ...record.company, legalName: "Empresa Actualizada SAS" } }, storage);
    expect(readAssessments(storage).records).toHaveLength(1);
    expect(findAssessment(record.id, storage)?.company.legalName).toBe("Empresa Actualizada SAS");
  });

  it("recovers valid records from a partially corrupted store", () => {
    const storage = memoryStorage();
    storage.setItem(PUBLIC_ASSESSMENT_STORAGE_KEY, JSON.stringify({ schemaVersion: 2, assessments: [record, { broken: true }] }));
    expect(readAssessments(storage)).toMatchObject({ records: [record], corrupted: true });
  });

  it("keeps a completed version 1 result readable", () => {
    const storage = memoryStorage();
    const legacy = {
      ...record,
      schemaVersion: 1,
      company: { legalName: "Histórico SAS", taxId: "", employeeCount: 8, riskClass: 2, ciiuCode: "0161", economicActivity: "" },
      status: "completed",
      completedAt: "2026-09-06T13:00:00.000Z",
      result: { score: 100, band: "acceptable", metCount: 1, notMetCount: 0, cycleResults: [
        { cycle: "PLAN", achieved: 100, possible: 100, percentage: 100 },
        { cycle: "DO", achieved: 0, possible: 0, percentage: 0 },
        { cycle: "CHECK", achieved: 0, possible: 0, percentage: 0 },
        { cycle: "ACT", achieved: 0, possible: 0, percentage: 0 },
      ], gaps: [], metStandards: profile.standards, calculatedAt: "2026-09-06T13:00:00.000Z" },
    };
    storage.setItem(PUBLIC_ASSESSMENT_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, assessments: [legacy] }));
    expect(readAssessments(storage).records[0]).toMatchObject({ schemaVersion: 1, status: "completed" });
    expect(readAssessments(storage)).toMatchObject({ corrupted: false });
  });

  it("does not crash on malformed JSON", () => {
    const storage = memoryStorage();
    storage.setItem(PUBLIC_ASSESSMENT_STORAGE_KEY, "not-json");
    expect(readAssessments(storage)).toEqual({ records: [], corrupted: true });
  });

  it("reports unavailable storage without throwing", () => {
    const unavailable = {
      getItem: () => { throw new Error("storage blocked"); },
      setItem: () => { throw new Error("storage blocked"); },
      removeItem: () => { throw new Error("storage blocked"); },
    };
    expect(readAssessments(unavailable)).toEqual({ records: [], corrupted: false });
  });
});
