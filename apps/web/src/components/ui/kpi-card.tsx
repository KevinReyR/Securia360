import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

type KpiCardProps = { label: string; value: ReactNode; description?: string; icon?: ReactNode; trend?: ReactNode; className?: string; href?: string; actionLabel?: string };

export function KpiCard({ label, value, description, icon, trend, className, href, actionLabel = "Abrir detalle" }: KpiCardProps) {
  const content = <Card className={cn("h-full overflow-hidden", href && "transition-[border-color,transform] group-hover:border-[var(--border-strong)] group-active:translate-y-px", className)}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><p className="text-sm font-medium text-[var(--muted)]">{label}</p>{icon ? <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">{icon}</span> : null}</div><div className="mt-3 flex items-end justify-between gap-3"><p className="text-2xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">{value}</p>{trend}</div>{description ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description}</p> : null}{href ? <span className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)]">{actionLabel}<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span> : null}</CardContent></Card>;
  return href ? <Link href={href} aria-label={`${label}: ${actionLabel}`} className="group block h-full rounded-[14px] outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]">{content}</Link> : content;
}
