export type AssessmentResponse = "pending" | "met" | "not_met" | "not_applicable" | "review_required";

export type AssessmentItemRecord = {
  id: string;
  snapshot_item_id: string;
  response: AssessmentResponse;
  observation: string | null;
  justification: string | null;
  responsible_user_id: string | null;
};

export type SnapshotItemRecord = {
  id: string;
  item_code: string;
  item_type: string;
  item_snapshot: unknown;
  minimum_standard_id: string | null;
  requirement_id: string | null;
};

export type MinimumStandardRecord = {
  id: string;
  code: string;
  functional_description: string;
  phva_cycle: string;
  criterion: string | null;
  expected_evidence: string | null;
};

export type RequirementRecord = {
  id: string;
  code: string;
  title: string;
  summary: string;
};

export type ProfileStandardRecord = {
  standard_profile_version_id: string;
  minimum_standard_id: string;
  weight: number;
};

export type AssessmentItemPresentation = AssessmentItemRecord & {
  code: string;
  title: string;
  phvaCycle: string | null;
  criterion: string | null;
  expectedEvidence: string | null;
  weight: number | null;
  metadataAvailable: boolean;
};

const snapshotText = (value: unknown, keys: string[]) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
};

export function buildAssessmentItemPresentations(input: {
  items: AssessmentItemRecord[];
  snapshotItems: SnapshotItemRecord[];
  minimumStandards: MinimumStandardRecord[];
  requirements?: RequirementRecord[];
  profileStandards: ProfileStandardRecord[];
  standardProfileVersionId: string | null;
}) {
  const snapshotById = new Map(input.snapshotItems.map((item) => [item.id, item]));
  const standardById = new Map(input.minimumStandards.map((standard) => [standard.id, standard]));
  const requirementById = new Map((input.requirements ?? []).map((requirement) => [requirement.id, requirement]));
  const weightByStandard = new Map(
    input.profileStandards
      .filter((entry) => entry.standard_profile_version_id === input.standardProfileVersionId)
      .map((entry) => [entry.minimum_standard_id, Number(entry.weight)]),
  );

  return input.items.map<AssessmentItemPresentation>((item) => {
    const snapshot = snapshotById.get(item.snapshot_item_id);
    const standard = snapshot?.minimum_standard_id ? standardById.get(snapshot.minimum_standard_id) : undefined;
    const requirement = snapshot?.requirement_id ? requirementById.get(snapshot.requirement_id) : undefined;
    const frozenCode = snapshotText(snapshot?.item_snapshot, ["code", "item_code"]);
    const frozenTitle = snapshotText(snapshot?.item_snapshot, ["functional_description", "title", "description", "summary"]);
    const code = standard?.code ?? requirement?.code ?? snapshot?.item_code ?? frozenCode ?? "Elemento histórico";
    const title = standard?.functional_description ?? requirement?.title ?? frozenTitle ?? "Contenido conservado en el corte histórico";

    return {
      ...item,
      code,
      title,
      phvaCycle: standard?.phva_cycle ?? snapshotText(snapshot?.item_snapshot, ["phva_cycle"]),
      criterion: standard?.criterion ?? snapshotText(snapshot?.item_snapshot, ["criterion"]),
      expectedEvidence: standard?.expected_evidence ?? snapshotText(snapshot?.item_snapshot, ["expected_evidence"]),
      weight: snapshot?.minimum_standard_id ? weightByStandard.get(snapshot.minimum_standard_id) ?? null : null,
      metadataAvailable: Boolean(standard || requirement || frozenTitle),
    };
  }).sort((left, right) => left.code.localeCompare(right.code, "es", { numeric: true, sensitivity: "base" }));
}

export function countPendingAssessmentItems(items: Array<{ response: string }>) {
  return items.filter((item) => item.response === "pending").length;
}
