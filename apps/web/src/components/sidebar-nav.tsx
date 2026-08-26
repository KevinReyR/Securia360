"use client";

import { Buildings, ChartBar, ClipboardText, Gear, House, ShieldCheck, Users } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { suffix: "dashboard", label: "Inicio", icon: House },
  { suffix: "onboarding", label: "Mi SG-SST", icon: ShieldCheck },
  { suffix: "settings/structure", label: "Estructura", icon: Buildings },
  { suffix: "settings/members", label: "Personas", icon: Users },
  { suffix: "settings/organization", label: "Configuración", icon: Gear },
] as const;

const futureItems = [
  { label: "Planificación", icon: ClipboardText },
  { label: "Analítica", icon: ChartBar },
] as const;

export function SidebarNav({ organizationId }: { organizationId: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación principal" className="grid gap-1">
      {items.map(({ suffix, label, icon: Icon }) => {
        const href = `/org/${organizationId}/${suffix}`;
        const active = pathname === href || (suffix.startsWith("settings") && pathname.startsWith(href));
        return (
          <Link key={suffix} href={href} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-emerald-50/75 transition hover:bg-white/8 hover:text-white", active && "bg-white/10 text-white")}>
            <Icon size={18} weight={active ? "fill" : "regular"} aria-hidden />
            {label}
          </Link>
        );
      })}
      <div className="my-3 border-t border-[var(--sidebar-border)]" />
      {futureItems.map(({ label, icon: Icon }) => (
        <div key={label} className="flex h-10 items-center gap-3 px-3 text-sm text-emerald-50/45">
          <Icon size={18} aria-hidden />
          <span className="flex-1">{label}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide">Próximamente</span>
        </div>
      ))}
    </nav>
  );
}
