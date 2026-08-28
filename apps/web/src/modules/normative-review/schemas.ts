import { z } from "zod";

const text = z.string().trim().min(3).max(2000);
const jsonObject = z.string().trim().min(2).max(20_000).transform((value, context) => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    context.addIssue({ code: "custom", message: "Debe ser un objeto JSON válido." });
    return z.NEVER;
  }
});

export const reviewerSchema = z.object({
  email: z.email().max(320),
  role: z.enum(["review_admin", "reviewer"]),
  status: z.enum(["active", "suspended"]),
  reason: text,
});

export const artifactSchema = z.object({
  artifactType: z.enum(["UI_TEXT", "ASSUMPTION", "TEST_CASE"]),
  artifactKey: z.string().trim().min(3).max(160),
  title: z.string().trim().min(3).max(300),
  sourcePath: z.string().trim().max(500).optional(),
  content: jsonObject,
});

export const proposalSchema = z.object({
  artifactId: z.uuid(),
  content: jsonObject,
  rationale: text,
});

export const decisionSchema = z.object({
  artifactId: z.uuid(),
  proposalId: z.preprocess((value) => value || null, z.uuid().nullable()),
  decision: z.enum(["reviewed", "approved", "rejected"]),
  note: text,
});
