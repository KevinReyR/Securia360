"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { requireSaasRole } from "./access";
import { createPlanSchema, createPlanVersionSchema, planConfiguration, planTransitionSchema, reconciliationResolutionSchema, reconciliationSchema, subscriptionSchema, supportSessionSchema } from "./schemas";

type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { code?: string } | null }> };
const route = (view: string, notice: string) => `/internal/saas-admin?view=${view}&notice=${notice}`;
const errorNotice = (code?: string) => code === "42501" ? "forbidden" : code === "23505" ? "conflict" : code === "23514" || code === "22023" ? "invalid" : "error";
const run = async (view: string, rpc: string, args: Record<string, unknown>) => {
  const { supabase } = await requireSaasRole({ adminOnly: true });
  const { error } = await (supabase as unknown as RpcClient).rpc(rpc, args);
  revalidatePath("/internal/saas-admin");
  redirect(route(view, error ? errorNotice(error.code) : "saved"));
};

export async function createPlan(formData: FormData) {
  const parsed = createPlanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("plans", "invalid"));
  const config = planConfiguration(parsed.data);
  return run("plans", "create_saas_billing_plan", { p_code: parsed.data.code, p_name: parsed.data.name, p_limits: config.limits, p_feature_flags: config.featureFlags });
}
export async function createPlanVersion(formData: FormData) {
  const parsed = createPlanVersionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("plans", "invalid"));
  const config = planConfiguration(parsed.data);
  return run("plans", "create_saas_billing_plan_version", { p_plan_id: parsed.data.planId, p_name: parsed.data.name, p_limits: config.limits, p_feature_flags: config.featureFlags });
}
export async function transitionPlan(formData: FormData) {
  const parsed = planTransitionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("plans", "invalid"));
  if (parsed.data.action === "publish" && parsed.data.versionId) return run("plans", "publish_saas_billing_plan_version", { p_version_id: parsed.data.versionId });
  if (parsed.data.action === "archive" && parsed.data.planId) return run("plans", "archive_saas_billing_plan", { p_plan_id: parsed.data.planId });
  redirect(route("plans", "invalid"));
}
export async function saveSubscription(formData: FormData) {
  const parsed = subscriptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("subscriptions", "invalid"));
  return run("subscriptions", "manage_saas_subscription_v2", {
    p_organization_id: parsed.data.organizationId, p_plan_version_id: parsed.data.planVersionId, p_status: parsed.data.status,
    p_trial_ends_at: parsed.data.trialEndsAt, p_period_start: parsed.data.periodStart, p_period_end: parsed.data.periodEnd,
    p_customer_reference: parsed.data.customerReference, p_subscription_reference: parsed.data.subscriptionReference, p_note: parsed.data.note,
  });
}
export async function recordReconciliation(formData: FormData) {
  const parsed = reconciliationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("reconciliation", "invalid"));
  return run("reconciliation", "record_saas_reconciliation", { p_subscription_id: parsed.data.subscriptionId, p_reference: parsed.data.reference, p_occurred_at: parsed.data.occurredAt, p_status: parsed.data.status, p_note: parsed.data.note });
}
export async function resolveReconciliation(formData: FormData) {
  const parsed = reconciliationResolutionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("reconciliation", "invalid"));
  return run("reconciliation", "resolve_saas_reconciliation", { p_reconciliation_id: parsed.data.reconciliationId, p_status: parsed.data.status, p_note: parsed.data.note });
}
export async function supportSession(formData: FormData) {
  const parsed = supportSessionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("support", "invalid"));
  const { supabase } = await requireAuthenticatedUser();
  const { error } = await (supabase as unknown as RpcClient).rpc("manage_saas_support_session", { p_organization_id: parsed.data.organizationId, p_action: parsed.data.action, p_reason: parsed.data.reason, p_session_id: parsed.data.sessionId });
  revalidatePath("/internal/saas-admin");
  redirect(route("support", error ? errorNotice(error.code) : "saved"));
}
