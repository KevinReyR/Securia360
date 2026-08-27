import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().max(200).nullable(),
);

export const organizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  nit: optionalText,
});

export const profileSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  middle_name: optionalText,
  last_name: z.string().trim().min(1).max(80),
  second_last_name: optionalText,
  phone: optionalText,
});

export const legalEntitySchema = z.object({
  legal_name: z.string().trim().min(2).max(180),
  trade_name: optionalText,
  tax_id: z.string().trim().min(3).max(40),
  ciiu_code: optionalText,
  economic_activity: optionalText,
  legal_representative: optionalText,
  risk_class: z.coerce.number().int().min(1).max(5).nullable(),
  employee_count: z.coerce.number().int().min(0).max(10_000_000),
});

export const siteSchema = z.object({
  legal_entity_id: z.uuid(),
  name: z.string().trim().min(2).max(140),
  code: z.string().trim().min(1).max(30).transform((value) => value.toUpperCase()),
  address: optionalText,
  city: optionalText,
  department: optionalText,
  risk_class: z.coerce.number().int().min(1).max(5).nullable(),
});

export const areaSchema = z.object({
  site_id: z.uuid(),
  parent_area_id: z.preprocess((value) => (value === "" ? null : value), z.uuid().nullable()),
  name: z.string().trim().min(2).max(140),
  code: z.string().trim().min(1).max(30).transform((value) => value.toUpperCase()),
});

export const inviteMemberSchema = z.object({
  email: z.email(),
  role_id: z.uuid(),
  site_id: z.preprocess((value) => (value === "" ? null : value), z.uuid().nullable()),
});

export const roleAssignmentSchema = z.object({
  member_id: z.uuid(),
  role_id: z.uuid(),
  site_id: z.preprocess((value) => (value === "" ? null : value), z.uuid().nullable()),
});

export const documentUploadSchema = z.object({
  title: z.string().trim().min(2).max(180), entity_type: z.string().trim().regex(/^[a-z][a-z0-9_]{0,63}$/), entity_id: z.uuid(), expires_at: z.preprocess((value) => value === "" ? null : value, z.string().datetime().nullable()),
});

const onboardingOptionalText = z.string().trim().max(200);

export const onboardingOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre de la organización.").max(160),
  nit: z.string().trim().min(3, "Ingresa el NIT.").max(40),
});

export const onboardingLegalEntitySchema = z.object({
  legal_name: z.string().trim().min(2, "Ingresa la razón social.").max(180),
  trade_name: onboardingOptionalText,
  tax_id: z.string().trim().min(3, "Ingresa el identificador tributario.").max(40),
});

export const onboardingEconomicActivitySchema = z.object({
  economic_activity: z.string().trim().min(3, "Describe la actividad económica.").max(200),
});

export const onboardingCiiuSchema = z.object({
  ciiu_code: z.string().trim().regex(/^\d{4}$/, "El CIIU debe contener cuatro dígitos."),
});

export const onboardingWorkforceSchema = z.object({
  employee_count: z.coerce.number().int().min(0).max(10_000_000),
});

export const onboardingRiskSchema = z.object({
  risk_class: z.coerce.number().int().min(1).max(5),
});

export const onboardingSiteSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre de la sede.").max(140),
  code: z.string().trim().min(1, "Ingresa un código.").max(30).transform((value) => value.toUpperCase()),
  address: onboardingOptionalText,
  city: onboardingOptionalText,
  department: onboardingOptionalText,
});

export const onboardingSitesSchema = z.array(onboardingSiteSchema).min(1, "Agrega al menos una sede.").max(50).superRefine((sites, context) => {
  const codes = new Set<string>();
  sites.forEach((site, index) => {
    const code = site.code.toUpperCase();
    if (codes.has(code)) {
      context.addIssue({ code: "custom", message: "Los códigos de sede no pueden repetirse.", path: [index, "code"] });
    }
    codes.add(code);
  });
});

export const onboardingResponsibleSchema = z.object({
  member_id: z.uuid("Selecciona un miembro activo."),
});

export const onboardingCharacteristicsSchema = z.object({
  work_at_height: z.boolean(),
  confined_spaces: z.boolean(),
  chemical_exposure: z.boolean(),
  electrical_work: z.boolean(),
  transport_operations: z.boolean(),
  heavy_machinery: z.boolean(),
  night_work: z.boolean(),
  remote_work: z.boolean(),
  manual_load_handling: z.boolean(),
});

export const onboardingSchema = z.object({
  organization: onboardingOrganizationSchema,
  legal_entity: onboardingLegalEntitySchema,
  economic_activity: onboardingEconomicActivitySchema,
  ciiu: onboardingCiiuSchema,
  workforce: onboardingWorkforceSchema,
  risk: onboardingRiskSchema,
  sites: onboardingSitesSchema,
  responsible: onboardingResponsibleSchema,
  characteristics: onboardingCharacteristicsSchema,
});

export const onboardingStepSchema = z.discriminatedUnion("step", [
  z.object({ organizationId: z.uuid(), step: z.literal(1), data: onboardingOrganizationSchema }),
  z.object({ organizationId: z.uuid(), step: z.literal(2), data: onboardingLegalEntitySchema }),
  z.object({ organizationId: z.uuid(), step: z.literal(3), data: onboardingEconomicActivitySchema }),
  z.object({ organizationId: z.uuid(), step: z.literal(4), data: onboardingCiiuSchema }),
  z.object({ organizationId: z.uuid(), step: z.literal(5), data: onboardingWorkforceSchema }),
  z.object({ organizationId: z.uuid(), step: z.literal(6), data: onboardingRiskSchema }),
  z.object({ organizationId: z.uuid(), step: z.literal(7), data: onboardingSitesSchema }),
  z.object({ organizationId: z.uuid(), step: z.literal(8), data: onboardingResponsibleSchema }),
  z.object({ organizationId: z.uuid(), step: z.literal(9), data: onboardingCharacteristicsSchema }),
]);
