import type { ReactNode } from "react";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

export function KpiCard({ label, value, description, icon, trend, className }: { label: string; value: ReactNode; description?: string; icon?: ReactNode; trend?: ReactNode; className?: string }) {
  return <Card className={cn("overflow-hidden", className)}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><p className="text-sm font-medium text-[var(--muted)]">{label}</p>{icon ? <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">{icon}</span> : null}</div><div className="mt-3 flex items-end justify-between gap-3"><p className="text-2xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">{value}</p>{trend}</div>{description ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description}</p> : null}</CardContent></Card>;
}
