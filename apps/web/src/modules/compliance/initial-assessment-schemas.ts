import { z } from "zod";

const id = z.uuid("La referencia no es válida.");

export const initialAssessmentStartSchema = z.object({ organizationId: id });
export const initialAssessmentResponseSchema = z.object({
  organizationId: id,
  assessmentId: id,
  itemId: id,
  response: z.enum(["met", "not_met"]),
});
export const initialAssessmentCompleteSchema = z.object({ organizationId: id, assessmentId: id });

export type InitialAssessmentResponseInput = z.infer<typeof initialAssessmentResponseSchema>;
