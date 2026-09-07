import { z } from "zod";

export const PUBLIC_ASSESSMENT_SCHEMA_VERSION = 1 as const;
export const PHVA_CYCLES = ["PLAN", "DO", "CHECK", "ACT"] as const;

export const publicAssessmentResponseSchema = z.enum(["met", "not_met"]);

export const publicAssessmentStandardSchema = z.object({
  code: z.string().trim().min(1).max(100),
  title: z.string().trim().min(3).max(2_000),
  phvaCycle: z.enum(PHVA_CYCLES),
  criterion: z.string().trim().max(4_000).nullable(),
  expectedEvidence: z.string().trim().max(4_000).nullable(),
  weight: z.number().positive().max(100),
});

export const publicAssessmentSourceSchema = z.object({
  title: z.string().trim().min(3).max(300),
  versionCode: z.string().trim().min(1).max(80),
  officialReference: z.string().trim().min(3).max(300),
  officialUrl: z.url().nullable(),
});

export const publicAssessmentProfileSchema = z.object({
  code: z.enum(["RES0312_P07", "RES0312_P21", "RES0312_P60"]),
  name: z.string().trim().min(3).max(180),
  description: z.string().trim().max(2_000).nullable(),
  versionCode: z.string().trim().min(1).max(80),
  source: publicAssessmentSourceSchema,
  scoring: z.object({
    code: z.string().trim().min(3).max(120),
    versionNumber: z.number().int().positive(),
    multipliers: z.object({
      met: z.literal(100),
      notMet: z.literal(0),
    }),
  }),
  standards: z.array(publicAssessmentStandardSchema).min(1).max(100),
});

export const publicAssessmentCatalogSchema = z.object({
  schemaVersion: z.literal(PUBLIC_ASSESSMENT_SCHEMA_VERSION),
  generatedAt: z.string().datetime({ offset: true }),
  profiles: z.array(publicAssessmentProfileSchema).max(3),
});

export const publicAssessmentCompanySchema = z.object({
  legalName: z.string().trim().min(3, "Escribe la razón social.").max(160),
  taxId: z.string().trim().max(30).regex(/^[0-9A-Za-z.-]*$/, "Usa solo letras, números, puntos o guiones.").optional().default(""),
  employeeCount: z.coerce.number().int().min(1, "Debe existir al menos un trabajador.").max(1_000_000),
  riskClass: z.coerce.number().int().min(1).max(5),
  ciiuCode: z.string().trim().regex(/^$|^[0-9]{4}$/, "El código CIIU debe tener cuatro dígitos.").optional().default(""),
  economicActivity: z.string().trim().max(500).optional().default(""),
});

export const publicAssessmentCycleResultSchema = z.object({
  cycle: z.enum(PHVA_CYCLES),
  achieved: z.number().min(0).max(100),
  possible: z.number().min(0).max(100),
  percentage: z.number().min(0).max(100),
});

export const publicAssessmentResultSchema = z.object({
  score: z.number().min(0).max(100),
  band: z.enum(["critical", "moderately_acceptable", "acceptable"]),
  metCount: z.number().int().nonnegative(),
  notMetCount: z.number().int().nonnegative(),
  cycleResults: z.array(publicAssessmentCycleResultSchema).length(4),
  gaps: z.array(publicAssessmentStandardSchema),
  metStandards: z.array(publicAssessmentStandardSchema),
  calculatedAt: z.string().datetime({ offset: true }),
});

export const publicAssessmentRecordSchema = z.object({
  schemaVersion: z.literal(PUBLIC_ASSESSMENT_SCHEMA_VERSION),
  id: z.uuid(),
  company: publicAssessmentCompanySchema,
  profile: publicAssessmentProfileSchema,
  responses: z.record(z.string(), publicAssessmentResponseSchema),
  status: z.enum(["draft", "completed"]),
  currentCycle: z.enum(PHVA_CYCLES),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).nullable(),
  result: publicAssessmentResultSchema.nullable(),
});

export const publicAssessmentStoreSchema = z.object({
  schemaVersion: z.literal(PUBLIC_ASSESSMENT_SCHEMA_VERSION),
  assessments: z.array(publicAssessmentRecordSchema),
});

export type PublicAssessmentCatalog = z.infer<typeof publicAssessmentCatalogSchema>;
export type PublicAssessmentCompany = z.infer<typeof publicAssessmentCompanySchema>;
export type PublicAssessmentProfile = z.infer<typeof publicAssessmentProfileSchema>;
export type PublicAssessmentRecord = z.infer<typeof publicAssessmentRecordSchema>;
export type PublicAssessmentResponse = z.infer<typeof publicAssessmentResponseSchema>;
export type PublicAssessmentResult = z.infer<typeof publicAssessmentResultSchema>;
export type PublicAssessmentStandard = z.infer<typeof publicAssessmentStandardSchema>;
export type PhvaCycle = (typeof PHVA_CYCLES)[number];
