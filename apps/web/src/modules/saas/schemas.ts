import { z } from "zod";

const optionalDateTime = z.preprocess((value) => value === "" ? null : value, z.string().trim().max(40).nullable()).refine((value) => value === null || !Number.isNaN(Date.parse(value)), "Fecha inválida");

export const subscriptionSchema = z.object({
  organizationId: z.uuid(),
  planId: z.uuid(),
  status: z.enum(["trialing", "active", "past_due", "suspended", "cancelled"]),
  trialEndsAt: optionalDateTime,
  periodStart: optionalDateTime,
  periodEnd: optionalDateTime,
  note: z.string().trim().max(2000),
}).refine((value) => !value.periodStart || !value.periodEnd || value.periodEnd >= value.periodStart, { message: "El cierre del período debe ser posterior al inicio.", path: ["periodEnd"] });

export const supportSessionSchema = z.object({
  organizationId: z.uuid(),
  action: z.enum(["request", "start", "end"]),
  reason: z.string().trim().min(3).max(2000),
  sessionId: z.preprocess((value) => value === "" ? null : value, z.uuid().nullable()),
}).superRefine((value, context) => {
  if (value.action !== "request" && !value.sessionId) context.addIssue({ code: "custom", path: ["sessionId"], message: "La sesión es obligatoria." });
});
