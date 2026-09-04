"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { subscriptionSchema, supportSessionSchema } from "./schemas";

type Client = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { code?: string } | null }> };
const route = (notice: string) => `/internal/saas-admin?notice=${notice}`;
const errorNotice = (code?: string) => code === "42501" ? "forbidden" : code === "23514" || code === "22023" ? "invalid" : "error";

export async function saveSubscription(formData: FormData) {
  const parsed = subscriptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("invalid"));
  const { supabase } = await requireAuthenticatedUser();
  const { error } = await (supabase as unknown as Client).rpc("manage_saas_subscription", {
    p_organization_id: parsed.data.organizationId,
    p_plan_id: parsed.data.planId,
    p_status: parsed.data.status,
    p_trial_ends_at: parsed.data.trialEndsAt,
    p_period_start: parsed.data.periodStart,
    p_period_end: parsed.data.periodEnd,
    p_note: parsed.data.note,
  });
  revalidatePath("/internal/saas-admin");
  redirect(route(error ? errorNotice(error.code) : "saved"));
}

export async function supportSession(formData: FormData) {
  const parsed = supportSessionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("invalid"));
  const { supabase } = await requireAuthenticatedUser();
  const { error } = await (supabase as unknown as Client).rpc("manage_saas_support_session", {
    p_organization_id: parsed.data.organizationId,
    p_action: parsed.data.action,
    p_reason: parsed.data.reason,
    p_session_id: parsed.data.sessionId,
  });
  revalidatePath("/internal/saas-admin");
  redirect(route(error ? errorNotice(error.code) : "saved"));
}
