import { Bell, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthenticatedUser, requireTenant } from "@/modules/organizations/tenant";
import { markAllNotificationsRead, markNotificationRead } from "@/modules/notifications/actions";
import { isSafeNotificationLink } from "@/modules/notifications/schemas";

export default async function NotificationsPage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ page?: string }> }) {
  const { organizationId } = await params;
  const { userId, supabase } = await requireAuthenticatedUser();
  await requireTenant(organizationId);
  const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);
  const size = 25;
  const from = (page - 1) * size;
  const { data, count } = await supabase.from("notifications").select("id,title,body,priority,safe_link,read_at,created_at", { count: "exact" }).eq("organization_id", organizationId).eq("recipient_user_id", userId).eq("channel", "in_app").order("created_at", { ascending: false }).range(from, from + size - 1);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / size));

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">Bandeja personal</p><h1 className="page-title">Notificaciones</h1><p className="page-description">Mensajes operativos de esta organización. No incluyen contenido sensible completo.</p></div>
      <form action={markAllNotificationsRead}><input type="hidden" name="organizationId" value={organizationId} /><Button type="submit" variant="secondary"><CheckCircle size={18} />Marcar todas como leídas</Button></form>
    </div>
    <Card><CardHeader><CardTitle>Actividad reciente</CardTitle></CardHeader><CardContent className="p-0">
      {data?.length ? <ul className="divide-y divide-[var(--border)]">{data.map((notice) => <li key={notice.id} className="flex gap-3 px-5 py-4"><span className={`mt-2 size-2 shrink-0 rounded-full ${notice.read_at ? "bg-[var(--border-strong)]" : "bg-[var(--brand)]"}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{notice.title}</h2><span className="text-xs text-[var(--muted)]">{new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notice.created_at))}</span></div><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{notice.body}</p><div className="mt-3 flex flex-wrap gap-2">{isSafeNotificationLink(notice.safe_link, organizationId) ? <Link href={notice.safe_link!} className="text-sm font-semibold text-[var(--brand)]">Abrir detalle</Link> : null}{!notice.read_at ? <form action={markNotificationRead}><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="notificationId" value={notice.id} /><Button type="submit" variant="ghost" size="sm">Marcar como leída</Button></form> : null}</div></div></li>)}</ul> : <EmptyState icon={<Bell size={20} aria-hidden />} title="No hay notificaciones" description="Cuando haya actividad operativa relevante, aparecerá en esta bandeja." />}
    </CardContent></Card>
    {totalPages > 1 ? <nav aria-label="Paginación de notificaciones" className="flex justify-end gap-2"><Button asChild variant="secondary" size="sm" disabled={page <= 1}><Link href={`/org/${organizationId}/notifications?page=${page - 1}`}>Anterior</Link></Button><span className="px-2 py-2 text-sm text-[var(--muted)]">Página {page} de {totalPages}</span><Button asChild variant="secondary" size="sm" disabled={page >= totalPages}><Link href={`/org/${organizationId}/notifications?page=${page + 1}`}>Siguiente</Link></Button></nav> : null}
  </div>;
}
