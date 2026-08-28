"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { can } from "@/modules/auth/permissions";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { notificationPreferencesSchema, notificationTemplateSchema, notificationTemplateStatusSchema } from "./schemas";

const id = z.uuid();
const route = (organizationId: string, status = "saved") => `/org/${organizationId}/settings/notifications?status=${status}`;
const form = (data: FormData) => Object.fromEntries(data);
async function db() { return (await requireAuthenticatedUser()).supabase as any; }
async function tenant(organizationId: string) { const user = await requireAuthenticatedUser(); return { ...user, organizationId: id.parse(organizationId) }; }
async function guard(organizationId: string, permission: "notifications.read" | "notifications.manage" | "notifications.templates_approve") { if (!(await can(organizationId, permission))) redirect(route(organizationId, "forbidden")); }

export async function saveNotificationPreferences(data: FormData) {
  const organizationId = id.parse(data.get("organizationId")); const user = await tenant(organizationId);
  const parsed = notificationPreferencesSchema.safeParse({ ...form(data), in_app_enabled: data.get("in_app_enabled") === "on", email_enabled: data.get("email_enabled") === "on" });
  if (!parsed.success) redirect(route(organizationId, "invalid"));
  const { error } = await (await db()).from("notification_preferences").upsert({ organization_id: organizationId, user_id: user.userId, ...parsed.data, quiet_hours_start: parsed.data.quiet_hours_start || null, quiet_hours_end: parsed.data.quiet_hours_end || null }, { onConflict: "organization_id,user_id" });
  revalidatePath(`/org/${organizationId}`, "layout"); redirect(route(organizationId, error ? "error" : "saved"));
}

export async function markNotificationRead(data: FormData) {
  const organizationId = id.parse(data.get("organizationId")); const notificationId = id.parse(data.get("notificationId")); const user = await tenant(organizationId);
  await (await db()).from("notifications").update({ status: "read", read_at: new Date().toISOString() }).eq("id", notificationId).eq("organization_id", organizationId).eq("recipient_user_id", user.userId).eq("channel", "in_app").is("read_at", null);
  revalidatePath(`/org/${organizationId}`, "layout");
}

export async function markAllNotificationsRead(data: FormData) {
  const organizationId = id.parse(data.get("organizationId")); const user = await tenant(organizationId);
  await (await db()).from("notifications").update({ status: "read", read_at: new Date().toISOString() }).eq("organization_id", organizationId).eq("recipient_user_id", user.userId).eq("channel", "in_app").is("read_at", null);
  revalidatePath(`/org/${organizationId}`, "layout");
}

export async function createNotificationTemplate(data: FormData) {
  const organizationId = id.parse(data.get("organizationId")); const parsed = notificationTemplateSchema.safeParse(form(data));
  if (!parsed.success) redirect(route(organizationId, "invalid")); await guard(organizationId, "notifications.manage");
  const { error } = await (await db()).from("notification_templates").insert({ organization_id: organizationId, ...parsed.data, status: "draft" });
  revalidatePath(route(organizationId)); redirect(route(organizationId, error ? "template-error" : "saved"));
}

export async function updateNotificationTemplateStatus(data: FormData) {
  const organizationId = id.parse(data.get("organizationId")); const parsed = notificationTemplateStatusSchema.safeParse(form(data));
  if (!parsed.success) redirect(route(organizationId, "invalid")); await guard(organizationId, parsed.data.status === "approved" ? "notifications.templates_approve" : "notifications.manage");
  const { error } = await (await db()).from("notification_templates").update({ status: parsed.data.status }).eq("id", parsed.data.id).eq("organization_id", organizationId);
  revalidatePath(route(organizationId)); redirect(route(organizationId, error ? "template-error" : "saved"));
}
