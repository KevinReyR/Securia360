import { describe, expect, it } from "vitest";
import { dependencySchema, taskSchema } from "./planning-schemas";

describe("planning schemas", () => {
  const id = "10000000-0000-4000-8000-000000000001";
  it("normalizes browser date-times into UTC instants", () => {
    expect(taskSchema.parse({ title: "Revisar plan", description: "", priority: "medium", assigned_to: "", due_at: "2026-09-01T09:30", annual_plan_id: "", plan_activity_id: "", improvement_action_id: "", recurrence_frequency: "weekly", recurrence_interval: "1", recurrence_ends_at: "" }).due_at).toBe("2026-09-01T09:30:00.000Z");
  });
  it("rejects a self-dependency", () => expect(dependencySchema.safeParse({ task_id: id, depends_on_task_id: id }).success).toBe(false));
});
