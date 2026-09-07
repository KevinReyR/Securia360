import {
  PHVA_CYCLES,
  PUBLIC_ASSESSMENT_SCHEMA_VERSION,
  type PublicAssessmentCompany,
  type PublicAssessmentProfile,
  type PublicAssessmentRecord,
  type PublicAssessmentResponse,
  type PublicAssessmentResult,
} from "./schemas";

export const PHVA_LABELS = {
  PLAN: "Planear",
  DO: "Hacer",
  CHECK: "Verificar",
  ACT: "Actuar",
} as const;

export const RESULT_BANDS = {
  critical: { label: "Crítico", description: "Resultado inferior al 60%. Requiere priorizar un plan de mejoramiento inmediato." },
  moderately_acceptable: { label: "Moderadamente aceptable", description: "Resultado entre 60% y 85%, inclusive. Requiere mantener y fortalecer el plan de mejoramiento." },
  acceptable: { label: "Aceptable", description: "Resultado superior al 85%. Conviene conservar evidencias y sostener la mejora continua." },
} as const;

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function suggestedProfileCode(employeeCount: number, riskClass: number) {
  if (employeeCount <= 10 && riskClass <= 3) return "RES0312_P07" as const;
  if (employeeCount <= 50 && riskClass <= 3) return "RES0312_P21" as const;
  return "RES0312_P60" as const;
}

export function explainSuggestedProfile(employeeCount: number, riskClass: number) {
  const code = suggestedProfileCode(employeeCount, riskClass);
  if (code === "RES0312_P07") return "Hasta 10 trabajadores y clase de riesgo I, II o III.";
  if (code === "RES0312_P21") return "Entre 11 y 50 trabajadores y clase de riesgo I, II o III.";
  return "Más de 50 trabajadores, o clase de riesgo IV o V con cualquier número de trabajadores.";
}

export function classifyScore(score: number): PublicAssessmentResult["band"] {
  if (score < 60) return "critical";
  if (score <= 85) return "moderately_acceptable";
  return "acceptable";
}

export function calculatePublicAssessment(
  profile: PublicAssessmentProfile,
  responses: Record<string, PublicAssessmentResponse>,
  calculatedAt = new Date().toISOString(),
): PublicAssessmentResult {
  if (profile.standards.some((standard) => !responses[standard.code])) {
    throw new Error("Todas las respuestas son obligatorias antes de calcular.");
  }

  const score = round(profile.standards.reduce((total, standard) => (
    total + (responses[standard.code] === "met" ? standard.weight : 0)
  ), 0));

  const cycleResults = PHVA_CYCLES.map((cycle) => {
    const standards = profile.standards.filter((standard) => standard.phvaCycle === cycle);
    const possible = round(standards.reduce((total, standard) => total + standard.weight, 0));
    const achieved = round(standards.reduce((total, standard) => (
      total + (responses[standard.code] === "met" ? standard.weight : 0)
    ), 0));
    return { cycle, possible, achieved, percentage: possible === 0 ? 0 : round((achieved / possible) * 100) };
  });

  const gaps = profile.standards
    .filter((standard) => responses[standard.code] === "not_met")
    .sort((a, b) => b.weight - a.weight || a.code.localeCompare(b.code, "es"));
  const metStandards = profile.standards.filter((standard) => responses[standard.code] === "met");

  return {
    score,
    band: classifyScore(score),
    metCount: metStandards.length,
    notMetCount: gaps.length,
    cycleResults,
    gaps,
    metStandards,
    calculatedAt,
  };
}

export function createAssessmentRecord(company: PublicAssessmentCompany, profile: PublicAssessmentProfile, id = crypto.randomUUID(), now = new Date().toISOString()): PublicAssessmentRecord {
  return {
    schemaVersion: PUBLIC_ASSESSMENT_SCHEMA_VERSION,
    id,
    company,
    profile: structuredClone(profile),
    responses: {},
    status: "draft",
    currentCycle: "PLAN",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    result: null,
  };
}

export function formatColombiaDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}
