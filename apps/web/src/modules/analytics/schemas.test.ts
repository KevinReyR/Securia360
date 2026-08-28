import { describe, expect, it } from "vitest";
import { calculationRequestSchema, indicatorCatalogSchema, indicatorVersionSchema } from "./schemas";

describe("analytics schemas", () => {
  it("accepts a supported, versioned indicator", () => {
    expect(indicatorVersionSchema.safeParse({ indicator_id: "00000000-0000-4000-8000-000000000001", version_number: 1, template: "open_tasks_count", formula_description: "Cuenta las tareas que aún requieren gestión.", periodicity: "monthly", target_value: 3, target_direction: "at_most", effective_from: "2026-08-01", effective_to: "" }).success).toBe(true);
  });
  it("rejects arbitrary templates and inverted periods", () => {
    expect(indicatorVersionSchema.safeParse({ indicator_id: "00000000-0000-4000-8000-000000000001", version_number: 1, template: "sql", formula_description: "Descripción funcional suficiente.", periodicity: "monthly", target_direction: "at_most", effective_from: "2026-08-31", effective_to: "2026-08-01" }).success).toBe(false);
    expect(calculationRequestSchema.safeParse({ indicator_version_id: "00000000-0000-4000-8000-000000000001", period_start: "2026-08-31", period_end: "2026-08-01" }).success).toBe(false);
  });
  it("normalizes catalog codes and rejects unsafe names", () => {
    expect(indicatorCatalogSchema.safeParse({ code: "tareas_abiertas", name: "Tareas abiertas", description: "" }).data?.code).toBe("TAREAS_ABIERTAS");
    expect(indicatorCatalogSchema.safeParse({ code: "x", name: "A", description: "" }).success).toBe(false);
  });
});
