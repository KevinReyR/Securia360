import { z } from "zod";

const id = z.uuid();
const optionalId = z.preprocess((value) => value === "" ? null : value, z.uuid().nullable());
const optionalDate = z.preprocess((value) => value === "" ? null : value, z.string().date().nullable());
const optionalText = z.preprocess((value) => value === "" ? null : value, z.string().trim().max(2_000).nullable());

export const healthProgramSchema = z.object({ code: z.string().trim().regex(/^[A-Z0-9][A-Z0-9_-]{1,80}$/), name: z.string().trim().min(3).max(180), description: optionalText });
export const healthEnrollmentSchema = z.object({ health_surveillance_program_id: id, organization_member_id: id, next_review_at: optionalDate });
export const fitnessSchema = z.object({ organization_member_id: id, concept: z.enum(["fit", "fit_with_restrictions", "pending_review", "not_issued"]), issued_at: z.string().date(), expires_at: optionalDate, evidence_document_version_id: optionalId });
export const restrictionSchema = z.object({ occupational_fitness_concept_id: id, restriction_summary: z.string().trim().min(3).max(1_000), effective_from: z.string().date(), effective_to: optionalDate });
export const healthDecisionSchema = z.object({ organization_member_id: id, decision_type: z.enum(["accommodation", "work_assignment_review", "restriction_acknowledgement"]), reason_summary: z.string().trim().min(3).max(1_000) });
export const healthDecisionStateSchema = z.object({ id, status: z.enum(["confirmed", "cancelled"]) });
