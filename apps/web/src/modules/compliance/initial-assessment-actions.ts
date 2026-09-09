"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can } from "@/modules/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { initialAssessmentCompleteSchema, initialAssessmentResponseSchema, initialAssessmentStartSchema, type InitialAssessmentResponseInput } from "./initial-assessment-schemas";

type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }> };

export async function startInitialAssessment(formData: FormData) {
  const parsed = initialAssessmentStartSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/organizations");
  const { organizationId } = parsed.data;
  if (!(await can(organizationId, "assessments.manage")) || !(await can(organizationId, "snapshots.create"))) redirect(`/org/${organizationId}/compliance/initial-assessment?status=forbidden`);
  const { data, error } = await (await createClient() as unknown as RpcClient).rpc("start_or_resume_initial_assessment", { p_organization_id: organizationId });
  if (error || typeof data !== "string") redirect(`/org/${organizationId}/compliance/initial-assessment?status=unavailable`);
  revalidatePath(`/org/${organizationId}/dashboard`);
  redirect(`/org/${organizationId}/compliance/initial-assessment/${data}`);
}

export async function saveInitialAssessmentResponse(input: InitialAssessmentResponseInput) {
  const parsed = initialAssessmentResponseSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "La respuesta no es válida." };
  if (!(await can(parsed.data.organizationId, "assessments.manage"))) return { ok: false as const, message: "No tienes permiso para modificar esta evaluación." };
  const { error } = await (await createClient() as unknown as RpcClient).rpc("save_initial_assessment_response", {
    p_assessment_id: parsed.data.assessmentId,
    p_item_id: parsed.data.itemId,
    p_response: parsed.data.response,
  });
  if (error) return { ok: false as const, message: "No pudimos guardar esta respuesta. Intenta nuevamente." };
  revalidatePath(`/org/${parsed.data.organizationId}/dashboard`);
  return { ok: true as const };
}

export async function completeInitialAssessment(formData: FormData) {
  const parsed = initialAssessmentCompleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/organizations");
  const { organizationId, assessmentId } = parsed.data;
  if (!(await can(organizationId, "assessments.manage"))) redirect(`/org/${organizationId}/compliance/initial-assessment/${assessmentId}?status=forbidden`);
  const { error } = await (await createClient() as unknown as RpcClient).rpc("complete_initial_assessment", { p_assessment_id: assessmentId });
  revalidatePath(`/org/${organizationId}/dashboard`);
  revalidatePath(`/org/${organizationId}/improvement-plan`);
  redirect(`/org/${organizationId}/compliance/initial-assessment/${assessmentId}?status=${error ? "incomplete" : "completed"}`);
}
