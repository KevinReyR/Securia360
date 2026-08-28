"use client";

import { ArrowSquareOut, Bell, Gear, SpinnerGap } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { isSafeNotificationLink } from "./schemas";

type Notice = { id: string; organization_id: string; title: string; body: string; priority: "low" | "normal" | "high" | "critical"; safe_link: string | null; read_at: string | null; created_at: string };
const priority = { low: "Baja", normal: "Normal", high: "Alta", critical: "Crítica" };

export function NotificationInbox({ organizationId, userId }: { organizationId: string; userId: string }) {
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const unread = useMemo(() => items.filter((item) => !item.read_at).length, [items]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("notifications").select("id,organization_id,title,body,priority,safe_link,read_at,created_at").eq("organization_id", organizationId).eq("recipient_user_id", userId).eq("channel", "in_app").order("created_at", { ascending: false }).limit(20);
      if (active) { setItems((data ?? []) as Notice[]); setLoading(false); }
    };
    void load();
    const channel = supabase.channel(`notification-inbox:${organizationId}:${userId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_user_id=eq.${userId}` }, (payload) => {
      const notice = payload.new as Notice;
      if (notice.organization_id !== organizationId) return;
      setItems((current) => [notice, ...current.filter((item) => item.id !== notice.id)].slice(0, 20));
    }).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [organizationId, userId]);

  const markRead = async (notice: Notice) => {
    if (notice.read_at) return;
    const now = new Date().toISOString();
    await createClient().from("notifications").update({ status: "read", read_at: now }).eq("id", notice.id).eq("organization_id", organizationId).eq("recipient_user_id", userId);
    setItems((current) => current.map((item) => item.id === notice.id ? { ...item, read_at: now } : item));
  };
  const markAll = async () => {
    const unreadIds = items.filter((item) => !item.read_at).map((item) => item.id);
    if (!unreadIds.length) return;
    const now = new Date().toISOString();
    await createClient().from("notifications").update({ status: "read", read_at: now }).in("id", unreadIds).eq("organization_id", organizationId).eq("recipient_user_id", userId);
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? now })));
  };

  return <DropdownMenu>
    <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Notificaciones${unread ? `: ${unread} sin leer` : ""}`} className="relative"><Bell size={19} />{unread ? <span aria-hidden className="absolute right-1 top-1 min-w-4 rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold leading-4 text-white">{unread > 9 ? "9+" : unread}</span> : null}</Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent>Notificaciones</TooltipContent></Tooltip>
    <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))]">
      <div className="flex items-center justify-between px-2 py-1.5"><DropdownMenuLabel className="p-0">Notificaciones{unread ? ` (${unread})` : ""}</DropdownMenuLabel><Button type="button" variant="ghost" size="sm" disabled={!unread} onClick={() => void markAll()}>Marcar todas</Button></div>
      <DropdownMenuSeparator />
      {loading ? <div className="grid place-items-center px-3 py-8 text-[var(--muted)]"><SpinnerGap className="animate-spin" size={20} /></div> : items.length ? <div className="max-h-96 overflow-y-auto">{items.map((notice) => <DropdownMenuItem key={notice.id} className="items-start gap-2 p-3" onSelect={(event) => event.preventDefault()}><button type="button" className="min-w-0 flex-1 text-left" onClick={() => void markRead(notice)}><div className="flex items-center gap-2"><span className={`size-2 shrink-0 rounded-full ${notice.read_at ? "bg-[var(--border-strong)]" : "bg-[var(--brand)]"}`} /><span className="truncate text-sm font-semibold">{notice.title}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{notice.body}</p><span className="mt-1 block text-[11px] text-[var(--muted)]">Prioridad {priority[notice.priority]}</span></button>{isSafeNotificationLink(notice.safe_link, organizationId) ? <Link href={notice.safe_link!} onClick={() => void markRead(notice)} className="rounded-md p-1.5 text-[var(--brand)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]" aria-label={`Abrir ${notice.title}`}><ArrowSquareOut size={17} /></Link> : null}</DropdownMenuItem>)}</div> : <div className="px-3 py-8 text-center"><Bell className="mx-auto text-[var(--muted)]" size={22} /><p className="mt-2 text-sm font-semibold">Todo al día</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Las alertas operativas aparecerán aquí.</p></div>}
      <DropdownMenuSeparator /><DropdownMenuItem asChild><Link href={`/org/${organizationId}/notifications`}>Ver bandeja completa</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href={`/org/${organizationId}/settings/notifications`}><Gear size={16} />Preferencias</Link></DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
