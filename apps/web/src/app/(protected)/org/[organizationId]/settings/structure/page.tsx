import Link from "next/link";
import type { ReactNode } from "react";
import { Buildings, MapPin, TreeStructure } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/empty-state";
import { StructureDeleteForm } from "@/components/structure-delete-form";
import { FormDrawer } from "@/components/form-drawer";
import { OrganizationSettingsNav } from "@/components/organization-settings-nav";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { createArea, createLegalEntity, createSite, deleteArea, deleteLegalEntity, deleteSite, setStructureStatus, updateArea, updateLegalEntity, updateSite } from "@/modules/organizations/core-actions";
import { can } from "@/modules/auth/permissions";
import { requireTenant } from "@/modules/organizations/tenant";
import type { Database } from "@/types/database";

type LegalEntity = Database["public"]["Tables"]["legal_entities"]["Row"];
type Site = Database["public"]["Tables"]["sites"]["Row"];
type Area = Database["public"]["Tables"]["areas"]["Row"];

export default async function StructureSettings({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string; q?: string; state?: string; site?: string; page?: string }> }) {
  const { organizationId } = await params;
  await requireTenant(organizationId);
  const supabase = await createClient();
  const [{ data: entities }, { data: sites }, { data: areas }, entityCreate, entityUpdate, entityDelete, siteCreate, siteUpdate, siteDelete, areaCreate, areaUpdate, areaDelete] = await Promise.all([
    supabase.from("legal_entities").select("*").eq("organization_id", organizationId).order("legal_name"),
    supabase.from("sites").select("*").eq("organization_id", organizationId).order("name"),
    supabase.from("areas").select("*").eq("organization_id", organizationId).order("name"),
    can(organizationId, "legal_entities.create"), can(organizationId, "legal_entities.update"), can(organizationId, "legal_entities.delete"),
    can(organizationId, "sites.create"), can(organizationId, "sites.update"), can(organizationId, "sites.delete"),
    can(organizationId, "areas.create"), can(organizationId, "areas.update"), can(organizationId, "areas.delete"),
  ]);
  const { status, q = "", state = "all", site: selectedSite = "all", page = "1" } = await searchParams;
  const query = q.trim().toLowerCase();
  const pageSize = 8;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const matches = <T extends { name?: string; legal_name?: string; code?: string; status: string; site_id?: string }>(item: T) => (state === "all" || item.status === state) && (selectedSite === "all" || item.site_id === undefined || item.site_id === selectedSite) && (!query || `${item.name ?? item.legal_name ?? ""} ${item.code ?? ""}`.toLowerCase().includes(query));
  const filteredEntities = (entities ?? []).filter(matches);
  const filteredSites = (sites ?? []).filter(matches);
  const filteredAreas = (areas ?? []).filter(matches);
  const maxPages = Math.max(1, Math.ceil(Math.max(filteredEntities.length, filteredSites.length, filteredAreas.length) / pageSize));
  const selectedPage = Math.min(currentPage, maxPages);
  const visibleEntities = filteredEntities.slice((selectedPage - 1) * pageSize, selectedPage * pageSize);
  const visibleSites = filteredSites.slice((selectedPage - 1) * pageSize, selectedPage * pageSize);
  const visibleAreas = filteredAreas.slice((selectedPage - 1) * pageSize, selectedPage * pageSize);
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (state !== "all") params.set("state", state);
    if (selectedSite !== "all") params.set("site", selectedSite);
    params.set("page", String(nextPage));
    return `/org/${organizationId}/settings/structure?${params.toString()}`;
  };
  return (
    <div className="grid gap-7">
      <PageHeader title="Estructura empresarial" description="Organiza razones sociales, sedes y áreas para mantener cada actividad en el contexto correcto." />
      <OrganizationSettingsNav organizationId={organizationId} current="structure" />
      <StatusBanner status={status} />
      <section aria-label="Resumen de estructura" className="grid gap-3 sm:grid-cols-3">
        <StructureMetric icon={<Buildings size={20} weight="duotone" />} label="Razones sociales activas" value={(entities ?? []).filter((item) => item.status === "active").length} />
        <StructureMetric icon={<MapPin size={20} weight="duotone" />} label="Sedes activas" value={(sites ?? []).filter((item) => item.status === "active").length} />
        <StructureMetric icon={<TreeStructure size={20} weight="duotone" />} label="Áreas activas" value={(areas ?? []).filter((item) => item.status === "active").length} />
      </section>
      <form className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-[1fr_10rem_12rem_auto]" method="get"><Input name="q" defaultValue={q} placeholder="Buscar por nombre o código" aria-label="Buscar estructura" /><Select name="state" defaultValue={state} aria-label="Filtrar por estado"><option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></Select><Select name="site" defaultValue={selectedSite} aria-label="Filtrar por sede"><option value="all">Todas las sedes</option>{sites?.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</Select><Button type="submit">Filtrar</Button></form>
      {maxPages > 1 ? <nav aria-label="Paginación de estructura" className="flex items-center justify-end gap-3 text-sm"><Link className="text-[var(--brand)] disabled:pointer-events-none" aria-disabled={selectedPage === 1} href={pageHref(Math.max(1, selectedPage - 1))}>Anterior</Link><span className="text-[var(--muted)]">Página {selectedPage} de {maxPages}</span><Link className="text-[var(--brand)]" aria-disabled={selectedPage === maxPages} href={pageHref(Math.min(maxPages, selectedPage + 1))}>Siguiente</Link></nav> : null}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4"><h2 className="font-semibold">Razones sociales</h2>{entityCreate ? <FormDrawer title="Nueva razón social" description="Registra la entidad legal y su información de clasificación básica." triggerLabel="Agregar razón social">
          <form action={createLegalEntity} className="grid content-start gap-4">
            <input type="hidden" name="organizationId" value={organizationId} />
            <label className="grid gap-2 text-sm font-medium">Razón social<Input name="legal_name" required /></label>
            <label className="grid gap-2 text-sm font-medium">Nombre comercial<Input name="trade_name" /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">NIT<Input name="tax_id" required /></label><label className="grid gap-2 text-sm font-medium">CIIU<Input name="ciiu_code" /></label></div>
            <label className="grid gap-2 text-sm font-medium">Actividad económica<Input name="economic_activity" /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Trabajadores<Input name="employee_count" type="number" min={0} defaultValue={0} required /></label><label className="grid gap-2 text-sm font-medium">Clase de riesgo<Select name="risk_class" defaultValue="1"><option value="1">I</option><option value="2">II</option><option value="3">III</option><option value="4">IV</option><option value="5">V</option></Select></label></div>
            <Button type="submit" disabled={!entityCreate}>Agregar razón social</Button>
          </form></FormDrawer> : null}</CardHeader>
        <CardContent>
          <div className="grid content-start gap-3">{visibleEntities.length ? visibleEntities.map((entity) => <div key={entity.id} className="rounded-lg border border-[var(--border)] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold">{entity.legal_name}</p><Badge className={entity.status === "active" ? "" : "bg-slate-100 text-slate-600"}>{entity.status === "active" ? "Activa" : "Inactiva"}</Badge></div><p className="mt-1 text-sm text-[var(--muted)]">NIT {entity.tax_id} · {entity.employee_count} trabajadores</p></div>{entityUpdate ? <StatusForm organizationId={organizationId} table="legal_entities" id={entity.id} active={entity.status === "active"} /> : null}</div>{entityUpdate ? <LegalEntityEditForm organizationId={organizationId} entity={entity} /> : null}{entityDelete ? <StructureDeleteForm action={deleteLegalEntity} organizationId={organizationId} id={entity.id} name={entity.legal_name} label="Eliminar razón social" consequence="Una razón social no se puede eliminar mientras tenga sedes asociadas." /> : null}</div>) : <EmptyState title="Sin razones sociales" description="No hay resultados con los filtros actuales." />}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4"><h2 className="font-semibold">Sedes</h2>{siteCreate ? <FormDrawer title="Nueva sede" description="Ubica el centro de trabajo dentro de una razón social." triggerLabel="Agregar sede" disabled={!entities?.length}>
          <form action={createSite} className="grid content-start gap-4">
            <input type="hidden" name="organizationId" value={organizationId} />
            <label className="grid gap-2 text-sm font-medium">Razón social<Select name="legal_entity_id" required><option value="">Selecciona</option>{entities?.filter((e) => e.status === "active").map((e) => <option key={e.id} value={e.id}>{e.legal_name}</option>)}</Select></label>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]"><label className="grid gap-2 text-sm font-medium">Nombre<Input name="name" required /></label><label className="grid gap-2 text-sm font-medium">Código<Input name="code" required /></label></div>
            <label className="grid gap-2 text-sm font-medium">Dirección<Input name="address" /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Ciudad<Input name="city" /></label><label className="grid gap-2 text-sm font-medium">Departamento<Input name="department" /></label></div>
            <label className="grid gap-2 text-sm font-medium">Clase de riesgo<Select name="risk_class" defaultValue="1"><option value="1">I</option><option value="2">II</option><option value="3">III</option><option value="4">IV</option><option value="5">V</option></Select></label>
            <Button type="submit" disabled={!entities?.length || !siteCreate}>Agregar sede</Button>
          </form></FormDrawer> : null}</CardHeader>
        <CardContent>
          <div className="grid content-start gap-3">{visibleSites.length ? visibleSites.map((site) => <div key={site.id} className="rounded-lg border border-[var(--border)] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold">{site.name}</p><Badge className={site.status === "active" ? "" : "bg-slate-100 text-slate-600"}>{site.code}</Badge></div><p className="mt-1 text-sm text-[var(--muted)]">{[site.city, site.department].filter(Boolean).join(", ") || "Ubicación pendiente"}</p></div>{siteUpdate ? <StatusForm organizationId={organizationId} table="sites" id={site.id} active={site.status === "active"} siteId={site.id} /> : null}</div>{siteUpdate ? <SiteEditForm organizationId={organizationId} site={site} entities={entities ?? []} /> : null}{siteDelete ? <StructureDeleteForm action={deleteSite} organizationId={organizationId} id={site.id} name={site.name} label="Eliminar sede" consequence="Se eliminarán permanentemente todas las áreas y asignaciones con alcance de esta sede." /> : null}</div>) : <EmptyState title="Sin sedes" description="No hay resultados con los filtros actuales." />}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4"><h2 className="font-semibold">Áreas</h2>{areaCreate ? <FormDrawer title="Nueva área" description="Crea un nivel de la estructura dentro de una sede." triggerLabel="Agregar área" disabled={!sites?.length}>
          <form action={createArea} className="grid content-start gap-4">
            <input type="hidden" name="organizationId" value={organizationId} />
            <label className="grid gap-2 text-sm font-medium">Sede<Select name="site_id" required><option value="">Selecciona</option>{sites?.filter((s) => s.status === "active").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></label>
            <label className="grid gap-2 text-sm font-medium">Área superior<Select name="parent_area_id"><option value="">Ninguna</option>{areas?.filter((a) => a.status === "active").map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></label>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]"><label className="grid gap-2 text-sm font-medium">Nombre<Input name="name" required /></label><label className="grid gap-2 text-sm font-medium">Código<Input name="code" required /></label></div>
            <Button type="submit" disabled={!sites?.length || !areaCreate}>Agregar área</Button>
          </form></FormDrawer> : null}</CardHeader>
        <CardContent>
          <div className="grid content-start gap-3">{visibleAreas.length ? visibleAreas.map((area) => { const site = sites?.find((item) => item.id === area.site_id); return <div key={area.id} className="rounded-lg border border-[var(--border)] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold">{area.name}</p><Badge className={area.status === "active" ? "" : "bg-slate-100 text-slate-600"}>{area.code}</Badge></div><p className="mt-1 text-sm text-[var(--muted)]">{site?.name ?? "Sede"}</p></div>{areaUpdate ? <StatusForm organizationId={organizationId} table="areas" id={area.id} active={area.status === "active"} siteId={area.site_id} /> : null}</div>{areaUpdate ? <AreaEditForm organizationId={organizationId} area={area} sites={sites ?? []} areas={areas ?? []} /> : null}{areaDelete ? <StructureDeleteForm action={deleteArea} organizationId={organizationId} id={area.id} name={area.name} label="Eliminar área" consequence="Las áreas hijas no se eliminarán: quedarán sin área superior." /> : null}</div>; }) : <EmptyState title="Sin áreas" description="No hay resultados con los filtros actuales." />}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusForm({ organizationId, table, id, active, siteId }: { organizationId: string; table: "legal_entities" | "sites" | "areas"; id: string; active: boolean; siteId?: string }) {
  return <form action={setStructureStatus}><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="table" value={table} /><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={active ? "inactive" : "active"} />{siteId ? <input type="hidden" name="siteId" value={siteId} /> : null}<Button type="submit" size="sm" variant="secondary">{active ? "Desactivar" : "Activar"}</Button></form>;
}

function StructureMetric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <div className="flex items-center gap-4 border-b border-[var(--border)] px-1 py-4"><span className="grid size-10 place-items-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)]">{icon}</span><div><p className="font-mono text-2xl font-semibold tabular-nums tracking-[-0.04em]">{value}</p><p className="mt-0.5 text-xs text-[var(--muted)]">{label}</p></div></div>;
}

function LegalEntityEditForm({ organizationId, entity }: { organizationId: string; entity: LegalEntity }) {
  return <details className="mt-4 border-t border-[var(--border)] pt-3"><summary className="cursor-pointer text-sm font-semibold text-[var(--brand)]">Editar datos</summary><form action={updateLegalEntity} className="mt-4 grid gap-3 sm:grid-cols-2"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="entityId" value={entity.id} /><label className="grid gap-2 text-sm font-medium sm:col-span-2">Razón social<Input name="legal_name" defaultValue={entity.legal_name} required /></label><label className="grid gap-2 text-sm font-medium">Nombre comercial<Input name="trade_name" defaultValue={entity.trade_name ?? ""} /></label><label className="grid gap-2 text-sm font-medium">NIT<Input name="tax_id" defaultValue={entity.tax_id} required /></label><label className="grid gap-2 text-sm font-medium">CIIU<Input name="ciiu_code" defaultValue={entity.ciiu_code ?? ""} /></label><label className="grid gap-2 text-sm font-medium">Actividad económica<Input name="economic_activity" defaultValue={entity.economic_activity ?? ""} /></label><label className="grid gap-2 text-sm font-medium">Representante legal<Input name="legal_representative" defaultValue={entity.legal_representative ?? ""} /></label><label className="grid gap-2 text-sm font-medium">Trabajadores<Input name="employee_count" type="number" min={0} defaultValue={entity.employee_count} required /></label><label className="grid gap-2 text-sm font-medium">Clase de riesgo<RiskSelect value={entity.risk_class ?? 1} /></label><div className="sm:col-span-2"><Button type="submit" size="sm">Guardar cambios</Button></div></form></details>;
}

function SiteEditForm({ organizationId, site, entities }: { organizationId: string; site: Site; entities: LegalEntity[] }) {
  return <details className="mt-4 border-t border-[var(--border)] pt-3"><summary className="cursor-pointer text-sm font-semibold text-[var(--brand)]">Editar datos</summary><form action={updateSite} className="mt-4 grid gap-3 sm:grid-cols-2"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="siteId" value={site.id} /><label className="grid gap-2 text-sm font-medium sm:col-span-2">Razón social<Select name="legal_entity_id" defaultValue={site.legal_entity_id} required>{entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.legal_name}</option>)}</Select></label><label className="grid gap-2 text-sm font-medium">Nombre<Input name="name" defaultValue={site.name} required /></label><label className="grid gap-2 text-sm font-medium">Código<Input name="code" defaultValue={site.code} required /></label><label className="grid gap-2 text-sm font-medium sm:col-span-2">Dirección<Input name="address" defaultValue={site.address ?? ""} /></label><label className="grid gap-2 text-sm font-medium">Ciudad<Input name="city" defaultValue={site.city ?? ""} /></label><label className="grid gap-2 text-sm font-medium">Departamento<Input name="department" defaultValue={site.department ?? ""} /></label><label className="grid gap-2 text-sm font-medium">Clase de riesgo<RiskSelect value={site.risk_class ?? 1} /></label><div className="self-end"><Button type="submit" size="sm">Guardar cambios</Button></div></form></details>;
}

function AreaEditForm({ organizationId, area, sites, areas }: { organizationId: string; area: Area; sites: Site[]; areas: Area[] }) {
  return <details className="mt-4 border-t border-[var(--border)] pt-3"><summary className="cursor-pointer text-sm font-semibold text-[var(--brand)]">Editar datos</summary><form action={updateArea} className="mt-4 grid gap-3 sm:grid-cols-2"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="areaId" value={area.id} /><label className="grid gap-2 text-sm font-medium">Sede<Select name="site_id" defaultValue={area.site_id} required>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</Select></label><label className="grid gap-2 text-sm font-medium">Área superior<Select name="parent_area_id" defaultValue={area.parent_area_id ?? ""}><option value="">Ninguna</option>{areas.filter((candidate) => candidate.id !== area.id && candidate.site_id === area.site_id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</Select></label><label className="grid gap-2 text-sm font-medium">Nombre<Input name="name" defaultValue={area.name} required /></label><label className="grid gap-2 text-sm font-medium">Código<Input name="code" defaultValue={area.code} required /></label><div className="sm:col-span-2"><Button type="submit" size="sm">Guardar cambios</Button></div></form></details>;
}

function RiskSelect({ value }: { value: number }) {
  return <Select name="risk_class" defaultValue={String(value)}><option value="1">I</option><option value="2">II</option><option value="3">III</option><option value="4">IV</option><option value="5">V</option></Select>;
}
