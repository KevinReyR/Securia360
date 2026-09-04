import { CalendarBlank, CheckCircle, Clock, ListChecks } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/empty-state";
import { FormDrawer } from "@/components/form-drawer";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
import { addTaskComment, addTaskDependency, approvePlan, attachTaskEvidence, createActivity, createPlan, createTask, setTaskStatus } from "@/modules/organizations/planning-actions";
import { requireTenant } from "@/modules/organizations/tenant";

const taskStatusOptions = [
  ["todo", "Por hacer"],
  ["in_progress", "En ejecución"],
  ["blocked", "Bloqueada"],
  ["completed", "Completada"],
  ["cancelled", "Cancelada"],
] as const;
const priorityOptions = [["critical", "Crítica"], ["high", "Alta"], ["medium", "Media"], ["low", "Baja"]] as const;

function utc(value: string | null) {
  return value ? new Date(value).toLocaleString("es-CO", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short", timeZoneName: "short" }) : "Sin vencimiento";
}

function hiddenOrganization(organizationId: string) {
  return <input type="hidden" name="organizationId" value={organizationId} />;
}

export default async function PlanningPage({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ q?: string; status?: string; taskStatus?: string; view?: string }>;
}) {
  const { organizationId } = await params;
  const tenant = await requireTenant(organizationId);
  const queryParameters = await searchParams;
  const { q = "", status: operationStatus, taskStatus, view = "board" } = queryParameters;
  const taskStatuses = taskStatusOptions.map(([value]) => value);
  const selectedTaskStatus = taskStatus ?? (operationStatus && taskStatuses.includes(operationStatus as (typeof taskStatuses)[number]) ? operationStatus : "all");
  const bannerStatus = operationStatus && !taskStatuses.includes(operationStatus as (typeof taskStatuses)[number]) ? operationStatus : undefined;
  const [read, manage, approve, updateOwn, supabase] = await Promise.all([
    can(organizationId, "planning.read"),
    can(organizationId, "planning.manage"),
    can(organizationId, "tasks.approve"),
    can(organizationId, "tasks.update_status"),
    createClient(),
  ]);
  if (!read) return <EmptyState title="No puedes consultar la planificación" description="Solicita acceso al responsable de tu organización." />;

  let tasksQuery = supabase.from("tasks").select("id,title,description,status,priority,due_at,assigned_to,annual_plan_id,plan_activity_id,improvement_action_id,recurrence_rule_id").eq("organization_id", organizationId).order("due_at", { ascending: true, nullsFirst: false });
  if (q) tasksQuery = tasksQuery.ilike("title", `%${q.replace(/[%_]/g, "")}%`);
  if (selectedTaskStatus !== "all") tasksQuery = tasksQuery.eq("status", selectedTaskStatus);
  const [plansResult, activitiesResult, tasksResult, membersResult, versionsResult, dependenciesResult, commentsResult, improvementResult] = await Promise.all([
    supabase.from("annual_plans").select("id,name,year,status,budget").eq("organization_id", organizationId).order("year", { ascending: false }),
    supabase.from("plan_activities").select("id,annual_plan_id,title").eq("organization_id", organizationId),
    tasksQuery,
    supabase.from("organization_members").select("user_id").eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("document_versions").select("id,original_name").eq("organization_id", organizationId).limit(60),
    supabase.from("task_dependencies").select("task_id,depends_on_task_id").eq("organization_id", organizationId),
    supabase.from("task_comments").select("task_id,body,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    supabase.from("improvement_actions").select("id,title").eq("organization_id", organizationId).neq("status", "cancelled"),
  ]);
  const memberIds = (membersResult.data ?? []).map((member) => member.user_id);
  const { data: profiles } = memberIds.length ? await supabase.from("profiles").select("id,first_name,last_name").in("id", memberIds) : { data: [] };
  const people = memberIds.map((id) => {
    const profile = profiles?.find((item) => item.id === id);
    return { id, name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Persona sin nombre" };
  });
  const personName = (id: string | null) => people.find((person) => person.id === id)?.name ?? "Sin asignar";
  const plans = plansResult.data ?? [];
  const activities = activitiesResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const versions = versionsResult.data ?? [];
  const dependencies = dependenciesResult.data ?? [];
  const comments = commentsResult.data ?? [];
  const improvementActions = improvementResult.data ?? [];

  const planForm = <form action={createPlan} className="grid gap-4">{hiddenOrganization(organizationId)}<label className="grid gap-1.5 text-sm font-medium">Año<Input name="year" type="number" defaultValue={new Date().getUTCFullYear()} /></label><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="name" placeholder="Plan anual SG-SST" required /></label><label className="grid gap-1.5 text-sm font-medium">Presupuesto opcional<Input name="budget" type="number" min="0" step="0.01" /></label><Button>Crear plan</Button></form>;
  const activityForm = <form action={createActivity} className="grid gap-4">{hiddenOrganization(organizationId)}<label className="grid gap-1.5 text-sm font-medium">Plan<Select name="plan_id" required>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.year} · {plan.name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Actividad<Input name="title" required /></label><label className="grid gap-1.5 text-sm font-medium">Descripción<Textarea name="description" /></label><label className="grid gap-1.5 text-sm font-medium">Prioridad<Select name="priority" defaultValue="medium">{priorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Responsable<Select name="responsible_user_id" defaultValue=""><option value="">Sin asignar</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Presupuesto opcional<Input name="budget" type="number" min="0" step="0.01" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Inicio UTC<Input name="starts_at" type="datetime-local" /></label><label className="grid gap-1.5 text-sm font-medium">Fin UTC<Input name="ends_at" type="datetime-local" /></label></div><Button disabled={!plans.length}>Crear actividad</Button></form>;
  const taskForm = <form action={createTask} className="grid gap-4">{hiddenOrganization(organizationId)}<label className="grid gap-1.5 text-sm font-medium">Tarea<Input name="title" required /></label><label className="grid gap-1.5 text-sm font-medium">Descripción<Textarea name="description" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Prioridad<Select name="priority" defaultValue="medium">{priorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Responsable<Select name="assigned_to" defaultValue=""><option value="">Sin asignar</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</Select></label></div><label className="grid gap-1.5 text-sm font-medium">Plan asociado<Select name="annual_plan_id" defaultValue=""><option value="">Sin plan</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Actividad asociada<Select name="plan_activity_id" defaultValue=""><option value="">Sin actividad</option>{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.title}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Acción de mejora de origen<Select name="improvement_action_id" defaultValue=""><option value="">Sin acción de mejora</option>{improvementActions.map((action) => <option key={action.id} value={action.id}>{action.title}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Vencimiento UTC<Input name="due_at" type="datetime-local" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Recurrencia<Select name="recurrence_frequency" defaultValue="none"><option value="none">Sin recurrencia</option><option value="daily">Diaria</option><option value="weekly">Semanal</option><option value="monthly">Mensual</option><option value="yearly">Anual</option></Select></label><label className="grid gap-1.5 text-sm font-medium">Cada<Input name="recurrence_interval" defaultValue="1" type="number" min="1" /></label></div><label className="grid gap-1.5 text-sm font-medium">Final de recurrencia<Input name="recurrence_ends_at" type="datetime-local" /></label><Button>Crear tarea</Button></form>;

  function taskCard(task: (typeof tasks)[number]) {
    const mayChangeStatus = manage || (updateOwn && task.assigned_to === tenant.userId);
    const dependencyCount = dependencies.filter((dependency) => dependency.task_id === task.id).length;
    const commentCount = comments.filter((comment) => comment.task_id === task.id).length;
    const management = <div className="grid gap-6">{mayChangeStatus ? <section className="grid gap-3"><h3 className="font-semibold">Estado</h3><form action={setTaskStatus} className="flex gap-2">{hiddenOrganization(organizationId)}<input type="hidden" name="task_id" value={task.id} /><Select name="status" defaultValue={task.status} aria-label={`Estado de ${task.title}`}>{taskStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Button>Guardar</Button></form></section> : null}{manage ? <><section className="grid gap-3"><h3 className="font-semibold">Dependencia</h3><form action={addTaskDependency} className="flex gap-2">{hiddenOrganization(organizationId)}<input type="hidden" name="task_id" value={task.id} /><Select name="depends_on_task_id" defaultValue="" aria-label={`Dependencia de ${task.title}`}><option value="">Selecciona una tarea</option>{tasks.filter((option) => option.id !== task.id).map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}</Select><Button variant="secondary">Vincular</Button></form></section><section className="grid gap-3"><h3 className="font-semibold">Comentario</h3><form action={addTaskComment} className="grid gap-2">{hiddenOrganization(organizationId)}<input type="hidden" name="task_id" value={task.id} /><Textarea name="body" aria-label={`Comentario de ${task.title}`} placeholder="Registra un avance o bloqueo" /><Button variant="secondary">Agregar comentario</Button></form></section><section className="grid gap-3"><h3 className="font-semibold">Evidencia</h3><form action={attachTaskEvidence} className="grid gap-2">{hiddenOrganization(organizationId)}<input type="hidden" name="task_id" value={task.id} /><Select name="document_version_id" defaultValue="" aria-label={`Evidencia de ${task.title}`}><option value="">Selecciona una versión</option>{versions.map((version) => <option key={version.id} value={version.id}>{version.original_name}</option>)}</Select><Button variant="secondary">Adjuntar evidencia</Button></form></section></> : null}</div>;
    return <Card key={task.id} className="min-w-0"><CardHeader><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate">{task.title}</CardTitle><p className="mt-1 text-xs text-[var(--muted)]">{personName(task.assigned_to)}</p></div><StatusBadge>{task.status}</StatusBadge></div></CardHeader><CardContent className="grid gap-4"><p className="line-clamp-3 text-sm leading-6 text-[var(--muted-strong)]">{task.description || "Sin descripción."}</p><div className="grid gap-1 text-xs text-[var(--muted)]"><span><Clock size={14} className="mr-1 inline" />{utc(task.due_at)}</span><span>{task.recurrence_rule_id ? "Tarea recurrente" : "Tarea única"} · {dependencyCount} dependencias · {commentCount} comentarios</span></div>{mayChangeStatus || manage ? <FormDrawer triggerLabel="Gestionar" title={task.title} description="Actualiza el estado, registra avances y conserva la evidencia en un solo lugar." variant="secondary">{management}</FormDrawer> : null}</CardContent></Card>;
  }

  const boardColumns = [
    { title: "Por hacer", icon: ListChecks, statuses: ["todo"] },
    { title: "En curso", icon: Clock, statuses: ["in_progress", "blocked"] },
    { title: "Cerradas", icon: CheckCircle, statuses: ["completed", "cancelled"] },
  ];

  return <div className="grid gap-7">
    <PageHeader eyebrow="Trabajo" title="Plan anual y tareas" description="Prioriza actividades, asigna responsables y conserva avances, dependencias y evidencias." action={manage ? <div className="flex flex-wrap gap-2"><FormDrawer triggerLabel="Nuevo plan" title="Nuevo plan anual" description="Define el período y presupuesto general." variant="secondary">{planForm}</FormDrawer><FormDrawer triggerLabel="Nueva actividad" title="Nueva actividad" description="Organiza el trabajo dentro de un plan anual." variant="secondary">{activityForm}</FormDrawer><FormDrawer triggerLabel="Nueva tarea" title="Nueva tarea" description="Crea una tarea única o recurrente y vincúlala a su origen.">{taskForm}</FormDrawer></div> : undefined} />
    <StatusBanner status={bannerStatus} />
    {plans.length ? <section aria-labelledby="plans-title" className="grid gap-3"><div className="flex items-center justify-between"><h2 id="plans-title" className="text-lg font-semibold tracking-[-0.025em]">Planes anuales</h2><span className="text-xs text-[var(--muted)]">{plans.length} registrados</span></div><div className="grid gap-3 lg:grid-cols-2">{plans.map((plan) => <Card key={plan.id}><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><strong>{plan.year} · {plan.name}</strong><StatusBadge>{plan.status}</StatusBadge></div><p className="mt-1 text-xs text-[var(--muted)]">{activities.filter((activity) => activity.annual_plan_id === plan.id).length} actividades · Presupuesto {plan.budget == null ? "no definido" : new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(plan.budget))}</p></div>{approve && plan.status !== "approved" ? <form action={approvePlan}>{hiddenOrganization(organizationId)}<input type="hidden" name="plan_id" value={plan.id} /><Button size="sm">Aprobar plan</Button></form> : null}</CardContent></Card>)}</div></section> : null}
    <Card><CardContent className="pt-5"><form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_10rem_auto]"><Input name="q" defaultValue={q} placeholder="Buscar tareas" aria-label="Buscar tareas" /><Select name="taskStatus" defaultValue={selectedTaskStatus} aria-label="Estado"><option value="all">Todos los estados</option>{taskStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select name="view" defaultValue={view} aria-label="Vista"><option value="board">Tablero</option><option value="calendar">Agenda</option></Select><Button variant="secondary">Aplicar filtros</Button></form></CardContent></Card>
    {tasks.length ? view === "calendar" ? <section className="grid gap-3">{tasks.map((task) => <div key={task.id} className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]"><div className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-strong)]"><CalendarBlank size={18} className="text-[var(--brand)]" />{task.due_at ? new Date(task.due_at).toLocaleDateString("es-CO", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }) : "Sin fecha"}</div>{taskCard(task)}</div>)}</section> : <section className="grid gap-4 xl:grid-cols-3">{boardColumns.map((column) => { const Icon = column.icon; const columnTasks = tasks.filter((task) => column.statuses.includes(task.status)); return <div key={column.title} className="grid content-start gap-3 rounded-[14px] bg-[var(--muted-surface)] p-3"><div className="flex items-center justify-between px-1 py-1"><h2 className="flex items-center gap-2 text-sm font-semibold"><Icon size={17} className="text-[var(--brand)]" />{column.title}</h2><span className="text-xs text-[var(--muted)]">{columnTasks.length}</span></div>{columnTasks.length ? columnTasks.map(taskCard) : <p className="rounded-[10px] border border-dashed border-[var(--border)] px-3 py-6 text-center text-xs text-[var(--muted)]">No hay tareas en este estado.</p>}</div>; })}</section> : <EmptyState title="No hay tareas para estos filtros" description={q || selectedTaskStatus !== "all" ? "Cambia la búsqueda o el estado para ampliar los resultados." : "Crea una tarea desde el plan, una actividad o una acción de mejora."} />}
  </div>;
}
