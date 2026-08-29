import { z } from "zod";
export const questionSchema = z.object({ organizationId: z.string().uuid(), conversationId: z.string().uuid().optional(), question: z.string().trim().min(3).max(1600) });
export const proposalSchema = z.object({ organizationId: z.string().uuid(), conversationId: z.string().uuid(), proposalType: z.enum(["draft_task","draft_action","draft_document","critical_classification","critical_approval","legal_or_medical"]), summary: z.string().trim().min(3).max(1000) });
export const decisionSchema = z.object({ organizationId: z.string().uuid(), proposalId: z.string().uuid(), status: z.enum(["accepted","rejected"]), note: z.string().trim().min(3).max(2000) });
