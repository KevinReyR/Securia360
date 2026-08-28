import { describe, expect, it } from "vitest";
import { automationDefinition, automationRuleSchema, automationVersionSchema } from "./schemas";

describe("automation schemas", () => {
  const base = { automation_rule_id: "00000000-0000-4000-8000-000000000001", version_number: 1, event_type: "task.overdue", condition_operator: "exists", condition_field: "task_id", action_type: "create_task", task_title: "Revisar tarea vencida", task_priority: "high" };
  it("accepts only declarative rules and builds a safe definition", () => {
    const parsed = automationVersionSchema.parse(base);
    expect(automationDefinition(parsed)).toEqual({ conditions: { operator: "exists", field: "task_id" }, action: { type: "create_task", title: "Revisar tarea vencida", description: undefined, priority: "high" } });
    expect(automationRuleSchema.safeParse({ code: "TAREA_VENCIDA", name: "Tarea vencida", max_executions_per_hour: 25 }).success).toBe(true);
  });
  it("rejects arbitrary payload fields, missing equality and task actions without title", () => {
    expect(automationVersionSchema.safeParse({ ...base, condition_field: "payload.sql;drop" }).success).toBe(false);
    expect(automationVersionSchema.safeParse({ ...base, condition_operator: "equals", condition_value: "" }).success).toBe(false);
    expect(automationVersionSchema.safeParse({ ...base, task_title: "" }).success).toBe(false);
  });
});
