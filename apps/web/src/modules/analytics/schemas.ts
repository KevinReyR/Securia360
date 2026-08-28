import { z } from "zod";

const id = z.uuid();
const blankToNull = z.preprocess((value) => value === "" ? null : value, z.string().trim().max(3000).nullable());
const optionalId = z.preprocess((value) => value === "" ? null : value, z.uuid().nullable().optional());

export const indicatorCatalogSchema = z.object({
  code: z.string().trim().regex(/^[A-Za-z][A-Za-z0-9_]{2,79}$/).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(3).max(180),
  description: blankToNull,
  owner_user_id: optionalId,
});

export const indicatorVersionSchema = z.object({
  indicator_id: id,
  version_number: z.coerce.number().int().positive(),
  template: z.enum(["open_tasks_count", "open_improvement_actions_count", "active_documents_count"]),
  formula_description: z.string().trim().min(10).max(1000),
  periodicity: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly"]),
  target_value: z.preprocess((value) => value === "" ? null : value, z.coerce.number().finite().nullable()),
  target_direction: z.enum(["at_least", "at_most", "exact"]),
  effective_from: z.string().date(),
  effective_to: z.preprocess((value) => value === "" ? null : value, z.string().date().nullable()),
}).refine((value) => !value.effective_to || value.effective_to >= value.effective_from, { path: ["effective_to"], message: "La vigencia final debe ser posterior a la inicial." });

export const indicatorStatusSchema = z.object({ id, status: z.enum(["approved", "archived"]) });
export const calculationRequestSchema = z.object({ indicator_version_id: id, period_start: z.string().date(), period_end: z.string().date() }).refine((value) => value.period_end >= value.period_start, { path: ["period_end"], message: "El período final debe ser posterior al inicial." });

export const indicatorTemplates = {
  open_tasks_count: "Cantidad de tareas abiertas",
  open_improvement_actions_count: "Cantidad de acciones de mejoramiento abiertas",
  active_documents_count: "Cantidad de documentos activos",
} as const;
