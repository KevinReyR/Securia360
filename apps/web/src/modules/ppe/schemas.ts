import { z } from "zod";

const id = z.uuid();
const optionalId = z.preprocess((value) => value === "" ? null : value, z.uuid().nullable());
const optionalText = z.preprocess((value) => value === "" ? null : value, z.string().trim().max(2_000).nullable());

export const ppeCatalogSchema = z.object({
  code: z.string().trim().regex(/^[A-Z0-9][A-Z0-9_-]{1,80}$/),
  name: z.string().trim().min(3).max(180),
  category: z.string().trim().min(2).max(120),
  description: optionalText,
  useful_life_days: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().positive().nullable()),
  hazard_id: optionalId,
  risk_control_id: optionalId,
});
export const inventorySchema = z.object({ ppe_catalog_id: id, site_id: optionalId, size_label: z.string().trim().max(40), reorder_point: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().nonnegative().nullable()) });
export const movementSchema = z.object({ inventory_id: id, movement_type: z.enum(["purchase", "adjustment", "return"]), quantity: z.coerce.number().int().refine((value) => value !== 0, "La cantidad no puede ser cero."), note: optionalText, evidence_document_version_id: optionalId });
export const assignmentSchema = z.object({ organization_member_id: id, ppe_catalog_id: id, site_id: optionalId, size_label: z.string().trim().max(40), expected_replacement_at: z.preprocess((value) => value === "" ? null : value, z.string().date().nullable()) });
export const deliverySchema = z.object({ assignment_id: id, inventory_id: id, quantity: z.coerce.number().int().positive(), evidence_document_version_id: optionalId, delivery_kind: z.enum(["initial", "replacement"]) });
export const inspectionSchema = z.object({ assignment_id: id, status: z.enum(["suitable", "needs_replacement", "failed"]), notes: optionalText, evidence_document_version_id: optionalId });
export const retirementSchema = z.object({ assignment_id: id, reason: z.string().trim().min(3).max(2_000), evidence_document_version_id: optionalId });
export const deliveryAcceptanceSchema = z.object({ delivery_id: id });

