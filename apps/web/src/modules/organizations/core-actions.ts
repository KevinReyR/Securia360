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
  inviteMemberSchema,
  legalEntitySchema,
  onboardingSchema,
  organizationSchema,
  profileSchema,
  roleAssignmentSchema,
  siteSchema,
} from "./schemas";

const tenantIdSchema = z.uuid();

function value(formData: FormData, key: string) {
  return formData.get(key);
}

function settingsPath(organizationId: string, section: string, status: "saved" | "error" = "saved") {
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
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert({ ...parsed.data, created_by: userId, updated_by: userId })
    .select("id")
    .single();
  if (error || !data) redirect("/organizations?error=conflict");
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

export async function completeOnboarding(formData: FormData) {
  const organizationId = tenantIdSchema.parse(value(formData, "organizationId"));
  await requirePermission(organizationId, "onboarding.manage");
  const parsed = onboardingSchema.safeParse({
    ...Object.fromEntries(formData),
    work_at_height: formData.has("work_at_height"),
    confined_spaces: formData.has("confined_spaces"),
    chemical_exposure: formData.has("chemical_exposure"),
    electrical_work: formData.has("electrical_work"),
    transport_operations: formData.has("transport_operations"),
    heavy_machinery: formData.has("heavy_machinery"),
    night_work: formData.has("night_work"),
    remote_work: formData.has("remote_work"),
    manual_load_handling: formData.has("manual_load_handling"),
  });
  if (!parsed.success) redirect(`/org/${organizationId}/onboarding?status=error`);
  const { userId } = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data: existingEntity } = await supabase.from("legal_entities").select("id").eq("organization_id", organizationId).eq("tax_id", parsed.data.tax_id).maybeSingle();
  const entityPayload = {
    legal_name: parsed.data.legal_name,
    trade_name: parsed.data.trade_name,
    tax_id: parsed.data.tax_id,
    ciiu_code: parsed.data.ciiu_code,
    economic_activity: parsed.data.economic_activity,
    employee_count: parsed.data.employee_count,
    risk_class: parsed.data.risk_class,
    updated_by: userId,
  };
  const entityResult = existingEntity
    ? await supabase.from("legal_entities").update(entityPayload).eq("id", existingEntity.id).select("id").single()
    : await supabase.from("legal_entities").insert({ organization_id: organizationId, ...entityPayload, created_by: userId }).select("id").single();
  if (entityResult.error || !entityResult.data) redirect(`/org/${organizationId}/onboarding?status=error`);
  const { error: siteError } = await supabase.from("sites").upsert({ organization_id: organizationId, legal_entity_id: entityResult.data.id, name: parsed.data.site_name, code: parsed.data.site_code, city: parsed.data.city, department: parsed.data.department, risk_class: parsed.data.risk_class, created_by: userId, updated_by: userId }, { onConflict: "organization_id,code" });
  const characteristics = {
    work_at_height: parsed.data.work_at_height,
    confined_spaces: parsed.data.confined_spaces,
    chemical_exposure: parsed.data.chemical_exposure,
    electrical_work: parsed.data.electrical_work,
    transport_operations: parsed.data.transport_operations,
    heavy_machinery: parsed.data.heavy_machinery,
    night_work: parsed.data.night_work,
    remote_work: parsed.data.remote_work,
    manual_load_handling: parsed.data.manual_load_handling,
  };
  const { error: characteristicsError } = await supabase.from("organization_characteristics").upsert({ organization_id: organizationId, ...characteristics, created_by: userId, updated_by: userId }, { onConflict: "organization_id" });
  if (siteError || characteristicsError) redirect(`/org/${organizationId}/onboarding?status=error`);
  revalidatePath(`/org/${organizationId}`, "layout");
  redirect(`/org/${organizationId}/dashboard?onboarding=complete`);
}
