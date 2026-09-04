import { createClient } from "@/lib/supabase/server";
import type { ActionInboxItem } from "./types";

function normalizePriority(value: string): ActionInboxItem["priority"] {
  if (value === "critical" || value === "high" || value === "low") return value;
  return "normal";
}

function duePresentation(value: string | null, now: Date) {
  if (!value) return { dueLabel: "Sin fecha definida", overdue: false };
  const days = Math.ceil((new Date(value).getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return { dueLabel: `Venció hace ${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"}`, overdue: true };
  if (days === 0) return { dueLabel: "Vence hoy", overdue: false };
  if (days === 1) return { dueLabel: "Vence mañana", overdue: false };
  return { dueLabel: `Vence en ${days} días`, overdue: false };
}

export async function loadRoleDashboard(organizationId: string) {
  const supabase = await createClient();
  const now = new Date();
  const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const [metricsResult, tasksResult, actionsResult, documentsResult, assessmentResult, sitesResult, planResult] = await Promise.all([
    supabase.from("management_dashboard_metrics").select("open_tasks,open_actions,active_documents").eq("organization_id", organizationId).maybeSingle(),
    supabase.from("tasks").select("id,title,status,priority,due_at").eq("organization_id", organizationId).not("status", "in", "(completed,cancelled)").order("due_at", { ascending: true, nullsFirst: false }).limit(5),
    supabase.from("improvement_actions").select("id,title,status,priority,target_date").eq("organization_id", organizationId).not("status", "in", "(verified,cancelled)").order("target_date", { ascending: true, nullsFirst: false }).limit(5),
    supabase.from("documents").select("id,title,expires_at,status").eq("organization_id", organizationId).eq("status", "active").not("expires_at", "is", null).lte("expires_at", horizon).order("expires_at").limit(5),
    supabase.from("assessments").select("id,score,status,updated_at").eq("organization_id", organizationId).in("status", ["completed", "validated"]).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("sites").select("id,name,status").eq("organization_id", organizationId).eq("status", "active").order("name"),
    supabase.from("annual_plans").select("id,name,year,status").eq("organization_id", organizationId).order("year", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const inbox: ActionInboxItem[] = [
    ...(tasksResult.data ?? []).map((item) => ({ id: item.id, type: "task" as const, title: item.title, context: "Tarea", priority: normalizePriority(item.priority), dueAt: item.due_at, ...duePresentation(item.due_at, now), href: `/org/${organizationId}/planning` })),
    ...(actionsResult.data ?? []).map((item) => ({ id: item.id, type: "improvement" as const, title: item.title, context: "Acción de mejora", priority: normalizePriority(item.priority), dueAt: item.target_date, ...duePresentation(item.target_date, now), href: `/org/${organizationId}/improvement-plan` })),
    ...(documentsResult.data ?? []).map((item) => ({ id: item.id, type: "document" as const, title: item.title, context: "Documento por vencer", priority: "high" as const, dueAt: item.expires_at, ...duePresentation(item.expires_at, now), href: `/org/${organizationId}/documents` })),
  ].sort((left, right) => {
    if (!left.dueAt) return 1;
    if (!right.dueAt) return -1;
    return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
  }).slice(0, 7);

  const dueSoon = inbox.filter((item) => item.dueAt && new Date(item.dueAt).getTime() <= new Date(horizon).getTime()).length;
  return {
    metrics: metricsResult.data ?? { open_tasks: tasksResult.data?.length ?? 0, open_actions: actionsResult.data?.length ?? 0, active_documents: null },
    latestAssessment: assessmentResult.data,
    latestPlan: planResult.data,
    sites: sitesResult.data ?? [],
    inbox,
    dueSoon,
    hasErrors: [metricsResult.error, tasksResult.error, actionsResult.error, documentsResult.error, assessmentResult.error, sitesResult.error, planResult.error].some(Boolean),
  };
}
