import { describe, expect, it } from "vitest";
import { buildAssessmentItemPresentations, countPendingAssessmentItems, type AssessmentItemRecord } from "./assessment-presentation";

const records = (count: number): AssessmentItemRecord[] => Array.from({ length: count }, (_, index) => ({
  id: `item-${index + 1}`,
  snapshot_item_id: `snapshot-${index + 1}`,
  response: index === 0 ? "pending" : "met",
  observation: null,
  justification: null,
  responsible_user_id: null,
}));

describe("assessment presentation", () => {
  it.each([7, 21, 60])("renders and orders every standard in a P%s evaluation", (count) => {
    const items = records(count);
    const snapshotItems = items.map((item, index) => ({ id: item.snapshot_item_id, item_code: `${count - index}.1`, item_type: "MINIMUM_STANDARD", item_snapshot: {}, minimum_standard_id: `standard-${index + 1}`, requirement_id: null }));
    const minimumStandards = snapshotItems.map((snapshot, index) => ({ id: snapshot.minimum_standard_id!, code: snapshot.item_code, functional_description: `Estándar ${index + 1}`, phva_cycle: "PLAN", criterion: `Criterio ${index + 1}`, expected_evidence: `Evidencia ${index + 1}` }));
    const result = buildAssessmentItemPresentations({ items, snapshotItems, minimumStandards, profileStandards: minimumStandards.map((standard) => ({ standard_profile_version_id: "profile", minimum_standard_id: standard.id, weight: 100 / count })), standardProfileVersionId: "profile" });
    expect(result).toHaveLength(count);
    expect(result[0].code.localeCompare(result.at(-1)!.code, "es", { numeric: true })).toBeLessThan(0);
    expect(result.every((item) => item.title && item.criterion && item.expectedEvidence && item.weight != null)).toBe(true);
  });

  it("uses the frozen snapshot as a readable fallback without exposing an id", () => {
    const [item] = records(1);
    const [result] = buildAssessmentItemPresentations({ items: [item], snapshotItems: [{ id: item.snapshot_item_id, item_code: "1.1.1", item_type: "MINIMUM_STANDARD", item_snapshot: { title: "Estándar histórico", phva_cycle: "DO" }, minimum_standard_id: null, requirement_id: null }], minimumStandards: [], profileStandards: [], standardProfileVersionId: null });
    expect(result).toMatchObject({ code: "1.1.1", title: "Estándar histórico", phvaCycle: "DO", metadataAvailable: true });
    expect(result.title).not.toContain(item.snapshot_item_id);
  });

  it("counts only pending responses so completion can be blocked", () => {
    expect(countPendingAssessmentItems([{ response: "pending" }, { response: "met" }, { response: "review_required" }])).toBe(1);
    expect(countPendingAssessmentItems([{ response: "met" }, { response: "not_met" }])).toBe(0);
  });
});
