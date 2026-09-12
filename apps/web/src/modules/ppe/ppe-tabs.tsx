import { ClipboardText, ClockCounterClockwise, Gauge, HardHat, Package } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ppeHref, type PpeSiteScope, type PpeView } from "./ppe-navigation";

const items = [
  { value: "summary", label: "Resumen", icon: Gauge },
  { value: "catalog", label: "Catálogo", icon: HardHat },
  { value: "inventory", label: "Inventario", icon: Package },
  { value: "assignments", label: "Asignaciones", icon: ClipboardText },
  { value: "history", label: "Historial", icon: ClockCounterClockwise },
] as const;

export function PpeTabs({ organizationId, site, current }: { organizationId: string; site: PpeSiteScope; current: PpeView }) {
  return <nav aria-label="Áreas de elementos de protección personal" className="overflow-x-auto border-b border-[var(--border)]">
    <div className="flex min-w-max gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = current === item.value;
        return <Link key={item.value} href={ppeHref(organizationId, site, item.value)} aria-current={active ? "page" : undefined} className={cn("relative inline-flex min-h-11 items-center gap-2 rounded-t-[10px] px-3.5 text-sm font-semibold outline-none transition-[background-color,color] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]", active ? "bg-[var(--surface)] text-[var(--foreground)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--brand)]" : "text-[var(--muted)] hover:bg-[var(--muted-surface)] hover:text-[var(--foreground)]")}><Icon size={17} weight={active ? "fill" : "regular"} aria-hidden />{item.label}</Link>;
      })}
    </div>
  </nav>;
}
