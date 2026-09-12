import { AddressBook, ClipboardText, Gauge, Siren, UsersThree } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { emergencyHref, type EmergencyView } from "./emergency-navigation";

const items = [
  { value: "summary", label: "Resumen", icon: Gauge },
  { value: "preparedness", label: "Preparación", icon: UsersThree },
  { value: "plans", label: "Planes", icon: ClipboardText },
  { value: "drills", label: "Simulacros", icon: Siren },
  { value: "directory", label: "Directorio", icon: AddressBook },
] as const;

export function EmergencyTabs({ organizationId, siteId, current, showDirectory }: { organizationId: string; siteId?: string; current: EmergencyView; showDirectory: boolean }) {
  return <nav aria-label="Áreas de emergencias" className="overflow-x-auto border-b border-[var(--border)]">
    <div className="flex min-w-max gap-1">
      {items.filter((item) => item.value !== "directory" || showDirectory).map((item) => {
        const Icon = item.icon;
        const active = current === item.value;
        return <Link key={item.value} href={emergencyHref(organizationId, siteId, item.value)} aria-current={active ? "page" : undefined} className={cn("relative inline-flex min-h-11 items-center gap-2 rounded-t-[10px] px-3.5 text-sm font-semibold outline-none transition-[background-color,color] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]", active ? "bg-[var(--surface)] text-[var(--foreground)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--brand)]" : "text-[var(--muted)] hover:bg-[var(--muted-surface)] hover:text-[var(--foreground)]")}><Icon size={17} weight={active ? "fill" : "regular"} aria-hidden />{item.label}</Link>;
      })}
    </div>
  </nav>;
}
