/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
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

export async function loadRoleDashboard(organizationId: string, options: { duePage?: number; duePageSize?: number } = {}) {
  const supabase = await createClient();
  const now = new Date();
  const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const duePage = Math.max(1, options.duePage ?? 1);
  const duePageSize = Math.max(1, Math.min(50, options.duePageSize ?? 7));
  const [assessmentRead, assessmentManage, snapshotCreate, planningRead, improvementRead, documentRead, siteRead] = await Promise.all([
    can(organizationId, "assessments.read"), can(organizationId, "assessments.manage"), can(organizationId, "snapshots.create"),
    can(organizationId, "planning.read"), can(organizationId, "improvements.read"), can(organizationId, "documents.read"), can(organizationId, "sites.read"),
  ]);
  const empty = { data: null, error: null, count: 0 };
  const dueQuery = (supabase as any).from("workspace_due_items").select("organization_id,item_type,item_id,title,priority,due_at,status", { count: "exact" }).eq("organization_id", organizationId).lte("due_at", horizon).order("due_at", { ascending: true }).range((duePage - 1) * duePageSize, duePage * duePageSize - 1);
  const [tasksCount, actionsCount, documentsCount, dueResult, openAssessmentResult, assessmentResult, sitesResult, planResult] = await Promise.all([
    planningRead ? supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).not("status", "in", "(completed,cancelled)") : Promise.resolve(empty),
    improvementRead ? supabase.from("improvement_actions").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).not("status", "in", "(verified,cancelled)") : Promise.resolve(empty),
    documentRead ? supabase.from("documents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active") : Promise.resolve(empty),
    planningRead || improvementRead || documentRead ? dueQuery : Promise.resolve(empty),
    assessmentRead ? supabase.from("assessments").select("id,status,updated_at,assessment_items(response)").eq("organization_id", organizationId).in("status", ["draft", "in_progress"]).order("updated_at", { ascending: false }).limit(1).maybeSingle() : Promise.resolve(empty),
    assessmentRead ? supabase.from("assessments").select("id,score,status,updated_at").eq("organization_id", organizationId).in("status", ["completed", "validated"]).order("updated_at", { ascending: false }).limit(1).maybeSingle() : Promise.resolve(empty),
    siteRead ? supabase.from("sites").select("id,name,status").eq("organization_id", organizationId).eq("status", "active").order("name") : Promise.resolve(empty),
    planningRead ? supabase.from("annual_plans").select("id,name,year,status").eq("organization_id", organizationId).order("year", { ascending: false }).limit(1).maybeSingle() : Promise.resolve(empty),
  ]);

  const inbox: ActionInboxItem[] = ((dueResult.data ?? []) as any[]).map((item) => {
    const type = item.item_type as ActionInboxItem["type"];
    const target = type === "task" ? `planning?taskStatus=open&focus=${item.item_id}#task-${item.item_id}` : type === "improvement" ? `improvement-plan?actionState=open&focus=${item.item_id}#action-${item.item_id}` : `documents/${item.item_id}`;
    return { id: item.item_id, type, title: item.title, context: type === "task" ? "Tarea" : type === "improvement" ? "Acción de mejora" : "Documento por vencer", priority: normalizePriority(item.priority), dueAt: item.due_at, ...duePresentation(item.due_at, now), href: `/org/${organizationId}/${target}` };
  });

  const openItems = ((openAssessmentResult.data as any)?.assessment_items ?? []) as Array<{ response: string }>;
  return {
    metrics: { open_tasks: tasksCount.count ?? 0, open_actions: actionsCount.count ?? 0, active_documents: documentsCount.count ?? 0 },
    openAssessment: openAssessmentResult.data ? { ...(openAssessmentResult.data as any), answered: openItems.filter((item) => item.response === "met" || item.response === "not_met").length, total: openItems.length } : null,
    latestAssessment: assessmentResult.data,
    latestPlan: planResult.data,
    sites: sitesResult.data ?? [],
    inbox,
    dueSoon: dueResult.count ?? 0,
    duePage,
    duePages: Math.max(1, Math.ceil((dueResult.count ?? 0) / duePageSize)),
    permissions: { assessmentRead, assessmentManage, snapshotCreate, planningRead, improvementRead, documentRead, siteRead },
    hasErrors: [tasksCount.error, actionsCount.error, documentsCount.error, dueResult.error, openAssessmentResult.error, assessmentResult.error, sitesResult.error, planResult.error].some(Boolean),
  };
}
