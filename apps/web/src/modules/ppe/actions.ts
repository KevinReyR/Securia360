"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { can, type PermissionCode } from "@/modules/auth/permissions";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { assignmentSchema, deliveryAcceptanceSchema, deliverySchema, inspectionSchema, inventorySchema, movementSchema, ppeCatalogSchema, retirementSchema } from "./schemas";

const orgId = z.uuid();
const route = (organizationId: string, status: string) => `/org/${organizationId}/ppe?status=${status}`;
const refresh = (organizationId: string) => revalidatePath(`/org/${organizationId}/ppe`);
const input = (formData: FormData) => Object.fromEntries(formData);
async function guard(organizationId: string, permission: PermissionCode) { if (!(await can(organizationId, permission))) redirect(route(organizationId, "forbidden")); }
async function db() { return (await requireAuthenticatedUser()).supabase as any; }

async function uploadEvidence(organizationId: string, entityId: string, formData: FormData) {
  const file = formData.get("evidence_file");
  const existing = formData.get("evidence_document_version_id");
  if (typeof existing === "string" && existing) return existing;
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 26_214_400 || !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("invalid-evidence");
  await guard(organizationId, "documents.create");
  const { userId } = await requireAuthenticatedUser(); const client = await db();
  const documentId = crypto.randomUUID(); const versionId = crypto.randomUUID(); const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180) || "evidencia";
  const path = `${organizationId}/ppe_assignment/${entityId}/${documentId}/${safeName}`;
  const { error: uploadError } = await client.storage.from("evidences").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error("upload-failed");
  const { error: documentError } = await client.from("documents").insert({ id: documentId, organization_id: organizationId, entity_type: "ppe_assignment", entity_id: entityId, title: `EPP · ${file.name}`, created_by: userId, updated_by: userId });
  const { error: versionError } = documentError ? { error: documentError } : await client.from("document_versions").insert({ id: versionId, organization_id: organizationId, document_id: documentId, version_number: 1, bucket_id: "evidences", storage_path: path, original_name: file.name, mime_type: file.type, size_bytes: file.size, uploaded_by: userId });
  if (versionError) { await client.storage.from("evidences").remove([path]); throw new Error("evidence-persist-failed"); }
  return versionId;
}

export async function createPpeCatalog(formData: FormData) {
  const organizationId = orgId.parse(formData.get("organizationId")); const parsed = ppeCatalogSchema.safeParse(input(formData)); if (!parsed.success) redirect(route(organizationId, "invalid"));
  await guard(organizationId, "ppe.manage"); const client = await db();
  const { data, error } = await client.from("ppe_catalog").insert({ organization_id: organizationId, code: parsed.data.code, name: parsed.data.name, category: parsed.data.category, description: parsed.data.description, useful_life_days: parsed.data.useful_life_days }).select("id").single();
  if (!error && data) {
    if (parsed.data.hazard_id) await client.from("ppe_catalog_hazards").insert({ ppe_catalog_id: data.id, hazard_id: parsed.data.hazard_id });
    if (parsed.data.risk_control_id) await client.from("ppe_catalog_controls").insert({ organization_id: organizationId, ppe_catalog_id: data.id, risk_control_id: parsed.data.risk_control_id });
  }
  refresh(organizationId); redirect(route(organizationId, error ? "error" : "saved"));
}
export async function createPpeInventory(formData: FormData) {
  const organizationId = orgId.parse(formData.get("organizationId")); const parsed = inventorySchema.safeParse(input(formData)); if (!parsed.success) redirect(route(organizationId, "invalid")); await guard(organizationId, "ppe.manage");
  const { error } = await (await db()).rpc("create_ppe_inventory", { p_organization_id: organizationId, p_site_id: parsed.data.site_id, p_ppe_catalog_id: parsed.data.ppe_catalog_id, p_size_label: parsed.data.size_label, p_reorder_point: parsed.data.reorder_point }); refresh(organizationId); redirect(route(organizationId, error ? "error" : "saved"));
}
export async function recordPpeInventoryMovement(formData: FormData) {
  const organizationId = orgId.parse(formData.get("organizationId")); const parsed = movementSchema.safeParse(input(formData)); if (!parsed.success || (parsed.data.movement_type !== "adjustment" && parsed.data.quantity < 1)) redirect(route(organizationId, "invalid")); await guard(organizationId, "ppe.manage");
  const { error } = await (await db()).rpc("record_ppe_inventory_movement", { p_inventory_id: parsed.data.inventory_id, p_movement_type: parsed.data.movement_type, p_quantity: parsed.data.quantity, p_note: parsed.data.note, p_evidence_document_version_id: parsed.data.evidence_document_version_id }); refresh(organizationId); redirect(route(organizationId, error ? "stock-error" : "saved"));
}
export async function createPpeAssignment(formData: FormData) {
  const organizationId = orgId.parse(formData.get("organizationId")); const parsed = assignmentSchema.safeParse(input(formData)); if (!parsed.success) redirect(route(organizationId, "invalid")); await guard(organizationId, "ppe.manage"); const { userId } = await requireAuthenticatedUser();
  const { error } = await (await db()).from("ppe_assignments").insert({ organization_id: organizationId, ...parsed.data, created_by: userId }); refresh(organizationId); redirect(route(organizationId, error ? "error" : "saved"));
}
export async function deliverPpe(formData: FormData) {
  const organizationId = orgId.parse(formData.get("organizationId")); const parsed = deliverySchema.safeParse(input(formData)); if (!parsed.success) redirect(route(organizationId, "invalid")); await guard(organizationId, "ppe.validate");
  try { const evidence = await uploadEvidence(organizationId, parsed.data.assignment_id, formData); const { error } = await (await db()).rpc("deliver_ppe", { p_assignment_id: parsed.data.assignment_id, p_inventory_id: parsed.data.inventory_id, p_quantity: parsed.data.quantity, p_evidence_document_version_id: evidence, p_delivery_kind: parsed.data.delivery_kind }); refresh(organizationId); redirect(route(organizationId, error ? "stock-error" : "delivered")); } catch { redirect(route(organizationId, "evidence-error")); }
}
export async function acceptPpeDelivery(formData: FormData) {
  const organizationId = orgId.parse(formData.get("organizationId")); const parsed = deliveryAcceptanceSchema.safeParse(input(formData)); if (!parsed.success) redirect(route(organizationId, "invalid")); const { error } = await (await db()).rpc("accept_ppe_delivery", { p_delivery_id: parsed.data.delivery_id }); refresh(organizationId); redirect(route(organizationId, error ? "acceptance-error" : "accepted"));
}
export async function inspectPpe(formData: FormData) {
  const organizationId = orgId.parse(formData.get("organizationId")); const parsed = inspectionSchema.safeParse(input(formData)); if (!parsed.success) redirect(route(organizationId, "invalid")); await guard(organizationId, "ppe.validate");
  try { const evidence = await uploadEvidence(organizationId, parsed.data.assignment_id, formData); const { error } = await (await db()).rpc("inspect_ppe", { p_assignment_id: parsed.data.assignment_id, p_status: parsed.data.status, p_notes: parsed.data.notes, p_evidence_document_version_id: evidence }); refresh(organizationId); redirect(route(organizationId, error ? "error" : "inspected")); } catch { redirect(route(organizationId, "evidence-error")); }
}
export async function retirePpe(formData: FormData) {
  const organizationId = orgId.parse(formData.get("organizationId")); const parsed = retirementSchema.safeParse(input(formData)); if (!parsed.success) redirect(route(organizationId, "invalid")); await guard(organizationId, "ppe.validate");
  try { const evidence = await uploadEvidence(organizationId, parsed.data.assignment_id, formData); const { error } = await (await db()).rpc("retire_ppe", { p_assignment_id: parsed.data.assignment_id, p_reason: parsed.data.reason, p_evidence_document_version_id: evidence }); refresh(organizationId); redirect(route(organizationId, error ? "error" : "retired")); } catch { redirect(route(organizationId, "evidence-error")); }
}
