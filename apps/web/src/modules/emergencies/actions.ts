"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { can, type PermissionCode } from "@/modules/auth/permissions";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { emergencyViews } from "./emergency-navigation";
import { actionSchema, brigadeMemberSchema, brigadeSchema, directorySchema, drillSchema, findingSchema, planSchema, resourceSchema, resultSchema, scenarioSchema, stateSchema } from "./schemas";

const id = z.uuid();
const emergencyView = z.enum(emergencyViews);
const values = (formData: FormData) => Object.fromEntries(formData);
const organization = (formData: FormData) => id.parse(formData.get("organizationId"));

function route(organizationId: string, status: string, formData?: FormData) {
  const search = new URLSearchParams();
  const site = formData ? id.safeParse(formData.get("return_site")) : null;
  const view = formData ? emergencyView.safeParse(formData.get("return_view")) : null;
  if (site?.success) search.set("site", site.data);
  search.set("view", view?.success ? view.data : "summary");
  search.set("status", status);
  return `/org/${organizationId}/emergencies?${search.toString()}`;
}

async function database() {
  return (await requireAuthenticatedUser()).supabase as any;
}

async function guard(organizationId: string, permission: PermissionCode, siteId: string | null | undefined, formData: FormData) {
  if (!(await can(organizationId, permission, siteId))) redirect(route(organizationId, "forbidden", formData));
}

async function finish(organizationId: string, status: string, formData: FormData) {
  revalidatePath(`/org/${organizationId}/emergencies`);
  redirect(route(organizationId, status, formData));
}

async function insert(formData: FormData, schema: z.ZodType, table: string, permission: PermissionCode = "emergencies.manage") {
  const organizationId = organization(formData);
  const parsed = schema.safeParse(values(formData));
  if (!parsed.success) redirect(route(organizationId, "invalid", formData));
  const data = parsed.data as Record<string, any>;
  await guard(organizationId, permission, data.site_id, formData);
  const { userId } = await requireAuthenticatedUser();
  const { error } = await (await database()).from(table).insert({ organization_id: organizationId, ...data, created_by: userId });
  await finish(organizationId, error ? "error" : "saved", formData);
}

export async function createScenario(formData: FormData) { return insert(formData, scenarioSchema, "emergency_scenarios"); }
export async function createResource(formData: FormData) { return insert(formData, resourceSchema, "emergency_resources"); }
export async function createBrigade(formData: FormData) { return insert(formData, brigadeSchema, "emergency_brigades"); }
export async function createDirectoryEntry(formData: FormData) { return insert(formData, directorySchema, "emergency_directory_entries"); }
export async function createPlan(formData: FormData) { return insert(formData, planSchema, "emergency_plan_versions"); }
export async function createDrill(formData: FormData) { return insert(formData, drillSchema, "emergency_drills"); }

export async function addBrigadeMember(formData: FormData) {
  const organizationId = organization(formData);
  const parsed = brigadeMemberSchema.safeParse(values(formData));
  if (!parsed.success) redirect(route(organizationId, "invalid", formData));
  const db = await database();
  const { data: brigade } = await db.from("emergency_brigades").select("site_id").eq("organization_id", organizationId).eq("id", parsed.data.emergency_brigade_id).maybeSingle();
  if (!brigade) redirect(route(organizationId, "notfound", formData));
  await guard(organizationId, "emergencies.manage", brigade.site_id, formData);
  const { error } = await db.from("emergency_brigade_members").insert({ organization_id: organizationId, ...parsed.data });
  await finish(organizationId, error ? "error" : "saved", formData);
}

export async function recordDrillResult(formData: FormData) {
  const organizationId = organization(formData);
  const parsed = resultSchema.safeParse(values(formData));
  if (!parsed.success) redirect(route(organizationId, "invalid", formData));
  const db = await database();
  const { data: drill } = await db.from("emergency_drills").select("site_id").eq("organization_id", organizationId).eq("id", parsed.data.emergency_drill_id).maybeSingle();
  if (!drill) redirect(route(organizationId, "notfound", formData));
  await guard(organizationId, "emergencies.manage", drill.site_id, formData);
  const { userId } = await requireAuthenticatedUser();
  const { error } = await db.from("emergency_drill_results").insert({ organization_id: organizationId, ...parsed.data, recorded_by: userId });
  if (!error) await db.from("emergency_drills").update({ status: "completed", conducted_at: new Date().toISOString() }).eq("organization_id", organizationId).eq("id", parsed.data.emergency_drill_id);
  await finish(organizationId, error ? "error" : "saved", formData);
}

export async function createFinding(formData: FormData) {
  const organizationId = organization(formData);
  const parsed = findingSchema.safeParse(values(formData));
  if (!parsed.success) redirect(route(organizationId, "invalid", formData));
  const db = await database();
  const { data: drill } = await db.from("emergency_drills").select("site_id").eq("organization_id", organizationId).eq("id", parsed.data.emergency_drill_id).maybeSingle();
  if (!drill) redirect(route(organizationId, "notfound", formData));
  await guard(organizationId, "emergencies.manage", drill.site_id, formData);
  const { userId } = await requireAuthenticatedUser();
  const { error } = await db.from("emergency_findings").insert({ organization_id: organizationId, ...parsed.data, created_by: userId });
  await finish(organizationId, error ? "error" : "saved", formData);
}

export async function createAction(formData: FormData) {
  const organizationId = organization(formData);
  const parsed = actionSchema.safeParse(values(formData));
  if (!parsed.success) redirect(route(organizationId, "invalid", formData));
  const db = await database();
  const { data: finding } = await db.from("emergency_findings").select("emergency_drills(site_id)").eq("organization_id", organizationId).eq("id", parsed.data.emergency_finding_id).maybeSingle();
  const siteId = (finding as any)?.emergency_drills?.site_id;
  if (!siteId) redirect(route(organizationId, "notfound", formData));
  await guard(organizationId, "emergencies.manage", siteId, formData);
  const { error } = await db.from("emergency_actions").insert({ organization_id: organizationId, ...parsed.data });
  await finish(organizationId, error ? "error" : "saved", formData);
}

export async function setPlanStatus(formData: FormData) {
  const organizationId = organization(formData);
  const parsed = stateSchema.safeParse(values(formData));
  if (!parsed.success) redirect(route(organizationId, "invalid", formData));
  const db = await database();
  const { data: plan } = await db.from("emergency_plan_versions").select("site_id").eq("organization_id", organizationId).eq("id", parsed.data.id).maybeSingle();
  if (!plan) redirect(route(organizationId, "notfound", formData));
  await guard(organizationId, parsed.data.status === "approved" ? "emergencies.approve" : "emergencies.manage", plan.site_id, formData);
  const { error } = await db.from("emergency_plan_versions").update({ status: parsed.data.status }).eq("organization_id", organizationId).eq("id", parsed.data.id);
  await finish(organizationId, error ? "transition" : "saved", formData);
}

export async function setActionStatus(formData: FormData) {
  const organizationId = organization(formData);
  const parsed = stateSchema.safeParse(values(formData));
  if (!parsed.success) redirect(route(organizationId, "invalid", formData));
  const db = await database();
  const { data: action } = await db.from("emergency_actions").select("id,emergency_findings(emergency_drills(site_id))").eq("organization_id", organizationId).eq("id", parsed.data.id).maybeSingle();
  const siteId = (action as any)?.emergency_findings?.emergency_drills?.site_id;
  if (!siteId) redirect(route(organizationId, "notfound", formData));
  await guard(organizationId, parsed.data.status === "verified" ? "emergencies.approve" : "emergencies.manage", siteId, formData);
  const { error } = await db.from("emergency_actions").update({ status: parsed.data.status }).eq("organization_id", organizationId).eq("id", parsed.data.id);
  await finish(organizationId, error ? "transition" : "saved", formData);
}

export async function uploadEmergencyEvidence(formData: FormData) {
  const organizationId = organization(formData);
  const entityType = z.enum(["emergency_resource", "emergency_plan_version", "emergency_action"]).safeParse(formData.get("entity_type"));
  const entityId = id.safeParse(formData.get("entity_id"));
  const file = formData.get("file");
  if (!entityType.success || !entityId.success || !(file instanceof File) || file.size < 1 || file.size > 26_214_400 || !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) redirect(route(organizationId, "invalid", formData));
  const db = await database();
  let siteId: string | null = null;
  if (entityType.data === "emergency_resource") {
    siteId = (await db.from("emergency_resources").select("site_id").eq("organization_id", organizationId).eq("id", entityId.data).maybeSingle()).data?.site_id ?? null;
  } else if (entityType.data === "emergency_plan_version") {
    siteId = (await db.from("emergency_plan_versions").select("site_id").eq("organization_id", organizationId).eq("id", entityId.data).maybeSingle()).data?.site_id ?? null;
  } else {
    siteId = (await db.from("emergency_actions").select("emergency_findings(emergency_drills(site_id))").eq("organization_id", organizationId).eq("id", entityId.data).maybeSingle()).data?.emergency_findings?.emergency_drills?.site_id ?? null;
  }
  if (!siteId) redirect(route(organizationId, "notfound", formData));
  await guard(organizationId, "emergencies.manage", siteId, formData);
  const { userId } = await requireAuthenticatedUser();
  const documentId = crypto.randomUUID();
  const versionId = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180) || "evidencia";
  const storagePath = `${organizationId}/${entityType.data}/${entityId.data}/${documentId}/${safeName}`;
  const upload = await db.storage.from("evidences").upload(storagePath, file, { contentType: file.type, upsert: false });
  if (upload.error) redirect(route(organizationId, "evidence-error", formData));
  const document = await db.from("documents").insert({ id: documentId, organization_id: organizationId, entity_type: entityType.data, entity_id: entityId.data, title: `Emergencia · ${file.name}`, created_by: userId, updated_by: userId });
  const version = document.error ? { error: document.error } : await db.from("document_versions").insert({ id: versionId, organization_id: organizationId, document_id: documentId, version_number: 1, bucket_id: "evidences", storage_path: storagePath, original_name: file.name, mime_type: file.type, size_bytes: file.size, uploaded_by: userId });
  if (version.error) {
    await db.storage.from("evidences").remove([storagePath]);
    redirect(route(organizationId, "evidence-error", formData));
  }
  if (entityType.data === "emergency_action") await db.from("emergency_actions").update({ evidence_document_version_id: versionId }).eq("organization_id", organizationId).eq("id", entityId.data);
  if (entityType.data === "emergency_resource") await db.from("emergency_resources").update({ evidence_document_version_id: versionId }).eq("organization_id", organizationId).eq("id", entityId.data);
  if (entityType.data === "emergency_plan_version") await db.from("emergency_plan_versions").update({ document_version_id: versionId }).eq("organization_id", organizationId).eq("id", entityId.data);
  await finish(organizationId, "evidence-saved", formData);
}
