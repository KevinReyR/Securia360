import { Bell, CheckCircle, Gear, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireAuthenticatedUser, requireTenant } from "@/modules/organizations/tenant";
import { markAllNotificationsRead, markNotificationRead } from "@/modules/notifications/actions";
import { isSafeNotificationLink } from "@/modules/notifications/schemas";

const PAGE_SIZE = 25;
const dateTime = (value: string) => new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default async function NotificationsPage({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ page?: string; view?: string; priority?: string }>;
}) {
  const { organizationId } = await params;
  const filters = await searchParams;
  const { userId, supabase } = await requireAuthenticatedUser();
  await requireTenant(organizationId);
  const page = Math.max(1, Number(filters.page ?? "1") || 1);
  const view = filters.view ?? "all";
  const priority = filters.priority ?? "all";
  const from = (page - 1) * PAGE_SIZE;
  let query = supabase.from("notifications").select("id,title,body,priority,safe_link,read_at,created_at", { count: "exact" }).eq("organization_id", organizationId).eq("recipient_user_id", userId).eq("channel", "in_app").order("created_at", { ascending: false });
  if (view === "unread") query = query.is("read_at", null);
  if (priority !== "all") query = query.eq("priority", priority as "low" | "normal" | "high" | "critical");
  const [noticesR, unreadR, urgentR] = await Promise.all([
    query.range(from, from + PAGE_SIZE - 1),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("recipient_user_id", userId).eq("channel", "in_app").is("read_at", null),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("recipient_user_id", userId).eq("channel", "in_app").in("priority", ["high", "critical"]).is("read_at", null),
  ]);
  const notices = noticesR.data ?? [];
  const totalPages = Math.max(1, Math.ceil((noticesR.count ?? 0) / PAGE_SIZE));

  return <main className="grid gap-7">
    <PageHeader eyebrow="Bandeja personal" title="Notificaciones" description="Revisa actividad operativa de esta organización. Los mensajes nunca incluyen información sensible completa." action={<div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><Link href={`/org/${organizationId}/settings/notifications`}><Gear size={17} />Preferencias</Link></Button><form action={markAllNotificationsRead}><input type="hidden" name="organizationId" value={organizationId} /><Button><CheckCircle size={18} />Marcar todas como leídas</Button></form></div>} />
    <section className="grid gap-3 sm:grid-cols-3"><KpiCard label="Sin leer" value={unreadR.count ?? 0} icon={<Bell size={18} />} /><KpiCard label="Prioridad alta" value={urgentR.count ?? 0} icon={<WarningCircle size={18} />} /><KpiCard label="En esta vista" value={noticesR.count ?? 0} icon={<CheckCircle size={18} />} /></section>
    <Card><CardContent className="pt-5"><form className="grid gap-3 sm:grid-cols-[12rem_12rem_auto]"><Select name="view" defaultValue={view} aria-label="Lectura"><option value="all">Todas</option><option value="unread">Solo sin leer</option></Select><Select name="priority" defaultValue={priority} aria-label="Prioridad"><option value="all">Todas las prioridades</option><option value="critical">Crítica</option><option value="high">Alta</option><option value="normal">Normal</option><option value="low">Baja</option></Select><Button variant="secondary">Aplicar filtros</Button></form></CardContent></Card>
    <section aria-label="Actividad reciente">{notices.length ? <Card><CardContent className="divide-y divide-[var(--border)]">{notices.map((notice) => <article key={notice.id} className={`flex gap-3 py-4 ${notice.read_at ? "opacity-70" : ""}`}><span className={`mt-2 size-2 shrink-0 rounded-full ${notice.read_at ? "bg-[var(--border-strong)]" : "bg-[var(--brand)]"}`} aria-hidden /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{notice.title}</h2><StatusBadge>{notice.priority}</StatusBadge></div><time className="text-xs text-[var(--muted)]">{dateTime(notice.created_at)}</time></div><p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">{notice.body}</p><div className="mt-3 flex flex-wrap items-center gap-3">{isSafeNotificationLink(notice.safe_link, organizationId) ? <Link href={notice.safe_link!} className="text-sm font-semibold text-[var(--brand)] hover:underline">Abrir detalle</Link> : null}{!notice.read_at ? <form action={markNotificationRead}><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="notificationId" value={notice.id} /><Button variant="ghost" size="sm">Marcar como leída</Button></form> : <span className="text-xs text-[var(--muted)]">Leída</span>}</div></div></article>)}</CardContent></Card> : <EmptyState icon={<Bell size={20} aria-hidden />} title="No hay notificaciones en esta vista" description={view === "unread" || priority !== "all" ? "Cambia los filtros para revisar otra actividad." : "Cuando haya actividad operativa relevante, aparecerá aquí."} />}</section>
    {totalPages > 1 ? <nav aria-label="Paginación de notificaciones" className="flex items-center justify-between"><Button asChild variant="ghost" size="sm" disabled={page <= 1}><Link href={`?view=${view}&priority=${priority}&page=${page - 1}`}>Anterior</Link></Button><span className="text-sm text-[var(--muted)]">Página {page} de {totalPages}</span><Button asChild variant="ghost" size="sm" disabled={page >= totalPages}><Link href={`?view=${view}&priority=${priority}&page=${page + 1}`}>Siguiente</Link></Button></nav> : null}
  </main>;
}
