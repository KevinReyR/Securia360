import { z } from "zod";

const id = z.uuid();
const optionalId = z.preprocess((value) => value === "" ? null : value, z.uuid().nullable());
const optionalText = z.preprocess((value) => value === "" ? null : value, z.string().trim().max(2_000).nullable());
const optionalMoney = z.preprocess((value) => value === "" ? null : value, z.coerce.number().nonnegative().max(999_999_999).nullable());
const optionalUtc = z.preprocess((value) => {
  if (value === "") return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00.000Z`;
  return value;
}, z.string().datetime({ offset: true }).nullable());
export const planSchema = z.object({ year: z.coerce.number().int().min(2000).max(2200), name: z.string().trim().min(2).max(180), budget: optionalMoney });
export const activitySchema = z.object({ plan_id: id, title: z.string().trim().min(2).max(240), description: optionalText, priority: z.enum(["critical", "high", "medium", "low"]), responsible_user_id: optionalId, budget: optionalMoney, starts_at: optionalUtc, ends_at: optionalUtc }).refine((x) => !x.starts_at || !x.ends_at || x.ends_at >= x.starts_at, { message: "La fecha final debe ser posterior a la inicial." });
export const taskSchema = z.object({ title: z.string().trim().min(2).max(240), description: optionalText, priority: z.enum(["critical", "high", "medium", "low"]), assigned_to: optionalId, due_at: optionalUtc, annual_plan_id: optionalId, plan_activity_id: optionalId, improvement_action_id: optionalId, recurrence_frequency: z.enum(["none", "daily", "weekly", "monthly", "yearly"]), recurrence_interval: z.coerce.number().int().min(1).max(365), recurrence_ends_at: optionalUtc });
export const statusSchema = z.object({ task_id: id, status: z.enum(["todo", "in_progress", "blocked", "completed", "cancelled"]) });
export const dependencySchema = z.object({ task_id: id, depends_on_task_id: id }).refine((x) => x.task_id !== x.depends_on_task_id, "Una tarea no puede depender de sí misma.");
export const commentSchema = z.object({ task_id: id, body: z.string().trim().min(2).max(2_000) });
export const evidenceSchema = z.object({ task_id: id, document_version_id: id });
