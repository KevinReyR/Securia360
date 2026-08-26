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

export const onboardingSchema = z.object({
  legal_name: z.string().trim().min(2).max(180),
  trade_name: optionalText,
  tax_id: z.string().trim().min(3).max(40),
  ciiu_code: z.string().trim().min(2).max(20),
  economic_activity: z.string().trim().min(3).max(200),
  employee_count: z.coerce.number().int().min(0).max(10_000_000),
  risk_class: z.coerce.number().int().min(1).max(5),
  site_name: z.string().trim().min(2).max(140),
  site_code: z.string().trim().min(1).max(30).transform((value) => value.toUpperCase()),
  city: optionalText,
  department: optionalText,
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
