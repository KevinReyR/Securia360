import { z } from "zod";

const priority = z.enum(["critical", "high", "medium", "low"]);
const status = z.enum(["pending", "in_progress", "evidence_submitted", "verified", "cancelled"]);
const nullableUuid = z.preprocess((value) => value === "" ? null : value, z.uuid().nullable());
const nullableDate = z.preprocess((value) => value === "" ? null : value, z.string().date().nullable());
const nullableDescription = z.preprocess((value) => typeof value === "string" && value.trim() === "" ? null : value, z.string().trim().max(2_000).nullable());
const optionalUuid = z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.uuid().optional());
const optionalDate = z.preprocess((value) => value === "" || value === undefined ? undefined : value, z.string().date().optional());
const optionalDescription = z.preprocess((value) => typeof value === "string" && value.trim() === "" || value === undefined ? undefined : value, z.string().trim().max(2_000).optional());
const optionalPriority = z.preprocess((value) => value === "" || value === undefined ? undefined : value, priority.optional());

export const improvementActionUpdateSchema = z.object({
  action_id: z.uuid(),
  title: z.string().trim().min(2).max(240),
  description: nullableDescription,
  priority,
  status,
  target_date: nullableDate,
  responsible_user_id: nullableUuid,
  evidence_document_version_id: nullableUuid,
  validation_note: z.preprocess((value) => value === "" ? null : value, z.string().trim().max(2_000).nullable()),
});

export const improvementActionCreateSchema = z.object({
  gap_id: z.uuid(),
  title: z.string().trim().min(2, "Escribe una acción concreta.").max(240),
  description: optionalDescription,
  priority: optionalPriority,
  target_date: optionalDate,
  responsible_user_id: optionalUuid,
});

export const improvementEvidenceSchema = z.object({
  action_id: z.uuid(),
  existing_version_id: nullableUuid,
});

export const improvementValidationSchema = z.object({
  action_id: z.uuid(),
  validation_note: z.string().trim().min(3).max(2_000),
});

export const improvementGapClosureSchema = z.object({ gap_id: z.uuid() });
