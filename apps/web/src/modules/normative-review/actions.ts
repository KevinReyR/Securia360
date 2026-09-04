"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { artifactSchema, decisionSchema, proposalSchema, reviewerSchema } from "./schemas";

const route = (status: string) => `/internal/normative-review?notice=${status}`;
type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message?: string; code?: string } | null }> };

function status(error: { code?: string } | null) {
  if (!error) return "saved";
  if (error.code === "42501") return "forbidden";
  if (error.code === "P0002") return "not-found";
  if (error.code === "22023" || error.code === "23514") return "invalid";
  return "error";
}

async function call(name: string, args: Record<string, unknown>) {
  const { supabase } = await requireAuthenticatedUser();
  return (supabase as unknown as RpcClient).rpc(name, args);
}

export async function manageReviewer(formData: FormData) {
  const parsed = reviewerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("invalid"));
  const { error } = await call("manage_normative_reviewer", {
    p_email: parsed.data.email,
    p_role: parsed.data.role,
    p_status: parsed.data.status,
    p_reason: parsed.data.reason,
  });
  revalidatePath("/internal/normative-review");
  redirect(route(status(error)));
}

export async function createArtifact(formData: FormData) {
  const parsed = artifactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("invalid"));
  const { error } = await call("create_normative_review_artifact", {
    p_artifact_type: parsed.data.artifactType,
    p_artifact_key: parsed.data.artifactKey,
    p_title: parsed.data.title,
    p_source_path: parsed.data.sourcePath ?? "",
    p_content: parsed.data.content,
  });
  revalidatePath("/internal/normative-review");
  redirect(route(status(error)));
}

export async function createProposal(formData: FormData) {
  const parsed = proposalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("invalid"));
  const { error } = await call("create_normative_review_proposal", {
    p_artifact_id: parsed.data.artifactId,
    p_content: parsed.data.content,
    p_rationale: parsed.data.rationale,
  });
  revalidatePath("/internal/normative-review");
  redirect(route(status(error)));
}

export async function decideReview(formData: FormData) {
  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(route("invalid"));
  const { error } = await call("decide_normative_review", {
    p_artifact_id: parsed.data.artifactId,
    p_proposal_id: parsed.data.proposalId,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note,
  });
  revalidatePath("/internal/normative-review");
  redirect(route(status(error)));
}
