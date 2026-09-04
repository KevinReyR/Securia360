import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, IdentificationCard, UploadSimple, UserPlus, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/empty-state";
import { FormDrawer } from "@/components/form-drawer";
import { OrganizationSettingsNav } from "@/components/organization-settings-nav";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { can } from "@/modules/auth/permissions";
import { assignRole, inviteMember } from "@/modules/organizations/core-actions";
import { displayPersonName, matchesDirectorySearch, safePage } from "@/modules/organizations/directory";
import { requireTenant } from "@/modules/organizations/tenant";
import type { Database } from "@/types/database";

type Member = Database["public"]["Tables"]["organization_members"]["Row"];
type Worker = Database["public"]["Tables"]["workers"]["Row"];
type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "first_name" | "middle_name" | "last_name" | "second_last_name" | "phone">;
type Role = Pick<Database["public"]["Tables"]["roles"]["Row"], "id" | "code" | "name" | "organization_id">;
type Assignment = Pick<Database["public"]["Tables"]["member_roles"]["Row"], "id" | "organization_member_id" | "role_id" | "site_id">;
type Area = Pick<Database["public"]["Tables"]["areas"]["Row"], "id" | "name">;
type LegalEntity = Pick<Database["public"]["Tables"]["legal_entities"]["Row"], "id" | "legal_name">;

type MemberRow = Member & { name: string; profile?: Profile; roles: string[]; scopes: string[] };
type WorkerRow = Worker & { name: string; legalEntity: string; site: string; area: string };

const PAGE_SIZE = 10;

export default async function MembersSettings({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string; view?: string; q?: string; state?: string; site?: string; role?: string; page?: string }> }) {
  const { organizationId } = await params;
  await requireTenant(organizationId);
  const filters = await searchParams;
  const supabase = await createClient();
  const [canReadMembers, canReadWorkers, canManageImports, canInvite, canManageRoles] = await Promise.all([
    can(organizationId, "members.read"),
    can(organizationId, "imports.read"),
    can(organizationId, "imports.manage"),
    can(organizationId, "members.create"),
    can(organizationId, "members.roles_manage"),
  ]);

  const [membersResult, rolesResult, assignmentsResult, sitesResult, workersResult, areasResult, entitiesResult] = await Promise.all([
    canReadMembers ? supabase.from("organization_members").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as Member[] }),
    canReadMembers ? supabase.from("roles").select("id,code,name,organization_id").or(`organization_id.is.null,organization_id.eq.${organizationId}`).order("name") : Promise.resolve({ data: [] as Role[] }),
    canReadMembers ? supabase.from("member_roles").select("id,organization_member_id,role_id,site_id").eq("organization_id", organizationId) : Promise.resolve({ data: [] as Assignment[] }),
    supabase.from("sites").select("id,name").eq("organization_id", organizationId).eq("status", "active").order("name"),
    canReadWorkers ? supabase.from("workers").select("*").eq("organization_id", organizationId).order("last_name") : Promise.resolve({ data: [] as Worker[] }),
    canReadWorkers ? supabase.from("areas").select("id,name").eq("organization_id", organizationId) : Promise.resolve({ data: [] as Area[] }),
    canReadWorkers ? supabase.from("legal_entities").select("id,legal_name").eq("organization_id", organizationId) : Promise.resolve({ data: [] as LegalEntity[] }),
  ]);

  const members = membersResult.data ?? [];
  const profilesResult = members.length
    ? await supabase.from("profiles").select("id,first_name,middle_name,last_name,second_last_name,phone").in("id", members.map((member) => member.user_id))
    : { data: [] as Profile[] };
  const profiles = profilesResult.data ?? [];
  const roles = rolesResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];
  const sites = sitesResult.data ?? [];
  const workers = workersResult.data ?? [];
  const areas = areasResult.data ?? [];
  const entities = entitiesResult.data ?? [];

  const view = filters.view === "workforce" && canReadWorkers ? "workforce" : canReadMembers ? "access" : "workforce";
  const query = filters.q ?? "";
  const state = filters.state ?? "all";
  const siteFilter = filters.site ?? "all";
  const roleFilter = filters.role ?? "all";

  const memberRows: MemberRow[] = members.map((member) => {
    const profile = profiles.find((item) => item.id === member.user_id);
    const memberAssignments = assignments.filter((item) => item.organization_member_id === member.id);
    return {
      ...member,
      profile,
      name: displayPersonName(profile, "Persona invitada"),
      roles: memberAssignments.map((item) => roles.find((role) => role.id === item.role_id)?.name ?? "Acceso personalizado"),
      scopes: memberAssignments.map((item) => item.site_id ? sites.find((site) => site.id === item.site_id)?.name ?? "Sede asignada" : "Toda la organización"),
    };
  }).filter((member) =>
    (state === "all" || member.status === state)
    && (roleFilter === "all" || assignments.some((item) => item.organization_member_id === member.id && item.role_id === roleFilter))
    && (siteFilter === "all" || assignments.some((item) => item.organization_member_id === member.id && item.site_id === siteFilter))
    && matchesDirectorySearch([member.name, member.profile?.phone, ...member.roles, ...member.scopes], query)
  );

  const workerRows: WorkerRow[] = workers.map((worker) => ({
    ...worker,
    name: `${worker.first_name} ${worker.last_name}`.trim(),
    legalEntity: entities.find((entity) => entity.id === worker.legal_entity_id)?.legal_name ?? "Razón social no disponible",
    site: worker.site_id ? sites.find((site) => site.id === worker.site_id)?.name ?? "Sede no disponible" : "Sin sede asignada",
    area: worker.area_id ? areas.find((area) => area.id === worker.area_id)?.name ?? "Área no disponible" : "Sin área asignada",
  })).filter((worker) =>
    (state === "all" || worker.status === state)
    && (siteFilter === "all" || worker.site_id === siteFilter)
    && matchesDirectorySearch([worker.name, worker.employee_code, worker.work_email, worker.legalEntity, worker.site, worker.area], query)
  );

  const rows = view === "access" ? memberRows : workerRows;
  const currentPage = safePage(filters.page, rows.length, PAGE_SIZE);
  const paginatedMemberRows = memberRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginatedWorkerRows = workerRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const pageHref = (overrides: Record<string, string | undefined>) => {
    const values = new URLSearchParams();
    Object.entries({ view, q: query || undefined, state: state !== "all" ? state : undefined, site: siteFilter !== "all" ? siteFilter : undefined, role: roleFilter !== "all" ? roleFilter : undefined, ...overrides }).forEach(([key, value]) => { if (value) values.set(key, value); });
    return `/org/${organizationId}/settings/members?${values.toString()}`;
  };

  const memberColumns: DataTableColumn<MemberRow>[] = [
    { key: "person", header: "Persona", cell: (member) => <div><Link href={`/org/${organizationId}/settings/members/${member.id}`} className="font-semibold hover:text-[var(--brand)]">{member.name}</Link><p className="mt-1 text-xs text-[var(--muted)]">{member.profile?.phone || "Sin teléfono registrado"}</p></div> },
    { key: "status", header: "Estado", cell: (member) => <StatusBadge>{member.status}</StatusBadge> },
    { key: "roles", header: "Responsabilidad", cell: (member) => <div className="max-w-xs"><p className="font-medium">{member.roles.join(", ") || "Sin rol asignado"}</p><p className="mt-1 text-xs text-[var(--muted)]">{[...new Set(member.scopes)].join(", ") || "Sin alcance"}</p></div> },
    { key: "joined", header: "Vinculación", cell: (member) => <span className="text-sm text-[var(--muted-strong)]">{member.joined_at ? new Date(member.joined_at).toLocaleDateString("es-CO") : "Pendiente"}</span> },
    { key: "action", header: <span className="sr-only">Acción</span>, className: "text-right", cell: (member) => <Link href={`/org/${organizationId}/settings/members/${member.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Ver detalle <ArrowRight size={15} /></Link> },
  ];

  const workerColumns: DataTableColumn<WorkerRow>[] = [
    { key: "person", header: "Trabajador", cell: (worker) => <div><Link href={`/org/${organizationId}/settings/members/workforce/${worker.id}`} className="font-semibold hover:text-[var(--brand)]">{worker.name}</Link><p className="mt-1 font-mono text-xs text-[var(--muted)]">{worker.employee_code}</p></div> },
    { key: "email", header: "Contacto laboral", cell: (worker) => <span className="text-sm">{worker.work_email ?? "Sin correo"}</span> },
    { key: "location", header: "Ubicación", cell: (worker) => <div><p className="text-sm font-medium">{worker.site}</p><p className="mt-1 text-xs text-[var(--muted)]">{worker.area}</p></div> },
    { key: "status", header: "Estado", cell: (worker) => <StatusBadge>{worker.status}</StatusBadge> },
    { key: "action", header: <span className="sr-only">Acción</span>, className: "text-right", cell: (worker) => <Link href={`/org/${organizationId}/settings/members/workforce/${worker.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Ver ficha <ArrowRight size={15} /></Link> },
  ];

  if (!canReadMembers && !canReadWorkers) return <EmptyState title="Sin acceso a personas" description="Solicita permiso para consultar accesos o registros de trabajadores." />;

  return (
    <main className="grid gap-7">
      <PageHeader
        eyebrow="Organización"
        title="Personas"
        description="Separa claramente quién puede entrar a la plataforma de quién forma parte de la nómina operativa."
        action={view === "access" && canInvite && canManageRoles ? (
          <FormDrawer title="Invitar una persona" description="Enviaremos una invitación con el acceso y alcance seleccionados." triggerLabel="Invitar persona">
            <form action={inviteMember} className="grid gap-4">
              <input type="hidden" name="organizationId" value={organizationId} />
              <label className="grid gap-2 text-sm font-medium">Correo electrónico<Input name="email" type="email" required autoComplete="email" /></label>
              <label className="grid gap-2 text-sm font-medium">Responsabilidad inicial<Select name="role_id" required><option value="">Selecciona</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></label>
              <label className="grid gap-2 text-sm font-medium">Alcance<Select name="site_id"><option value="">Toda la organización</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</Select></label>
              <Button type="submit"><UserPlus size={17} />Enviar invitación</Button>
            </form>
          </FormDrawer>
        ) : view === "workforce" && canManageImports ? <Button asChild><Link href={`/org/${organizationId}/imports`}><UploadSimple size={17} />Importar trabajadores</Link></Button> : null}
      />
      <OrganizationSettingsNav organizationId={organizationId} current="members" />
      <StatusBanner status={filters.status} />

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryMetric label="Accesos activos" value={members.filter((item) => item.status === "active").length} icon={<UsersThree size={20} weight="duotone" />} />
        <SummaryMetric label="Invitaciones pendientes" value={members.filter((item) => item.status === "invited").length} icon={<UserPlus size={20} weight="duotone" />} />
        <SummaryMetric label="Trabajadores registrados" value={workers.filter((item) => item.status === "active").length} icon={<IdentificationCard size={20} weight="duotone" />} />
      </section>

      <div className="flex gap-6 border-b border-[var(--border)]" role="tablist" aria-label="Tipo de persona">
        {canReadMembers ? <Link role="tab" aria-selected={view === "access"} href={pageHref({ view: "access", page: undefined })} className={cn("border-b-2 pb-3 text-sm font-medium", view === "access" ? "border-[var(--brand)] text-[var(--foreground)]" : "border-transparent text-[var(--muted)]")}>Accesos a la plataforma</Link> : null}
        {canReadWorkers ? <Link role="tab" aria-selected={view === "workforce"} href={pageHref({ view: "workforce", role: undefined, page: undefined })} className={cn("border-b-2 pb-3 text-sm font-medium", view === "workforce" ? "border-[var(--brand)] text-[var(--foreground)]" : "border-transparent text-[var(--muted)]")}>Nómina operativa</Link> : null}
      </div>

      <Card>
        <CardContent className="p-4">
          <form method="get" className="grid gap-3 md:grid-cols-[minmax(14rem,1fr)_10rem_12rem_12rem_auto]">
            <input type="hidden" name="view" value={view} />
            <Input name="q" defaultValue={query} placeholder="Buscar persona, correo o ubicación" aria-label="Buscar personas" />
            <Select name="state" defaultValue={state} aria-label="Filtrar por estado"><option value="all">Todos los estados</option><option value="active">Activos</option><option value="invited">Invitados</option><option value="inactive">Inactivos</option><option value="suspended">Suspendidos</option><option value="archived">Archivados</option></Select>
            <Select name="site" defaultValue={siteFilter} aria-label="Filtrar por sede"><option value="all">Todas las sedes</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</Select>
            {view === "access" ? <Select name="role" defaultValue={roleFilter} aria-label="Filtrar por rol"><option value="all">Todas las responsabilidades</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select> : <span aria-hidden />}
            <Button type="submit" variant="secondary">Aplicar</Button>
          </form>
        </CardContent>
      </Card>

      {view === "access" ? (
        <DataTable columns={memberColumns} rows={paginatedMemberRows} getRowId={(row) => row.id} caption="Personas con acceso a la plataforma" empty={<EmptyState title="No encontramos accesos" description="Ajusta los filtros o invita a la primera persona de tu equipo." />} />
      ) : (
        <DataTable columns={workerColumns} rows={paginatedWorkerRows} getRowId={(row) => row.id} caption="Trabajadores registrados" empty={<EmptyState title="No encontramos trabajadores" description="Ajusta los filtros o importa una nómina operativa desde un archivo seguro." action={canManageImports ? <Button asChild variant="secondary"><Link href={`/org/${organizationId}/imports`}>Ir a importaciones</Link></Button> : undefined} />} />
      )}

      <footer className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[var(--muted)]">{rows.length} {rows.length === 1 ? "registro" : "registros"} · página {currentPage} de {totalPages}</p>
        {totalPages > 1 ? <nav aria-label="Paginación de personas" className="flex gap-2"><Link aria-disabled={currentPage === 1} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), currentPage === 1 && "pointer-events-none opacity-50")} href={pageHref({ page: String(Math.max(1, currentPage - 1)) })}>Anterior</Link><Link aria-disabled={currentPage === totalPages} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), currentPage === totalPages && "pointer-events-none opacity-50")} href={pageHref({ page: String(Math.min(totalPages, currentPage + 1)) })}>Siguiente</Link></nav> : null}
      </footer>

      {view === "access" && canManageRoles ? (
        <Card><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Asignar una responsabilidad adicional</h2><p className="mt-1 text-sm text-[var(--muted)]">Una persona puede tener responsabilidades distintas en toda la empresa o en una sede.</p></div><FormDrawer title="Asignar responsabilidad" description="El acceso se suma a los permisos que la persona ya tiene." triggerLabel="Asignar rol" variant="secondary"><form action={assignRole} className="grid gap-4"><input type="hidden" name="organizationId" value={organizationId} /><label className="grid gap-2 text-sm font-medium">Persona<Select name="member_id" required><option value="">Selecciona</option>{memberRows.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</Select></label><label className="grid gap-2 text-sm font-medium">Responsabilidad<Select name="role_id" required><option value="">Selecciona</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></label><label className="grid gap-2 text-sm font-medium">Alcance<Select name="site_id"><option value="">Toda la organización</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</Select></label><Button type="submit">Asignar acceso</Button></form></FormDrawer></CardContent></Card>
      ) : null}
    </main>
  );
}

function SummaryMetric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return <div className="flex items-center gap-4 border-b border-[var(--border)] px-1 py-4"><span className="grid size-10 place-items-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)]">{icon}</span><div><p className="font-mono text-2xl font-semibold tabular-nums tracking-[-0.04em]">{value}</p><p className="mt-0.5 text-xs text-[var(--muted)]">{label}</p></div></div>;
}
