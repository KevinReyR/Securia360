import { z } from "zod";

const optionalDateTime = z.preprocess(
  (value) => value === "" || value == null ? null : value,
  z.string().trim().max(40).nullable(),
).refine((value) => value === null || !Number.isNaN(Date.parse(value)), "Fecha inválida");
const optionalLimit = z.preprocess(
  (value) => value === "" || value == null ? null : Number(value),
  z.number().int().min(0).max(10_000_000).nullable(),
);
const checkbox = z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean());

export const planFieldsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  members: optionalLimit,
  sites: optionalLimit,
  storageMb: optionalLimit,
  copilot: checkbox,
  automations: checkbox,
  imports: checkbox,
  analytics: checkbox,
  mobile: checkbox,
});
export const createPlanSchema = planFieldsSchema.extend({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9_-]{1,29}$/),
});
export const createPlanVersionSchema = planFieldsSchema.extend({ planId: z.uuid() });
export const planTransitionSchema = z.object({ planId: z.uuid().optional(), versionId: z.uuid().optional(), action: z.enum(["publish", "archive"]) });

const subscriptionFieldsSchema = z.object({
  organizationId: z.uuid(), planVersionId: z.uuid(),
  status: z.enum(["trialing", "active", "past_due", "suspended", "cancelled"]),
  trialEndsAt: optionalDateTime, periodStart: optionalDateTime, periodEnd: optionalDateTime,
  customerReference: z.string().trim().max(160), subscriptionReference: z.string().trim().max(160),
  note: z.string().trim().max(2000),
});

const validateSubscriptionWindow = (value: { periodStart: string | null; periodEnd: string | null; status: string; trialEndsAt: string | null }, context: z.RefinementCtx) => {
  if (value.periodStart && (!value.periodEnd || value.periodEnd <= value.periodStart)) context.addIssue({ code: "custom", message: "El cierre del período debe ser posterior al inicio.", path: ["periodEnd"] });
  if (value.status === "trialing" && !value.trialEndsAt) context.addIssue({ code: "custom", message: "La fecha de finalización de la prueba es obligatoria.", path: ["trialEndsAt"] });
};

export const subscriptionSchema = subscriptionFieldsSchema.superRefine(validateSubscriptionWindow);

export const provisionCustomerSchema = subscriptionFieldsSchema.omit({ organizationId: true }).extend({
  code: z.string().trim().toUpperCase()
    .min(2, "Ingresa un código de al menos 2 caracteres.")
    .max(30, "El código no puede superar 30 caracteres.")
    .regex(/^[A-Z0-9][A-Z0-9_-]{1,29}$/, "Usa letras, números, guion o guion bajo; sin espacios."),
  name: z.string().trim().min(2, "Ingresa el nombre de la empresa.").max(160, "El nombre no puede superar 160 caracteres."),
  administratorEmail: z.email("Ingresa el correo del administrador."),
}).superRefine(validateSubscriptionWindow);

export const reconciliationSchema = z.object({
  subscriptionId: z.uuid(), reference: z.string().trim().min(2).max(160),
  occurredAt: optionalDateTime.refine(Boolean, "La fecha es obligatoria."),
  status: z.enum(["pending", "exception"]), note: z.string().trim().max(2000),
});
export const reconciliationResolutionSchema = z.object({
  reconciliationId: z.uuid(), status: z.enum(["matched", "voided"]), note: z.string().trim().min(3).max(2000),
});
export const supportSessionSchema = z.object({
  organizationId: z.uuid(), action: z.enum(["request", "start", "end"]),
  reason: z.string().trim().min(3).max(2000),
  sessionId: z.preprocess((value) => value === "" ? null : value, z.uuid().nullable()),
}).superRefine((value, context) => {
  if (value.action !== "request" && !value.sessionId) context.addIssue({ code: "custom", path: ["sessionId"], message: "La sesión es obligatoria." });
});

export function planConfiguration(value: z.infer<typeof planFieldsSchema>) {
  return {
    limits: Object.fromEntries([["members", value.members], ["sites", value.sites], ["storage_mb", value.storageMb]].filter((entry) => entry[1] !== null)),
    featureFlags: { copilot: value.copilot, automations: value.automations, imports: value.imports, analytics: value.analytics, mobile: value.mobile },
  };
}
