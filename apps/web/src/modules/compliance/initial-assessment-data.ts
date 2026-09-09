/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { buildAssessmentItemPresentations, type AssessmentItemRecord, type MinimumStandardRecord, type ProfileStandardRecord, type SnapshotItemRecord } from "./assessment-presentation";

export async function loadInitialAssessment(organizationId: string, assessmentId: string) {
  const supabase = await createClient() as any;
  const { data: assessment, error } = await supabase.from("assessments").select("id,organization_id,snapshot_id,standard_profile_version_id,scoring_rule_id,status,score,score_explanation,created_at,updated_at,completed_at,assessment_items(id,snapshot_item_id,response,score,observation,justification,responsible_user_id)").eq("organization_id", organizationId).eq("id", assessmentId).maybeSingle();
  if (error || !assessment) return null;
  const snapshotIds = [assessment.snapshot_id];
  const [{ data: snapshotItems }, { data: weights }, { data: profileVersion }] = await Promise.all([
    supabase.from("organization_standard_snapshot_items").select("id,item_code,item_type,item_snapshot,minimum_standard_id,requirement_id").in("snapshot_id", snapshotIds),
    supabase.from("profile_standards").select("standard_profile_version_id,minimum_standard_id,weight").eq("standard_profile_version_id", assessment.standard_profile_version_id),
    supabase.from("standard_profile_versions").select("id,version_code,standard_profile_id,standard_profiles(code,name)").eq("id", assessment.standard_profile_version_id).maybeSingle(),
  ]);
  const standardIds = [...new Set((snapshotItems ?? []).map((item: any) => item.minimum_standard_id).filter(Boolean))];
  const { data: standards } = standardIds.length ? await supabase.from("minimum_standards").select("id,code,functional_description,phva_cycle,criterion,expected_evidence").in("id", standardIds) : { data: [] };
  const presented = buildAssessmentItemPresentations({
    items: (assessment.assessment_items ?? []) as AssessmentItemRecord[],
    snapshotItems: (snapshotItems ?? []) as SnapshotItemRecord[],
    minimumStandards: (standards ?? []) as MinimumStandardRecord[],
    profileStandards: (weights ?? []) as ProfileStandardRecord[],
    standardProfileVersionId: assessment.standard_profile_version_id,
  });
  const scores = new Map((assessment.assessment_items ?? []).map((item: any) => [item.id, Number(item.score ?? 0)]));
  return { assessment, profileVersion, items: presented.map((item) => ({ ...item, score: scores.get(item.id) ?? 0 })) };
}
