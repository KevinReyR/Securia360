import { z } from "zod";

export const complianceTenantSchema = z.uuid("La organización no es válida.");
const optionalText = z.preprocess((value) => typeof value === "string" && value.trim() === "" ? null : value, z.string().trim().max(2_000).nullable().optional());

export const classificationProposalSchema = z.object({
  organizationId: complianceTenantSchema,
  employee_count: z.coerce.number().int().min(0).max(1_000_000),
  risk_class: z.coerce.number().int().min(1).max(5),
  ciiu_code: optionalText,
  economic_activity: optionalText,
  standard_profile_id: z.uuid(),
  evaluator_version_id: z.uuid(),
  proposed_effective_from: z.string().date(),
  reason: z.string().trim().min(3).max(1_000),
});

export const reviewClassificationSchema = z.object({ organizationId: complianceTenantSchema, proposalId: z.uuid(), note: z.string().trim().min(3).max(2_000) });
export const evaluateApplicabilitySchema = z.object({ organizationId: complianceTenantSchema, asOf: z.string().date().optional() });
export const snapshotSchema = z.object({ organizationId: complianceTenantSchema, reason: z.string().trim().min(3).max(1_000), snapshotDate: z.string().date().optional() });
export const assessmentCreateSchema = z.object({ organizationId: complianceTenantSchema, snapshotId: z.uuid(), scoringRuleId: z.uuid(), responsibleUserId: z.preprocess((value) => value || null, z.uuid().nullable()) });
export const assessmentItemSchema = z.object({ organizationId: complianceTenantSchema, assessmentId: z.uuid(), itemId: z.uuid(), response: z.enum(["pending", "met", "not_met", "not_applicable", "review_required"]), observation: optionalText, justification: optionalText, responsibleUserId: z.preprocess((value) => value || null, z.uuid().nullable()) });
export const assessmentMutationSchema = z.object({ organizationId: complianceTenantSchema, assessmentId: z.uuid() });

export function domainStatus(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/permission|insufficient|row-level/i.test(message)) return "forbidden";
  if (/reviewed|published|scoring|snapshot requires/i.test(message)) return "expert-pending";
  if (/immutable|validated|cannot/i.test(message)) return "transition";
  return "error";
}
