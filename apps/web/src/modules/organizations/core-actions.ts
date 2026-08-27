"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { can, type PermissionCode } from "@/modules/auth/permissions";
import { ACTIVE_ORGANIZATION_COOKIE, requireAuthenticatedUser } from "./tenant";
import {
  areaSchema,
  documentUploadSchema,
  inviteMemberSchema,
  legalEntitySchema,
  onboardingStepSchema,
  organizationSchema,
  profileSchema,
  roleAssignmentSchema,
  siteSchema,
} from "./schemas";

const tenantIdSchema = z.uuid();

function value(formData: FormData, key: string) {
  return formData.get(key);
}

function settingsPath(organizationId: string, section: string, status = "saved") {
  return `/org/${organizationId}/settings/${section}?status=${status}`;
}

async function requirePermission(organizationId: string, permission: PermissionCode, siteId?: string | null) {
  if (!(await can(organizationId, permission, siteId))) {
    redirect(`/org/${organizationId}/dashboard?error=forbidden`);
  }
}

export async function createOrganization(formData: FormData) {
  const parsed = organizationSchema.safeParse({ name: value(formData, "name"), slug: value(formData, "slug"), nit: value(formData, "nit") });
  if (!parsed.success) redirect("/organizations?error=validation");
  // Use the client that verified the session. Creating a second server client
  // can lose a just-refreshed access token during the same Server Action.
  const { userId, supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("organizations")
    .insert({ ...parsed.data, created_by: userId, updated_by: userId })
    .select("id")
    .single();
  if (error?.code === "23505") redirect("/organizations?error=conflict");
  if (error || !data) redirect("/organizations?error=unexpected");
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, data.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 31_536_000 });
  redirect(`/org/${data.id}/onboarding`);
}

export async function updateProfile(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(settingsPath(organizationId, "profile", "error"));
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  redirect(settingsPath(organizationId, "profile", error ? "error" : "saved"));
}

export async function updateOrganization(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  await requirePermission(organizationId, "organization.update");
  const parsed = organizationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(settingsPath(organizationId, "organization", "error"));
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ ...parsed.data, updated_by: userId }).eq("id", organizationId);
  revalidatePath(`/org/${organizationId}`, "layout");
  redirect(settingsPath(organizationId, "organization", error ? "error" : "saved"));
}

export async function createLegalEntity(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  await requirePermission(organizationId, "legal_entities.create");
  const parsed = legalEntitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(settingsPath(organizationId, "structure", "error"));
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from("legal_entities").insert({ organization_id: organizationId, ...parsed.data, created_by: userId, updated_by: userId });
  redirect(settingsPath(organizationId, "structure", error ? "error" : "saved"));
}

export async function updateLegalEntity(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  const entityId = z.uuid().parse(value(formData, "entityId"));
  await requirePermission(organizationId, "legal_entities.update");
  const parsed = legalEntitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(settingsPath(organizationId, "structure", "error"));
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from("legal_entities").update({ ...parsed.data, updated_by: userId }).eq("organization_id", organizationId).eq("id", entityId);
  redirect(settingsPath(organizationId, "structure", error ? "error" : "saved"));
}

export async function createSite(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  await requirePermission(organizationId, "sites.create");
  const parsed = siteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(settingsPath(organizationId, "structure", "error"));
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from("sites").insert({ organization_id: organizationId, ...parsed.data, created_by: userId, updated_by: userId });
  redirect(settingsPath(organizationId, "structure", error ? "error" : "saved"));
}

export async function updateSite(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  const siteId = z.uuid().parse(value(formData, "siteId"));
  await requirePermission(organizationId, "sites.update", siteId);
  const parsed = siteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(settingsPath(organizationId, "structure", "error"));
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from("sites").update({ ...parsed.data, updated_by: userId }).eq("organization_id", organizationId).eq("id", siteId);
  redirect(settingsPath(organizationId, "structure", error ? "error" : "saved"));
}

export async function createArea(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  const parsed = areaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(settingsPath(organizationId, "structure", "error"));
  await requirePermission(organizationId, "areas.create", parsed.data.site_id);
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from("areas").insert({ organization_id: organizationId, ...parsed.data, created_by: userId, updated_by: userId });
  redirect(settingsPath(organizationId, "structure", error ? "error" : "saved"));
}

export async function uploadDocument(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  await requirePermission(organizationId, "documents.create");
  const parsed = documentUploadSchema.safeParse(Object.fromEntries(formData));
  const file = formData.get("file");
  if (!parsed.success || !(file instanceof File) || file.size === 0 || file.size > 26_214_400 || !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) redirect(`/org/${organizationId}/documents?status=error`);
  const { userId } = await requireAuthenticatedUser();
  const documentId = crypto.randomUUID(); const versionId = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180) || "archivo";
  const bucket = parsed.data.entity_type === "evidence" ? "evidences" : "organization-documents";
  const path = `${organizationId}/${parsed.data.entity_type}/${parsed.data.entity_id}/${documentId}/${safeName}`;
  const supabase = await createClient();
  const { error: storageError } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (storageError) redirect(`/org/${organizationId}/documents?status=error`);
  const { error } = await supabase.from("documents").insert({ id: documentId, organization_id: organizationId, entity_type: parsed.data.entity_type, entity_id: parsed.data.entity_id, title: parsed.data.title, expires_at: parsed.data.expires_at, created_by: userId, updated_by: userId }).then(async ({ error: documentError }) => {
    if (documentError) return { error: documentError };
    return supabase.from("document_versions").insert({ id: versionId, organization_id: organizationId, document_id: documentId, version_number: 1, bucket_id: bucket, storage_path: path, original_name: file.name, mime_type: file.type, size_bytes: file.size, uploaded_by: userId });
  });
  if (error) { await supabase.storage.from(bucket).remove([path]); redirect(`/org/${organizationId}/documents?status=error`); }
  revalidatePath(`/org/${organizationId}/documents`); redirect(`/org/${organizationId}/documents?status=saved`);
}

export async function updateArea(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  const areaId = z.uuid().parse(value(formData, "areaId"));
  const parsed = areaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(settingsPath(organizationId, "structure", "error"));
  await requirePermission(organizationId, "areas.update", parsed.data.site_id);
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from("areas").update({ ...parsed.data, updated_by: userId }).eq("organization_id", organizationId).eq("id", areaId);
  redirect(settingsPath(organizationId, "structure", error ? "error" : "saved"));
}

const statusSchema = z.object({ organizationId: z.uuid(), table: z.enum(["legal_entities", "sites", "areas"]), id: z.uuid(), status: z.enum(["active", "inactive"]), siteId: z.uuid().optional() });

export async function setStructureStatus(formData: FormData) {
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/organizations");
  const permission = `${parsed.data.table}.update` as PermissionCode;
  await requirePermission(parsed.data.organizationId, permission, parsed.data.siteId);
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from(parsed.data.table).update({ status: parsed.data.status, updated_by: userId }).eq("organization_id", parsed.data.organizationId).eq("id", parsed.data.id);
  redirect(settingsPath(parsed.data.organizationId, "structure", error ? "error" : "saved"));
}

const deleteStructureSchema = z.object({
  organizationId: z.uuid(),
  id: z.uuid(),
  confirmation: z.string().trim().min(1).max(180),
});

export async function deleteLegalEntity(formData: FormData) {
  const parsed = deleteStructureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/organizations");
  await requirePermission(parsed.data.organizationId, "legal_entities.delete");
  const supabase = await createClient();
  const { data: entity } = await supabase.from("legal_entities").select("legal_name").eq("organization_id", parsed.data.organizationId).eq("id", parsed.data.id).maybeSingle();
  if (!entity || entity.legal_name !== parsed.data.confirmation) redirect(settingsPath(parsed.data.organizationId, "structure", "confirmation"));
  const { count } = await supabase.from("sites").select("id", { count: "exact", head: true }).eq("organization_id", parsed.data.organizationId).eq("legal_entity_id", parsed.data.id);
  if ((count ?? 0) > 0) redirect(settingsPath(parsed.data.organizationId, "structure", "restricted"));
  const { error } = await supabase.from("legal_entities").delete().eq("organization_id", parsed.data.organizationId).eq("id", parsed.data.id);
  revalidatePath(`/org/${parsed.data.organizationId}/settings/structure`);
  redirect(settingsPath(parsed.data.organizationId, "structure", error ? "error" : "deleted"));
}

export async function deleteSite(formData: FormData) {
  const parsed = deleteStructureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/organizations");
  await requirePermission(parsed.data.organizationId, "sites.delete", parsed.data.id);
  const supabase = await createClient();
  const { data: site } = await supabase.from("sites").select("name").eq("organization_id", parsed.data.organizationId).eq("id", parsed.data.id).maybeSingle();
  if (!site || site.name !== parsed.data.confirmation) redirect(settingsPath(parsed.data.organizationId, "structure", "confirmation"));
  const { count } = await supabase.from("areas").select("id", { count: "exact", head: true }).eq("organization_id", parsed.data.organizationId).eq("site_id", parsed.data.id);
  const { error } = await supabase.from("sites").delete().eq("organization_id", parsed.data.organizationId).eq("id", parsed.data.id);
  revalidatePath(`/org/${parsed.data.organizationId}/settings/structure`);
  redirect(settingsPath(parsed.data.organizationId, "structure", error ? "error" : (count ?? 0) > 0 ? "cascade" : "deleted"));
}

export async function deleteArea(formData: FormData) {
  const parsed = deleteStructureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/organizations");
  const supabase = await createClient();
  const { data: area } = await supabase.from("areas").select("name,site_id").eq("organization_id", parsed.data.organizationId).eq("id", parsed.data.id).maybeSingle();
  if (!area || area.name !== parsed.data.confirmation) redirect(settingsPath(parsed.data.organizationId, "structure", "confirmation"));
  await requirePermission(parsed.data.organizationId, "areas.delete", area.site_id);
  const { count } = await supabase.from("areas").select("id", { count: "exact", head: true }).eq("organization_id", parsed.data.organizationId).eq("parent_area_id", parsed.data.id);
  const { error } = await supabase.from("areas").delete().eq("organization_id", parsed.data.organizationId).eq("id", parsed.data.id);
  revalidatePath(`/org/${parsed.data.organizationId}/settings/structure`);
  redirect(settingsPath(parsed.data.organizationId, "structure", error ? "error" : (count ?? 0) > 0 ? "unlinked" : "deleted"));
}

export async function inviteMember(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  await requirePermission(organizationId, "members.create");
  const parsed = inviteMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(settingsPath(organizationId, "members", "error"));
  const supabase = await createClient();
  const { error } = await supabase.functions.invoke("invite-member", { body: { organizationId, ...parsed.data } });
  redirect(settingsPath(organizationId, "members", error ? "error" : "saved"));
}

export async function assignRole(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  await requirePermission(organizationId, "members.roles_manage");
  const parsed = roleAssignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(settingsPath(organizationId, "members", "error"));
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { error } = await supabase.from("member_roles").insert({ organization_id: organizationId, organization_member_id: parsed.data.member_id, role_id: parsed.data.role_id, site_id: parsed.data.site_id, created_by: userId });
  redirect(settingsPath(organizationId, "members", error ? "error" : "saved"));
}

export async function setMemberStatus(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  const memberId = z.uuid().parse(value(formData, "memberId"));
  const status = z.enum(["active", "inactive"]).parse(value(formData, "status"));
  await requirePermission(organizationId, "members.update");
  const supabase = await createClient();
  const { error } = await supabase.from("organization_members").update({ status }).eq("organization_id", organizationId).eq("id", memberId);
  redirect(settingsPath(organizationId, "members", error ? "error" : "saved"));
}

export async function removeRole(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  const memberRoleId = z.uuid().parse(value(formData, "memberRoleId"));
  await requirePermission(organizationId, "members.roles_manage");
  const supabase = await createClient();
  const { error } = await supabase.from("member_roles").delete().eq("organization_id", organizationId).eq("id", memberRoleId);
  redirect(settingsPath(organizationId, "members", error ? "error" : "saved"));
}

export type OnboardingActionResult = { ok: true; currentStep: number } | { ok: false; message: string };

export async function saveOnboardingStep(input: unknown): Promise<OnboardingActionResult> {
  const parsed = onboardingStepSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos del paso." };
  }

  await requirePermission(parsed.data.organizationId, "onboarding.manage");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_organization_onboarding_step", {
    p_organization_id: parsed.data.organizationId,
    p_step: parsed.data.step,
    p_data: parsed.data.data,
  });

  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, message: "No fue posible guardar el avance. Intenta nuevamente." };
  }

  const currentStep = Number((data as { current_step?: unknown }).current_step);
  return { ok: true, currentStep: Number.isInteger(currentStep) ? currentStep : Math.min(parsed.data.step + 1, 9) };
}

export async function completeOnboarding(organizationIdInput: string, idempotencyKeyInput: string) {
  const organizationId = tenantIdSchema.parse(organizationIdInput);
  const idempotencyKey = z.uuid().parse(idempotencyKeyInput);
  await requirePermission(organizationId, "onboarding.manage");
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_organization_onboarding", {
    p_organization_id: organizationId,
    p_idempotency_key: idempotencyKey,
  });

  if (error) redirect(`/org/${organizationId}/onboarding?status=error`);
  revalidatePath(`/org/${organizationId}`, "layout");
  redirect(`/org/${organizationId}/dashboard?onboarding=complete`);
}
