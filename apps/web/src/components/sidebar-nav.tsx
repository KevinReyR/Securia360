"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationHref, navigationItems } from "@/components/navigation-config";
import { cn } from "@/lib/utils";

export function SidebarNav({ organizationId, onNavigate }: { organizationId: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación principal" className="grid gap-1">
      {navigationItems.map(({ label, icon: Icon, available, ...item }) => {
        const suffix = "suffix" in item ? item.suffix : undefined;
        const href = suffix ? navigationHref(organizationId, suffix) : undefined;
        const active = Boolean(href && (pathname === href || (suffix?.startsWith("settings") && pathname.startsWith(href))));
        if (!available || !href) return <div key={label} aria-disabled="true" className="flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--sidebar-muted)]/65"><Icon size={18} aria-hidden /><span className="flex-1">{label}</span><span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em]">Próximamente</span></div>;
        return (
          <Link key={label} href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--sidebar-muted)] outline-none transition-[background-color,color,transform] hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300 active:scale-[.99]", active && "bg-white/10 text-white shadow-[inset_3px_0_0_#6ee7a0]")}>
            <Icon size={18} weight={active ? "fill" : "regular"} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
