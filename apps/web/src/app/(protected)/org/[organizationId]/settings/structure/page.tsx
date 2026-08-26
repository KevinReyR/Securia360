import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { createArea, createLegalEntity, createSite, setStructureStatus, updateArea, updateLegalEntity, updateSite } from "@/modules/organizations/core-actions";
import { requireTenant } from "@/modules/organizations/tenant";
import type { Database } from "@/types/database";

type LegalEntity = Database["public"]["Tables"]["legal_entities"]["Row"];
type Site = Database["public"]["Tables"]["sites"]["Row"];
type Area = Database["public"]["Tables"]["areas"]["Row"];

export default async function StructureSettings({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId } = await params;
  await requireTenant(organizationId);
  const supabase = await createClient();
  const [{ data: entities }, { data: sites }, { data: areas }] = await Promise.all([
    supabase.from("legal_entities").select("*").eq("organization_id", organizationId).order("legal_name"),
    supabase.from("sites").select("*").eq("organization_id", organizationId).order("name"),
    supabase.from("areas").select("*").eq("organization_id", organizationId).order("name"),
  ]);
  const { status } = await searchParams;
  return (
    <div className="grid gap-7">
      <PageHeader title="Estructura empresarial" description="Administra razones sociales, sedes y áreas. Todas las consultas están limitadas al tenant de la URL y verificadas por RLS." />
      <StatusBanner status={status} />
      <Card>
        <CardHeader><h2 className="font-semibold">Razones sociales</h2></CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <form action={createLegalEntity} className="grid content-start gap-3 rounded-lg bg-[var(--muted-surface)] p-4">
            <input type="hidden" name="organizationId" value={organizationId} />
            <label className="grid gap-2 text-sm font-medium">Razón social<Input name="legal_name" required /></label>
            <label className="grid gap-2 text-sm font-medium">Nombre comercial<Input name="trade_name" /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">NIT<Input name="tax_id" required /></label><label className="grid gap-2 text-sm font-medium">CIIU<Input name="ciiu_code" /></label></div>
            <label className="grid gap-2 text-sm font-medium">Actividad económica<Input name="economic_activity" /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Trabajadores<Input name="employee_count" type="number" min={0} defaultValue={0} required /></label><label className="grid gap-2 text-sm font-medium">Clase de riesgo<Select name="risk_class" defaultValue="1"><option value="1">I</option><option value="2">II</option><option value="3">III</option><option value="4">IV</option><option value="5">V</option></Select></label></div>
            <Button type="submit">Agregar razón social</Button>
          </form>
          <div className="grid content-start gap-3">{entities?.length ? entities.map((entity) => <div key={entity.id} className="rounded-lg border border-[var(--border)] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold">{entity.legal_name}</p><Badge className={entity.status === "active" ? "" : "bg-slate-100 text-slate-600"}>{entity.status === "active" ? "Activa" : "Inactiva"}</Badge></div><p className="mt-1 text-sm text-[var(--muted)]">NIT {entity.tax_id} · {entity.employee_count} trabajadores</p></div><StatusForm organizationId={organizationId} table="legal_entities" id={entity.id} active={entity.status === "active"} /></div><LegalEntityEditForm organizationId={organizationId} entity={entity} /></div>) : <EmptyState title="Sin razones sociales" description="Agrega la entidad legal principal de la organización." />}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h2 className="font-semibold">Sedes</h2></CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <form action={createSite} className="grid content-start gap-3 rounded-lg bg-[var(--muted-surface)] p-4">
            <input type="hidden" name="organizationId" value={organizationId} />
            <label className="grid gap-2 text-sm font-medium">Razón social<Select name="legal_entity_id" required><option value="">Selecciona</option>{entities?.filter((e) => e.status === "active").map((e) => <option key={e.id} value={e.id}>{e.legal_name}</option>)}</Select></label>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]"><label className="grid gap-2 text-sm font-medium">Nombre<Input name="name" required /></label><label className="grid gap-2 text-sm font-medium">Código<Input name="code" required /></label></div>
            <label className="grid gap-2 text-sm font-medium">Dirección<Input name="address" /></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Ciudad<Input name="city" /></label><label className="grid gap-2 text-sm font-medium">Departamento<Input name="department" /></label></div>
            <label className="grid gap-2 text-sm font-medium">Clase de riesgo<Select name="risk_class" defaultValue="1"><option value="1">I</option><option value="2">II</option><option value="3">III</option><option value="4">IV</option><option value="5">V</option></Select></label>
            <Button type="submit" disabled={!entities?.length}>Agregar sede</Button>
          </form>
          <div className="grid content-start gap-3">{sites?.length ? sites.map((site) => <div key={site.id} className="rounded-lg border border-[var(--border)] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold">{site.name}</p><Badge className={site.status === "active" ? "" : "bg-slate-100 text-slate-600"}>{site.code}</Badge></div><p className="mt-1 text-sm text-[var(--muted)]">{[site.city, site.department].filter(Boolean).join(", ") || "Ubicación pendiente"}</p></div><StatusForm organizationId={organizationId} table="sites" id={site.id} active={site.status === "active"} siteId={site.id} /></div><SiteEditForm organizationId={organizationId} site={site} entities={entities ?? []} /></div>) : <EmptyState title="Sin sedes" description="Crea primero una razón social y luego registra sus centros de trabajo." />}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h2 className="font-semibold">Áreas</h2></CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <form action={createArea} className="grid content-start gap-3 rounded-lg bg-[var(--muted-surface)] p-4">
            <input type="hidden" name="organizationId" value={organizationId} />
            <label className="grid gap-2 text-sm font-medium">Sede<Select name="site_id" required><option value="">Selecciona</option>{sites?.filter((s) => s.status === "active").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></label>
            <label className="grid gap-2 text-sm font-medium">Área superior<Select name="parent_area_id"><option value="">Ninguna</option>{areas?.filter((a) => a.status === "active").map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></label>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]"><label className="grid gap-2 text-sm font-medium">Nombre<Input name="name" required /></label><label className="grid gap-2 text-sm font-medium">Código<Input name="code" required /></label></div>
            <Button type="submit" disabled={!sites?.length}>Agregar área</Button>
          </form>
          <div className="grid content-start gap-3">{areas?.length ? areas.map((area) => { const site = sites?.find((item) => item.id === area.site_id); return <div key={area.id} className="rounded-lg border border-[var(--border)] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold">{area.name}</p><Badge className={area.status === "active" ? "" : "bg-slate-100 text-slate-600"}>{area.code}</Badge></div><p className="mt-1 text-sm text-[var(--muted)]">{site?.name ?? "Sede"}</p></div><StatusForm organizationId={organizationId} table="areas" id={area.id} active={area.status === "active"} siteId={area.site_id} /></div><AreaEditForm organizationId={organizationId} area={area} sites={sites ?? []} areas={areas ?? []} /></div>; }) : <EmptyState title="Sin áreas" description="Registra las áreas de cada sede para preparar los alcances operativos." />}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusForm({ organizationId, table, id, active, siteId }: { organizationId: string; table: "legal_entities" | "sites" | "areas"; id: string; active: boolean; siteId?: string }) {
  return <form action={setStructureStatus}><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="table" value={table} /><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={active ? "inactive" : "active"} />{siteId ? <input type="hidden" name="siteId" value={siteId} /> : null}<Button type="submit" size="sm" variant="secondary">{active ? "Desactivar" : "Activar"}</Button></form>;
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
