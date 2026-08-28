import { z } from "zod";

const priority = z.enum(["critical", "high", "medium", "low"]);
const status = z.enum(["pending", "in_progress", "evidence_submitted", "verified", "cancelled"]);
const nullableUuid = z.preprocess((value) => value === "" ? null : value, z.uuid().nullable());
const nullableDate = z.preprocess((value) => value === "" ? null : value, z.string().date().nullable());
const nullableDescription = z.preprocess((value) => typeof value === "string" && value.trim() === "" ? null : value, z.string().trim().max(2_000).nullable());

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

export const improvementActionCreateSchema = improvementActionUpdateSchema.pick({
  title: true,
  description: true,
  priority: true,
  target_date: true,
  responsible_user_id: true,
}).extend({ gap_id: z.uuid() });

export const improvementEvidenceSchema = z.object({
  action_id: z.uuid(),
  existing_version_id: nullableUuid,
});

export const improvementValidationSchema = z.object({
  action_id: z.uuid(),
  validation_note: z.string().trim().min(3).max(2_000),
});

export const improvementGapClosureSchema = z.object({ gap_id: z.uuid() });
