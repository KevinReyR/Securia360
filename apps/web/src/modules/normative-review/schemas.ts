import { z } from "zod";

const text = z.string().trim().min(3).max(2000);
const structuredContent = z.string().trim().min(2).max(20_000).transform((value, context) => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    if (value.startsWith("{") || value.startsWith("[")) {
      context.addIssue({ code: "custom", message: "El contenido estructurado no tiene un formato válido." });
      return z.NEVER;
    }
    return { text: value };
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
  content: structuredContent,
});

export const proposalSchema = z.object({
  artifactId: z.uuid(),
  content: structuredContent,
  rationale: text,
});

export const decisionSchema = z.object({
  artifactId: z.uuid(),
  proposalId: z.preprocess((value) => value || null, z.uuid().nullable()),
  decision: z.enum(["reviewed", "approved", "rejected"]),
  note: text,
});
