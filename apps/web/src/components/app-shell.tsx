"use client";

import { Buildings, List, MagnifyingGlass, SignOut, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { logout } from "@/app/auth/login/actions";
import { AppBreadcrumbs } from "./app-breadcrumbs";
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

type AppShellProps = {
  children: React.ReactNode;
  organizationId: string;
  organizations: OrganizationSummary[];
  user: { id: string; displayName: string; email: string; initials: string };
};

function Brand() {
  return <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-emerald-300 font-black text-emerald-950 shadow-sm">S</div><div><p className="font-bold tracking-[-0.01em] text-white">Securia360</p><p className="text-xs text-[var(--sidebar-muted)]">Reinova Labs</p></div></div>;
}

function SidebarContent({ organizationId, onNavigate }: { organizationId: string; onNavigate?: () => void }) {
  return <div className="flex h-full flex-col bg-[var(--sidebar)] px-4 py-5 text-white"><div className="mb-6 px-2"><Brand /></div><div className="min-h-0 flex-1 overflow-y-auto"><SidebarNav organizationId={organizationId} onNavigate={onNavigate} /></div><div className="mt-5 rounded-xl border border-white/8 bg-white/5 p-3"><div className="flex items-center gap-2 text-xs font-semibold text-emerald-100"><span className="size-2 rounded-full bg-emerald-300" />Tenant protegido</div><p className="mt-1.5 text-[11px] leading-5 text-[var(--sidebar-muted)]">El acceso se valida por organización y RLS.</p></div></div>;
}

export function AppShell({ children, organizationId, organizations, user }: AppShellProps) {
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
      <div className="min-h-[100dvh] bg-[var(--background)] lg:grid lg:grid-cols-[264px_1fr]">
        <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white outline-none transition-transform focus:translate-y-0">Saltar al contenido</a>
        <aside className="hidden bg-[var(--sidebar)] lg:fixed lg:inset-y-0 lg:block lg:w-[264px]"><SidebarContent organizationId={organizationId} /></aside>
        <div className="min-w-0 lg:col-start-2">
          <header className="app-header sticky top-0 z-30 flex min-h-16 items-center gap-2 border-b border-[var(--border)] bg-white/92 px-4 backdrop-blur-xl sm:px-5 lg:px-8">
            <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
              <DrawerTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir navegación"><List size={21} /></Button></DrawerTrigger>
              <DrawerContent className="border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] p-0 [&>button]:text-white">
                <DrawerTitle className="sr-only">Navegación principal</DrawerTitle>
                <DrawerDescription className="sr-only">Accesos a las áreas de Securia360</DrawerDescription>
                <SidebarContent organizationId={organizationId} onNavigate={() => setMobileOpen(false)} />
              </DrawerContent>
            </Drawer>
            <div className="min-w-0 flex-1"><AppBreadcrumbs organizationId={organizationId} /></div>
            <div className="hidden min-w-0 sm:block"><TenantSwitcher organizations={organizations} activeId={organizationId} /></div>
            <div className="flex items-center gap-1">
              <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} aria-label="Buscar en Securia360"><MagnifyingGlass size={19} /></Button></TooltipTrigger><TooltipContent>Buscar <span className="ml-1 opacity-70">Ctrl K</span></TooltipContent></Tooltip>
              <NotificationInbox organizationId={organizationId} userId={user.id} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild><button className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]" aria-label="Abrir menú de perfil"><Avatar><AvatarFallback>{user.initials}</AvatarFallback></Avatar></button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64"><DropdownMenuLabel><span className="block truncate text-sm text-[var(--foreground)]">{user.displayName}</span><span className="mt-0.5 block truncate font-normal text-[var(--muted)]">{user.email}</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link href={`/org/${organizationId}/settings/profile`}><UserCircle size={17} />Mi perfil</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href={`/org/${organizationId}/settings/organization`}><Buildings size={17} />Organización</Link></DropdownMenuItem><DropdownMenuSeparator /><form action={logout}><DropdownMenuItem asChild><button type="submit" className="w-full text-[var(--danger)]"><SignOut size={17} />Cerrar sesión</button></DropdownMenuItem></form></DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2 sm:hidden"><TenantSwitcher organizations={organizations} activeId={organizationId} /></div>
          <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8">{children}</main>
        </div>
        <NavigationCommand organizationId={organizationId} open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </TooltipProvider>
  );
}
