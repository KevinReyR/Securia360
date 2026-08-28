import { z } from "zod";

const id = z.uuid();
const condition = z.enum(["always", "exists", "equals"]);
export const automationRuleSchema = z.object({ code: z.string().trim().regex(/^[A-Z][A-Z0-9_]{2,79}$/), name: z.string().trim().min(3).max(180), max_executions_per_hour: z.coerce.number().int().min(1).max(200) });
export const automationVersionSchema = z.object({ automation_rule_id: id, version_number: z.coerce.number().int().positive(), event_type: z.enum(["organization.created", "member.invited", "site.created", "classification.changed", "assessment.completed", "risk.changed", "document.expiring", "task.overdue"]), condition_operator: condition, condition_field: z.string().trim().regex(/^[a-z][a-z0-9_]{1,79}$/).optional().or(z.literal("")), condition_value: z.string().trim().max(160).optional(), action_type: z.enum(["create_task", "record_only"]), task_title: z.string().trim().max(180).optional(), task_description: z.string().trim().max(2000).optional(), task_priority: z.enum(["low", "medium", "high", "critical"]).optional() }).superRefine((value, ctx) => {
  if (value.condition_operator !== "always" && !value.condition_field) ctx.addIssue({ code: "custom", path: ["condition_field"], message: "Selecciona un campo permitido." });
  if (value.condition_operator === "equals" && !value.condition_value) ctx.addIssue({ code: "custom", path: ["condition_value"], message: "Indica el valor esperado." });
  if (value.action_type === "create_task" && (!value.task_title || value.task_title.length < 3)) ctx.addIssue({ code: "custom", path: ["task_title"], message: "La tarea necesita un título." });
});
export const automationStatusSchema = z.object({ id, status: z.enum(["active", "paused", "emergency_stopped", "archived"]) });
export const automationIdSchema = z.object({ id });

export function automationDefinition(input: z.infer<typeof automationVersionSchema>) {
  const conditions = input.condition_operator === "always" ? { operator: "always" } : input.condition_operator === "exists" ? { operator: "exists", field: input.condition_field } : { operator: "equals", field: input.condition_field, value: input.condition_value };
  const action = input.action_type === "record_only" ? { type: "record_only" } : { type: "create_task", title: input.task_title, description: input.task_description || undefined, priority: input.task_priority ?? "medium" };
  return { conditions, action };
}
