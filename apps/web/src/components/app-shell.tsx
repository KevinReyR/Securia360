"use client";

import { Buildings, GearSix, List, MagnifyingGlass, Question, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppBreadcrumbs } from "./app-breadcrumbs";
import { BrandMark } from "./brand-mark";
import { NavigationCommand } from "./navigation-command";
import { SidebarNav } from "./sidebar-nav";
import { TenantSwitcher } from "./tenant-switcher";
import { NotificationInbox } from "@/modules/notifications/inbox";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import type { OrganizationSummary } from "@/modules/organizations/tenant";
import type { PermissionCode } from "@/modules/auth/permissions";
import { experienceProfileLabels, type ExperienceProfile } from "@/modules/workspace/types";
import { LogoutMenuItem } from "./logout-controls";
import type { SaasInternalRole } from "@/modules/saas/access";

type AppShellProps = {
  children: React.ReactNode;
  organizationId: string;
  organizations: OrganizationSummary[];
  user: { id: string; displayName: string; email: string; initials: string };
  allowedPermissions: PermissionCode[];
  experienceProfile: ExperienceProfile;
  isDemo?: boolean;
  internalSaasRole?: SaasInternalRole | null;
};

function SidebarContent({ organizationId, onNavigate, allowedPermissions }: { organizationId: string; onNavigate?: () => void; allowedPermissions: PermissionCode[] }) {
  return <div className="flex h-full flex-col bg-[var(--sidebar)] px-3 py-5 text-white"><div className="mb-5 px-2"><BrandMark inverse href={`/org/${organizationId}/dashboard`} /></div><div className="min-h-0 flex-1 overflow-y-auto pr-1"><SidebarNav organizationId={organizationId} onNavigate={onNavigate} allowedPermissions={allowedPermissions} /></div><div className="mt-4 border-t border-white/[.08] pt-3"><Link href="mailto:reinovaco@gmail.com" className="flex min-h-9 items-center gap-2.5 rounded-[9px] px-2.5 text-[13px] font-medium text-[var(--sidebar-muted)] outline-none transition-colors hover:bg-white/[.07] hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300"><Question size={17} aria-hidden />Ayuda y soporte</Link></div></div>;
}

export function AppShell({ children, organizationId, organizations, user, allowedPermissions, experienceProfile, isDemo = false, internalSaasRole = null }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-[100dvh] bg-[var(--background)] lg:grid lg:grid-cols-[252px_1fr]">
        <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white outline-none transition-transform focus:translate-y-0">Saltar al contenido</a>
        <aside className="hidden bg-[var(--sidebar)] lg:fixed lg:inset-y-0 lg:block lg:w-[252px]"><SidebarContent organizationId={organizationId} allowedPermissions={allowedPermissions} /></aside>
        <div className="min-w-0 lg:col-start-2">
          <header className="app-header sticky top-0 z-30 flex min-h-16 items-center gap-2 border-b border-[var(--border)] bg-[color:rgb(255_255_255/.94)] px-4 backdrop-blur-xl sm:px-5 lg:px-7">
            <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
              <DrawerTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir navegación"><List size={21} /></Button></DrawerTrigger>
              <DrawerContent className="border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] p-0 [&>button]:text-white">
                <DrawerTitle className="sr-only">Navegación principal</DrawerTitle>
                <DrawerDescription className="sr-only">Accesos a las áreas de Securia360</DrawerDescription>
                <SidebarContent organizationId={organizationId} allowedPermissions={allowedPermissions} onNavigate={() => setMobileOpen(false)} />
              </DrawerContent>
            </Drawer>
            <div className="min-w-0 flex-1"><AppBreadcrumbs organizationId={organizationId} /></div>
            {isDemo ? <span className="hidden rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--warning)] md:inline-flex">Datos de demostración</span> : null}
            <div className="hidden min-w-0 sm:block"><TenantSwitcher organizations={organizations} activeId={organizationId} /></div>
            <div className="flex items-center gap-1">
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Buscar en Securia360"><MagnifyingGlass size={19} /></Button></TooltipTrigger><TooltipContent>Buscar <span className="ml-1 opacity-70">Ctrl K</span></TooltipContent></Tooltip>
              <NotificationInbox organizationId={organizationId} userId={user.id} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild><button className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]" aria-label="Abrir menú de perfil"><Avatar><AvatarFallback>{user.initials}</AvatarFallback></Avatar></button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64"><DropdownMenuLabel><span className="block truncate text-sm text-[var(--foreground)]">{user.displayName}</span><span className="mt-0.5 block truncate font-normal text-[var(--muted)]">{user.email}</span><span className="mt-2 inline-flex rounded-full bg-[var(--brand-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[.06em] text-[var(--brand)]">{experienceProfileLabels[experienceProfile]}</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link href={`/org/${organizationId}/settings/profile`}><UserCircle size={17} />Mi perfil</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href={`/org/${organizationId}/settings/organization`}><Buildings size={17} />Organización</Link></DropdownMenuItem>{internalSaasRole ? <DropdownMenuItem asChild><Link href="/internal/saas-admin"><GearSix size={17} />Administración de plataforma</Link></DropdownMenuItem> : null}<DropdownMenuSeparator /><LogoutMenuItem /></DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 sm:hidden"><TenantSwitcher organizations={organizations} activeId={organizationId} /></div>
          <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8">{children}</main>
        </div>
        <NavigationCommand organizationId={organizationId} open={searchOpen} onOpenChange={setSearchOpen} allowedPermissions={allowedPermissions} />
      </div>
    </TooltipProvider>
  );
}
