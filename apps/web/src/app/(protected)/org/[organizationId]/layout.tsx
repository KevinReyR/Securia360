import { Bell, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/login/actions";
import { SidebarNav } from "@/components/sidebar-nav";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { listOrganizations, requireTenant } from "@/modules/organizations/tenant";

export const dynamic = "force-dynamic";

export default async function OrganizationLayout({ children, params }: { children: React.ReactNode; params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  let tenant;
  try { tenant = await requireTenant(organizationId); } catch { redirect("/organizations?error=access"); }
  const organizations = await listOrganizations();
  const initials = tenant.email.slice(0, 2).toUpperCase() || "US";
  return (
    <div className="min-h-[100dvh] bg-[var(--background)] lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="bg-[var(--sidebar)] px-4 py-5 text-white lg:fixed lg:inset-y-0 lg:w-[248px]">
        <div className="mb-6 flex items-center gap-3 px-2"><div className="grid size-9 place-items-center rounded-lg bg-emerald-300 font-black text-emerald-950">S</div><div><p className="font-bold">Securia360</p><p className="text-xs text-emerald-100/55">Reinova Labs</p></div></div>
        <SidebarNav organizationId={organizationId} />
      </aside>
      <div className="lg:col-start-2">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[var(--border)] bg-white/95 px-5 backdrop-blur lg:px-8">
          <TenantSwitcher organizations={organizations} activeId={organizationId} />
          <div className="flex items-center gap-2">
            <button className="hidden size-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--muted-surface)] sm:grid" aria-label="Buscar"><MagnifyingGlass size={19} /></button>
            <button className="grid size-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--muted-surface)]" aria-label="Notificaciones"><Bell size={19} /></button>
            <form action={logout}><button className="grid size-9 place-items-center rounded-full bg-[var(--brand)] text-xs font-bold text-white" title="Cerrar sesión">{initials}</button></form>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-5 py-7 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
