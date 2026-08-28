"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { can } from "@/modules/auth/permissions";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { calculationRequestSchema, indicatorCatalogSchema, indicatorStatusSchema, indicatorVersionSchema } from "./schemas";

const id = z.uuid();
const path = (organizationId: string, status: string) => `/org/${organizationId}/analytics?status=${status}`;
const organization = (formData: FormData) => id.parse(formData.get("organizationId"));
const values = (formData: FormData) => Object.fromEntries(formData);
async function db() { return (await requireAuthenticatedUser()).supabase as any; }
async function guard(organizationId: string, permission: "analytics.read" | "analytics.manage" | "analytics.approve") { if (!(await can(organizationId, permission))) redirect(path(organizationId, "forbidden")); }
async function done(organizationId: string, status: string) { revalidatePath(`/org/${organizationId}/analytics`); revalidatePath(`/org/${organizationId}`, "layout"); redirect(path(organizationId, status)); }

export async function createIndicatorCatalog(formData: FormData) {
  const organizationId = organization(formData); const parsed = indicatorCatalogSchema.safeParse(values(formData));
  if (!parsed.success) return done(organizationId, "invalid"); await guard(organizationId, "analytics.manage");
  const { error } = await (await db()).from("indicator_catalog").insert({ organization_id: organizationId, ...parsed.data, status: "active" });
  return done(organizationId, error ? "error" : "saved");
}

export async function createIndicatorVersion(formData: FormData) {
  const organizationId = organization(formData); const parsed = indicatorVersionSchema.safeParse(values(formData));
  if (!parsed.success) return done(organizationId, "invalid"); await guard(organizationId, "analytics.manage");
  const { template, ...data } = parsed.data;
  const { error } = await (await db()).from("indicator_versions").insert({ organization_id: organizationId, ...data, source_config: { template }, dimensions: [], status: "draft" });
  return done(organizationId, error ? "error" : "saved");
}

export async function updateIndicatorVersionStatus(formData: FormData) {
  const organizationId = organization(formData); const parsed = indicatorStatusSchema.safeParse(values(formData));
  if (!parsed.success) return done(organizationId, "invalid"); await guard(organizationId, parsed.data.status === "approved" ? "analytics.approve" : "analytics.manage");
  const { error } = await (await db()).from("indicator_versions").update({ status: parsed.data.status }).eq("organization_id", organizationId).eq("id", parsed.data.id);
  return done(organizationId, error ? "transition-error" : "saved");
}

export async function archiveIndicatorCatalog(formData: FormData) {
  const organizationId = organization(formData); const catalogId = id.safeParse(formData.get("id"));
  if (!catalogId.success) return done(organizationId, "invalid"); await guard(organizationId, "analytics.manage");
  const { error } = await (await db()).from("indicator_catalog").update({ status: "archived" }).eq("organization_id", organizationId).eq("id", catalogId.data);
  return done(organizationId, error ? "transition-error" : "saved");
}

export async function requestCalculation(formData: FormData) {
  const organizationId = organization(formData); const parsed = calculationRequestSchema.safeParse(values(formData));
  if (!parsed.success) return done(organizationId, "invalid"); await guard(organizationId, "analytics.manage");
  const { error } = await (await db()).rpc("request_indicator_calculation", { p_indicator_version_id: parsed.data.indicator_version_id, p_period_start: parsed.data.period_start, p_period_end: parsed.data.period_end });
  return done(organizationId, error ? "calculation-error" : "calculation-requested");
}
