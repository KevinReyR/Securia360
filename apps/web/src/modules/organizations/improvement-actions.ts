"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { can, type PermissionCode } from "@/modules/auth/permissions";
import {
  improvementActionCreateSchema,
  improvementActionUpdateSchema,
  improvementEvidenceSchema,
  improvementGapClosureSchema,
  improvementValidationSchema,
} from "./improvement-schemas";
import { requireAuthenticatedUser } from "./tenant";

const tenantIdSchema = z.uuid();

function route(organizationId: string, status: string) {
  return `/org/${organizationId}/improvement-plan?status=${status}`;
}

async function requirePermission(organizationId: string, permission: PermissionCode) {
  if (!(await can(organizationId, permission))) redirect(`/org/${organizationId}/dashboard?error=forbidden`);
}

function validDocumentFile(file: FormDataEntryValue | null): file is File {
  return file instanceof File && file.size > 0 && file.size <= 26_214_400 && ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type);
}

function documentPath(organizationId: string, entityId: string, documentId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180) || "archivo";
  return `${organizationId}/improvement_action/${entityId}/${documentId}/${safeName}`;
}

export async function createImprovementAction(formData: FormData) {
  const organizationId = tenantIdSchema.parse(formData.get("organizationId"));
  const parsed = improvementActionCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route(organizationId, "error"));
  await requirePermission(organizationId, "improvements.manage");
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data: gap } = await supabase.from("improvement_gaps").select("id,status").eq("organization_id", organizationId).eq("id", parsed.data.gap_id).maybeSingle();
  if (!gap) redirect(route(organizationId, "notfound"));
  if (gap.status === "resolved") redirect(route(organizationId, "gap-already-closed"));
  const { error } = await supabase.from("improvement_actions").insert({ organization_id: organizationId, gap_id: parsed.data.gap_id, title: parsed.data.title, description: parsed.data.description, priority: parsed.data.priority, target_date: parsed.data.target_date, responsible_user_id: parsed.data.responsible_user_id, created_by: userId });
  revalidatePath(`/org/${organizationId}/improvement-plan`);
  redirect(route(organizationId, error ? "error" : "created"));
}

export async function updateImprovementAction(formData: FormData) {
  const organizationId = tenantIdSchema.parse(formData.get("organizationId"));
  const parsed = improvementActionUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route(organizationId, "error"));
  await requirePermission(organizationId, "improvements.manage");
  const supabase = await createClient();
  const { data: current } = await supabase.from("improvement_actions").select("id,status").eq("organization_id", organizationId).eq("id", parsed.data.action_id).maybeSingle();
  if (!current) redirect(route(organizationId, "notfound"));
  const transitions: Record<string, string[]> = { pending: ["pending", "in_progress", "cancelled"], in_progress: ["pending", "in_progress", "evidence_submitted", "cancelled"], evidence_submitted: ["in_progress", "evidence_submitted", "cancelled"] };
  if (!transitions[current.status]?.includes(parsed.data.status)) redirect(route(organizationId, "transition"));
  if (parsed.data.status === "evidence_submitted" && !parsed.data.evidence_document_version_id) redirect(route(organizationId, "evidence-required"));
  if (parsed.data.evidence_document_version_id) {
    const { data: version } = await supabase.from("document_versions").select("id").eq("organization_id", organizationId).eq("id", parsed.data.evidence_document_version_id).maybeSingle();
    if (!version) redirect(route(organizationId, "foreign-evidence"));
  }
  const { error } = await supabase.from("improvement_actions").update({ title: parsed.data.title, description: parsed.data.description, priority: parsed.data.priority, status: parsed.data.status, target_date: parsed.data.target_date, responsible_user_id: parsed.data.responsible_user_id, evidence_document_version_id: parsed.data.evidence_document_version_id, validation_note: parsed.data.validation_note }).eq("organization_id", organizationId).eq("id", parsed.data.action_id);
  revalidatePath(`/org/${organizationId}/improvement-plan`);
  redirect(route(organizationId, error ? "error" : "saved"));
}

export async function attachImprovementEvidence(formData: FormData) {
  const organizationId = tenantIdSchema.parse(formData.get("organizationId"));
  const parsed = improvementEvidenceSchema.safeParse(Object.fromEntries(formData));
  const file = formData.get("file");
  if (!parsed.success || (!parsed.data.existing_version_id && !validDocumentFile(file)) || (parsed.data.existing_version_id && file instanceof File && file.size > 0)) redirect(route(organizationId, "error"));
  await requirePermission(organizationId, "improvements.manage");
  await requirePermission(organizationId, parsed.data.existing_version_id ? "documents.read" : "documents.create");
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data: action } = await supabase.from("improvement_actions").select("id,title,status").eq("organization_id", organizationId).eq("id", parsed.data.action_id).maybeSingle();
  if (!action) redirect(route(organizationId, "notfound"));
  if (["verified", "cancelled"].includes(action.status)) redirect(route(organizationId, "transition"));
  let versionId = parsed.data.existing_version_id;
  if (versionId) {
    const { data: version } = await supabase.from("document_versions").select("id").eq("organization_id", organizationId).eq("id", versionId).maybeSingle();
    if (!version) redirect(route(organizationId, "foreign-evidence"));
  } else if (validDocumentFile(file)) {
    const documentId = crypto.randomUUID();
    versionId = crypto.randomUUID();
    const path = documentPath(organizationId, action.id, documentId, file.name);
    const { error: storageError } = await supabase.storage.from("evidences").upload(path, file, { contentType: file.type, upsert: false });
    if (storageError) redirect(route(organizationId, "error"));
    const { error: documentError } = await supabase.from("documents").insert({ id: documentId, organization_id: organizationId, entity_type: "improvement_action", entity_id: action.id, title: `Evidencia · ${action.title}`.slice(0, 180), created_by: userId, updated_by: userId });
    if (documentError) { await supabase.storage.from("evidences").remove([path]); redirect(route(organizationId, "error")); }
    const { error: versionError } = await supabase.from("document_versions").insert({ id: versionId, organization_id: organizationId, document_id: documentId, version_number: 1, bucket_id: "evidences", storage_path: path, original_name: file.name, mime_type: file.type, size_bytes: file.size, uploaded_by: userId });
    if (versionError) { await supabase.storage.from("evidences").remove([path]); await supabase.from("documents").delete().eq("organization_id", organizationId).eq("id", documentId); redirect(route(organizationId, "error")); }
  }
  const { error } = await supabase.from("improvement_actions").update({ evidence_document_version_id: versionId, status: "evidence_submitted" }).eq("organization_id", organizationId).eq("id", action.id);
  revalidatePath(`/org/${organizationId}/improvement-plan`);
  revalidatePath(`/org/${organizationId}/documents`);
  redirect(route(organizationId, error ? "error" : "evidence-attached"));
}

export async function validateImprovementAction(formData: FormData) {
  const organizationId = tenantIdSchema.parse(formData.get("organizationId"));
  const parsed = improvementValidationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route(organizationId, "error"));
  await requirePermission(organizationId, "improvements.validate");
  const supabase = await createClient();
  const { data: action } = await supabase.from("improvement_actions").select("id,status,evidence_document_version_id").eq("organization_id", organizationId).eq("id", parsed.data.action_id).maybeSingle();
  if (!action) redirect(route(organizationId, "notfound"));
  if (action.status !== "evidence_submitted" || !action.evidence_document_version_id) redirect(route(organizationId, "transition"));
  const { error } = await supabase.from("improvement_actions").update({ status: "verified", validation_note: parsed.data.validation_note }).eq("organization_id", organizationId).eq("id", action.id);
  revalidatePath(`/org/${organizationId}/improvement-plan`);
  redirect(route(organizationId, error ? "error" : "validated"));
}

export async function closeImprovementGap(formData: FormData) {
  const organizationId = tenantIdSchema.parse(formData.get("organizationId"));
  const parsed = improvementGapClosureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route(organizationId, "error"));
  await requirePermission(organizationId, "improvements.validate");
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data: gap } = await supabase.from("improvement_gaps").select("id,status").eq("organization_id", organizationId).eq("id", parsed.data.gap_id).maybeSingle();
  if (!gap) redirect(route(organizationId, "notfound"));
  if (gap.status === "resolved") redirect(route(organizationId, "gap-already-closed"));
  const { data: verified } = await supabase.from("improvement_actions").select("id").eq("organization_id", organizationId).eq("gap_id", gap.id).eq("status", "verified").limit(1).maybeSingle();
  if (!verified) redirect(route(organizationId, "verification-required"));
  const { error } = await supabase.from("improvement_gaps").update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: userId }).eq("organization_id", organizationId).eq("id", gap.id);
  revalidatePath(`/org/${organizationId}/improvement-plan`);
  redirect(route(organizationId, error ? "error" : "gap-closed"));
}
