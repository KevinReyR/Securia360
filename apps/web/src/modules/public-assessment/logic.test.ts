import { describe, expect, it } from "vitest";
import { calculatePublicAssessment, classifyScore, createAssessmentRecord, suggestedProfileCode } from "./logic";
import { publicAssessmentCompanySchema, type PublicAssessmentProfile } from "./schemas";

const profile: PublicAssessmentProfile = {
  code: "RES0312_P07",
  name: "Perfil de 7 estándares",
  description: null,
  versionCode: "1.0.0",
  source: { title: "Resolución 0312 de 2019", versionCode: "2019", officialReference: "Resolución 0312 de 2019", officialUrl: null },
  scoring: { code: "RES0312_P07_SCORING", versionNumber: 1, multipliers: { met: 100, notMet: 0 } },
  standards: [
    { code: "1", title: "Estándar uno", phvaCycle: "PLAN", criterion: "Criterio", expectedEvidence: "Evidencia", weight: 60 },
    { code: "2", title: "Estándar dos", phvaCycle: "DO", criterion: "Criterio", expectedEvidence: "Evidencia", weight: 25 },
    { code: "3", title: "Estándar tres", phvaCycle: "CHECK", criterion: "Criterio", expectedEvidence: "Evidencia", weight: 15 },
  ],
};

const company = {
  legalName: "Empresa Demo SAS",
  taxId: "",
  economicActivityEntryId: "22222222-2222-4222-8222-222222222222",
  ciiuCode: "161-01",
  economicActivity: "Almacenamiento y depósito de café.",
  economicActivityCatalogVersion: "DECRETO_768_2022_V1",
  economicActivitySourceReference: "Decreto 768 de 2022",
  employeeCount: 10,
  riskClass: 2,
};

describe("public assessment profile suggestion", () => {
  it.each([
    [10, 1, "RES0312_P07"],
    [10, 3, "RES0312_P07"],
    [11, 3, "RES0312_P21"],
    [50, 3, "RES0312_P21"],
    [51, 1, "RES0312_P60"],
    [1, 4, "RES0312_P60"],
    [1, 5, "RES0312_P60"],
  ])("maps %i workers and risk %i to %s", (workers, risk, expected) => {
    expect(suggestedProfileCode(workers, risk)).toBe(expected);
  });
});

describe("public assessment scoring", () => {
  it("uses exact profile weights and calculates every PHVA cycle", () => {
    const result = calculatePublicAssessment(profile, { "1": "met", "2": "met", "3": "not_met" }, "2026-09-06T12:00:00.000Z");
    expect(result.score).toBe(85);
    expect(result.band).toBe("moderately_acceptable");
    expect(result.metCount).toBe(2);
    expect(result.gaps.map((item) => item.code)).toEqual(["3"]);
    expect(result.cycleResults.find((item) => item.cycle === "PLAN")?.percentage).toBe(100);
    expect(result.cycleResults.find((item) => item.cycle === "CHECK")?.percentage).toBe(0);
  });

  it.each([[59.99, "critical"], [60, "moderately_acceptable"], [85, "moderately_acceptable"], [85.01, "acceptable"]])("classifies %f as %s", (score, expected) => {
    expect(classifyScore(score)).toBe(expected);
  });

  it("requires every standard to be answered", () => {
    expect(() => calculatePublicAssessment(profile, { "1": "met" })).toThrow("Todas las respuestas");
  });
});

describe("public assessment validation", () => {
  it("validates minimal company data and rejects malformed CIIU", () => {
    expect(publicAssessmentCompanySchema.safeParse(company).success).toBe(true);
    expect(publicAssessmentCompanySchema.safeParse({ ...company, ciiuCode: "0161" }).success).toBe(false);
    expect(publicAssessmentCompanySchema.safeParse({ ...company, economicActivityEntryId: "" }).success).toBe(false);
  });

  it("freezes the profile snapshot when creating a record", () => {
    const record = createAssessmentRecord(company, profile, "11111111-1111-4111-8111-111111111111", "2026-09-06T12:00:00.000Z");
    profile.standards[0].title = "Cambio posterior";
    expect(record.profile.standards[0].title).toBe("Estándar uno");
  });
});
