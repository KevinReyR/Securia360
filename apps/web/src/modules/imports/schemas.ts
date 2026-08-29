import { z } from "zod";

export const importTargetSchema = z.enum(["legal_entity", "site", "area", "worker"]);
export type ImportTarget = z.infer<typeof importTargetSchema>;

const mapValue = z.preprocess((value) => value === "" ? undefined : value, z.string().trim().min(1).max(80).optional());
export const importMappingSchema = z.object({
  legal_name: mapValue, tax_id: mapValue, trade_name: mapValue, ciiu_code: mapValue, economic_activity: mapValue, risk_class: mapValue,
  name: mapValue, code: mapValue, legal_entity_tax_id: mapValue, address: mapValue, city: mapValue, department: mapValue,
  site_code: mapValue,
  employee_code: mapValue, first_name: mapValue, last_name: mapValue, work_email: mapValue, area_code: mapValue, status: mapValue,
});

export const uploadImportSchema = z.object({
  organizationId: z.uuid(),
  target: importTargetSchema,
});

export const importIdSchema = z.object({ organizationId: z.uuid(), id: z.uuid() });

export const targetLabels: Record<ImportTarget, string> = {
  legal_entity: "Razones sociales", site: "Sedes", area: "Áreas", worker: "Trabajadores",
};

export const templateColumns: Record<ImportTarget, string[]> = {
  legal_entity: ["legal_name", "tax_id", "trade_name", "ciiu_code", "economic_activity", "risk_class", "status"],
  site: ["name", "code", "legal_entity_tax_id", "address", "city", "department", "risk_class", "status"],
  area: ["name", "code", "site_code", "status"],
  worker: ["employee_code", "first_name", "last_name", "work_email", "legal_entity_tax_id", "site_code", "area_code", "status"],
};
