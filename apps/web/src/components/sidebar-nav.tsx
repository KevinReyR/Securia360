"use client";

import { CaretDown } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavigationItemAllowed, navigationHome, navigationHref, navigationSections, navigationUtilities, type NavigationItem } from "@/components/navigation-config";
import { cn } from "@/lib/utils";
import type { PermissionCode } from "@/modules/auth/permissions";

function NavLink({ item, organizationId, pathname, onNavigate }: { item: NavigationItem; organizationId: string; pathname: string; onNavigate?: () => void }) {
  const href = navigationHref(organizationId, item.suffix);
  const active = pathname === href || (item.suffix.startsWith("settings") && pathname.startsWith(href));
  const Icon = item.icon;
  return (
    <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={cn("group flex min-h-9 items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px] font-medium text-[var(--sidebar-muted)] outline-none transition-[background-color,color] hover:bg-white/[.07] hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300", active && "bg-white/[.1] text-white")}>
      <Icon size={17} weight={active ? "fill" : "regular"} className={cn("shrink-0", active && "text-emerald-300")} aria-hidden />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function SidebarNav({ organizationId, onNavigate, allowedPermissions }: { organizationId: string; onNavigate?: () => void; allowedPermissions?: readonly PermissionCode[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación principal" className="grid gap-1">
      {isNavigationItemAllowed(navigationHome, allowedPermissions) ? <NavLink item={navigationHome} organizationId={organizationId} pathname={pathname} onNavigate={onNavigate} /> : null}
      <div className="my-2 h-px bg-white/[.08]" />
      {navigationSections.map((section) => {
        const items = section.items.filter((item) => isNavigationItemAllowed(item, allowedPermissions));
        if (!items.length) return null;
        const isActive = items.some((item) => pathname.startsWith(navigationHref(organizationId, item.suffix)));
        const SectionIcon = section.icon;
        return (
          <details key={section.label} open={isActive || undefined} className="group/navigation">
            <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--sidebar-muted)] outline-none transition-colors hover:bg-white/[.05] hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300 [&::-webkit-details-marker]:hidden">
              <SectionIcon size={16} aria-hidden />
              <span className="flex-1">{section.label}</span>
              <CaretDown size={13} className="transition-transform group-open/navigation:rotate-180" aria-hidden />
            </summary>
            <div className="ml-3 grid gap-0.5 border-l border-white/[.09] py-1 pl-3">
              {items.map((item) => <NavLink key={item.label} item={item} organizationId={organizationId} pathname={pathname} onNavigate={onNavigate} />)}
            </div>
          </details>
        );
      })}
      <div className="my-2 h-px bg-white/[.08]" />
      {navigationUtilities.filter((item) => isNavigationItemAllowed(item, allowedPermissions)).map((item) => <NavLink key={item.label} item={item} organizationId={organizationId} pathname={pathname} onNavigate={onNavigate} />)}
    </nav>
  );
}
