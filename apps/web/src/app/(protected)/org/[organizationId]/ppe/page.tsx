/* eslint-disable @typescript-eslint/no-explicit-any */
import { CaretDown, CheckCircle, ClockCounterClockwise, HardHat, Package, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { FormDrawer } from "@/components/form-drawer";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { can } from "@/modules/auth/permissions";
import { displayPersonName } from "@/modules/organizations/directory";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { acceptPpeDelivery, createPpeAssignment, createPpeCatalog, createPpeInventory, deliverPpe, inspectPpe, recordPpeInventoryMovement, retirePpe } from "@/modules/ppe/actions";
import { isPpeView, parsePpeSiteScope, parsePpeView, ppeHref, type PpeSiteScope, type PpeView } from "@/modules/ppe/ppe-navigation";
import { PpeTabs } from "@/modules/ppe/ppe-tabs";

const PAGE_SIZE = 20;
const assignmentStatuses = ["active", "retired", "all"] as const;
const historyTypes = ["all", "movement", "delivery", "inspection", "retirement"] as const;
const movementLabels: Record<string, string> = { purchase: "Compra", return: "Devolución", adjustment: "Ajuste", delivery: "Entrega" };
const deliveryLabels: Record<string, string> = { initial: "Entrega inicial", replacement: "Reposición" };

type HistoryEvent = { id: string; type: string; occurredAt: string; title: string; description: string; status?: string };

function applySite(query: any, site: PpeSiteScope) {
  if (site === "general") return query.is("site_id", null);
  if (site) return query.eq("site_id", site);
  return query;
}

function displayDate(value: string | null | undefined) {
  return value ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(value)) : "Sin fecha";
}

function displayDateTime(value: string | null | undefined) {
  return value ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin fecha";
}

function Pagination({ organizationId, site, view, page, hasPrevious, hasNext, filters }: { organizationId: string; site: PpeSiteScope; view: PpeView; page: number; hasPrevious: boolean; hasNext: boolean; filters?: Record<string, string | number | undefined> }) {
  if (!hasPrevious && !hasNext) return null;
  return <nav aria-label="Paginación" className="flex items-center justify-between gap-3 pt-2"><span className="text-xs text-[var(--muted)]">Página {page}</span><div className="flex gap-2">{hasPrevious ? <Button asChild variant="secondary" size="sm"><Link href={ppeHref(organizationId, site, view, { ...filters, page: page - 1 })}>Anterior</Link></Button> : null}{hasNext ? <Button asChild variant="secondary" size="sm"><Link href={ppeHref(organizationId, site, view, { ...filters, page: page + 1 })}>Siguiente</Link></Button> : null}</div></nav>;
}

export default async function PpePage({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ q?: string; status?: string; type?: string; page?: string; site?: string; view?: string; notice?: string }>;
}) {
  const { organizationId } = await params;
  const filters = await searchParams;
  const { userId, supabase } = await requireAuthenticatedUser();
  const db = supabase as any;
  const [read, manage, validate, membershipResult, sitesResult] = await Promise.all([
    can(organizationId, "ppe.read"),
    can(organizationId, "ppe.manage"),
    can(organizationId, "ppe.validate"),
    db.from("organization_members").select("id,user_id").eq("organization_id", organizationId).eq("user_id", userId).eq("status", "active").maybeSingle(),
    db.from("sites").select("id,name").eq("organization_id", organizationId).eq("status", "active").order("name"),
  ]);
  const membership = membershipResult.data;
  if (!read && !manage && !validate && !membership) return <EmptyState title="Sin permiso" description="Solicita acceso a los elementos de protección personal." />;

  const sites = sitesResult.data ?? [];
  const requestedView = parsePpeView(filters.view);
  const site = parsePpeSiteScope(filters.site, sites.map((item: any) => item.id));
  const workerMode = !read && !manage && !validate;
  if ((!workerMode && filters.view && !isPpeView(filters.view)) || (filters.site && !site)) redirect(ppeHref(organizationId, undefined, workerMode ? "assignments" : requestedView));
  if (workerMode && filters.view && requestedView !== "assignments") redirect(ppeHref(organizationId, site, "assignments"));
  const view: PpeView = workerMode ? "assignments" : requestedView;
  const page = Math.max(1, Number(filters.page ?? "1") || 1);
  const q = (filters.q ?? "").trim().slice(0, 120);
  const assignmentStatus = assignmentStatuses.includes(filters.status as any) ? filters.status as (typeof assignmentStatuses)[number] : "active";
  const historyType = historyTypes.includes(filters.type as any) ? filters.type as (typeof historyTypes)[number] : "all";

  let catalog: any[] = [];
  let catalogOptions: any[] = [];
  let catalogLinks: any[] = [];
  let controlLinks: any[] = [];
  let inventory: any[] = [];
  let assignments: any[] = [];
  let deliveries: any[] = [];
  let inspections: any[] = [];
  let retirements: any[] = [];
  let movements: any[] = [];
  let members: any[] = [];
  let profiles: any[] = [];
  let hazards: any[] = [];
  let controls: any[] = [];
  let versions: any[] = [];
  let history: HistoryEvent[] = [];
  let catalogCount = 0;
  let inventoryCount = 0;
  let assignmentCount = 0;
  let historyHasNext = false;
  let workerHasNext = false;

  if (workerMode) {
    const assignmentQuery = applySite(db.from("ppe_assignments").select("*").eq("organization_id", organizationId).eq("organization_member_id", membership.id).eq("status", "active").order("assigned_at", { ascending: false }), site);
    const assignmentResult = await assignmentQuery.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    workerHasNext = (assignmentResult.data ?? []).length > PAGE_SIZE;
    assignments = (assignmentResult.data ?? []).slice(0, PAGE_SIZE);
    const assignmentIds = assignments.map((item: any) => item.id);
    const catalogIds = [...new Set(assignments.map((item: any) => item.ppe_catalog_id))];
    const [deliveryResult, catalogResult] = await Promise.all([
      assignmentIds.length ? db.from("ppe_deliveries").select("*").eq("organization_id", organizationId).in("ppe_assignment_id", assignmentIds).order("delivered_at", { ascending: false }) : Promise.resolve({ data: [] }),
      catalogIds.length ? db.from("ppe_catalog").select("id,code,name,category,useful_life_days").eq("organization_id", organizationId).in("id", catalogIds) : Promise.resolve({ data: [] }),
    ]);
    deliveries = deliveryResult.data ?? [];
    catalog = catalogResult.data ?? [];
    assignmentCount = assignments.length;
  } else if (view === "summary") {
    const [inventoryResult, assignmentResult] = await Promise.all([
      applySite(db.from("ppe_inventory").select("id,ppe_catalog_id,site_id,size_label,quantity_on_hand,reorder_point,updated_at").eq("organization_id", organizationId), site),
      applySite(db.from("ppe_assignments").select("id,ppe_catalog_id,site_id,status,replacement_required,life_expires_at,organization_member_id").eq("organization_id", organizationId), site),
    ]);
    inventory = inventoryResult.data ?? [];
    assignments = assignmentResult.data ?? [];
    const inventoryIds = inventory.map((item: any) => item.id);
    const assignmentIds = assignments.map((item: any) => item.id);
    const [deliveryResult, movementResult] = await Promise.all([
      assignmentIds.length ? db.from("ppe_deliveries").select("id,ppe_assignment_id,quantity,delivery_kind,delivered_at,accepted_at").eq("organization_id", organizationId).in("ppe_assignment_id", assignmentIds).order("delivered_at", { ascending: false }).limit(8) : Promise.resolve({ data: [] }),
      inventoryIds.length ? db.from("ppe_inventory_movements").select("id,inventory_id,movement_type,quantity_delta,created_at").eq("organization_id", organizationId).in("inventory_id", inventoryIds).order("created_at", { ascending: false }).limit(8) : Promise.resolve({ data: [] }),
    ]);
    deliveries = deliveryResult.data ?? [];
    movements = movementResult.data ?? [];
    const catalogIds = [...new Set([...inventory.map((item: any) => item.ppe_catalog_id), ...assignments.map((item: any) => item.ppe_catalog_id)])];
    catalog = catalogIds.length ? (await db.from("ppe_catalog").select("id,name,code").eq("organization_id", organizationId).in("id", catalogIds)).data ?? [] : [];
  } else if (view === "catalog") {
    let catalogQuery = db.from("ppe_catalog").select("*", { count: "exact" }).eq("organization_id", organizationId).order("name");
    if (q) catalogQuery = catalogQuery.ilike("name", `%${q.replace(/[%_]/g, "")}%`);
    if (filters.status && ["draft", "active", "archived"].includes(filters.status)) catalogQuery = catalogQuery.eq("status", filters.status);
    const [catalogResult, hazardResult, controlResult] = await Promise.all([
      catalogQuery.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
      manage ? db.from("hazard_catalog").select("id,name").order("name").limit(100) : Promise.resolve({ data: [] }),
      manage ? db.from("risk_controls").select("id,description").eq("organization_id", organizationId).limit(100) : Promise.resolve({ data: [] }),
    ]);
    catalog = catalogResult.data ?? [];
    catalogCount = catalogResult.count ?? 0;
    hazards = hazardResult.data ?? [];
    controls = controlResult.data ?? [];
    const ids = catalog.map((item: any) => item.id);
    const [hazardLinksResult, controlLinksResult] = await Promise.all([
      ids.length ? db.from("ppe_catalog_hazards").select("ppe_catalog_id,hazard_id").in("ppe_catalog_id", ids) : Promise.resolve({ data: [] }),
      ids.length ? db.from("ppe_catalog_controls").select("ppe_catalog_id,risk_control_id").eq("organization_id", organizationId).in("ppe_catalog_id", ids) : Promise.resolve({ data: [] }),
    ]);
    catalogLinks = hazardLinksResult.data ?? [];
    controlLinks = controlLinksResult.data ?? [];
  } else if (view === "inventory") {
    const catalogResult = await db.from("ppe_catalog").select("id,code,name,status").eq("organization_id", organizationId).order("name");
    catalogOptions = catalogResult.data ?? [];
    const inventoryResult = await applySite(db.from("ppe_inventory").select("*", { count: "exact" }).eq("organization_id", organizationId).order("updated_at", { ascending: false }), site).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    inventory = inventoryResult.data ?? [];
    inventoryCount = inventoryResult.count ?? 0;
    if (manage) versions = (await db.from("document_versions").select("id,original_name").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(80)).data ?? [];
  } else if (view === "assignments") {
    let assignmentQuery = applySite(db.from("ppe_assignments").select("*", { count: "exact" }).eq("organization_id", organizationId).order("assigned_at", { ascending: false }), site);
    if (assignmentStatus !== "all") assignmentQuery = assignmentQuery.eq("status", assignmentStatus);
    const [assignmentResult, catalogResult, memberResult, inventoryResult, versionResult] = await Promise.all([
      assignmentQuery.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
      db.from("ppe_catalog").select("id,code,name,status,useful_life_days").eq("organization_id", organizationId).order("name"),
      manage ? db.from("organization_members").select("id,user_id").eq("organization_id", organizationId).eq("status", "active").order("created_at") : Promise.resolve({ data: [] }),
      validate ? applySite(db.from("ppe_inventory").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }), site) : Promise.resolve({ data: [] }),
      validate ? db.from("document_versions").select("id,original_name").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(80) : Promise.resolve({ data: [] }),
    ]);
    assignments = assignmentResult.data ?? [];
    assignmentCount = assignmentResult.count ?? 0;
    catalogOptions = catalogResult.data ?? [];
    catalog = catalogOptions;
    members = memberResult.data ?? [];
    inventory = inventoryResult.data ?? [];
    versions = versionResult.data ?? [];
    const userIds = members.map((item: any) => item.user_id);
    profiles = userIds.length ? (await db.from("profiles").select("id,first_name,middle_name,last_name,second_last_name").in("id", userIds)).data ?? [] : [];
    const assignmentIds = assignments.map((item: any) => item.id);
    const [deliveryResult, inspectionResult, retirementResult] = await Promise.all([
      assignmentIds.length ? db.from("ppe_deliveries").select("*").eq("organization_id", organizationId).in("ppe_assignment_id", assignmentIds).order("delivered_at", { ascending: false }) : Promise.resolve({ data: [] }),
      assignmentIds.length ? db.from("ppe_inspections").select("*").eq("organization_id", organizationId).in("ppe_assignment_id", assignmentIds).order("inspected_at", { ascending: false }) : Promise.resolve({ data: [] }),
      assignmentIds.length ? db.from("ppe_retirements").select("*").eq("organization_id", organizationId).in("ppe_assignment_id", assignmentIds).order("retired_at", { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    deliveries = deliveryResult.data ?? [];
    inspections = inspectionResult.data ?? [];
    retirements = retirementResult.data ?? [];
  } else if (view === "history") {
    const assignmentResult = await applySite(db.from("ppe_assignments").select("id,ppe_catalog_id,site_id").eq("organization_id", organizationId), site);
    const inventoryResult = await applySite(db.from("ppe_inventory").select("id,ppe_catalog_id,site_id,size_label").eq("organization_id", organizationId), site);
    assignments = assignmentResult.data ?? [];
    inventory = inventoryResult.data ?? [];
    const assignmentIds = assignments.map((item: any) => item.id);
    const inventoryIds = inventory.map((item: any) => item.id);
    const limit = page * PAGE_SIZE + 1;
    const [movementResult, deliveryResult, inspectionResult, retirementResult] = await Promise.all([
      historyType === "all" || historyType === "movement" ? inventoryIds.length ? db.from("ppe_inventory_movements").select("*").eq("organization_id", organizationId).in("inventory_id", inventoryIds).order("created_at", { ascending: false }).limit(limit) : Promise.resolve({ data: [] }) : Promise.resolve({ data: [] }),
      historyType === "all" || historyType === "delivery" ? assignmentIds.length ? db.from("ppe_deliveries").select("*").eq("organization_id", organizationId).in("ppe_assignment_id", assignmentIds).order("delivered_at", { ascending: false }).limit(limit) : Promise.resolve({ data: [] }) : Promise.resolve({ data: [] }),
      historyType === "all" || historyType === "inspection" ? assignmentIds.length ? db.from("ppe_inspections").select("*").eq("organization_id", organizationId).in("ppe_assignment_id", assignmentIds).order("inspected_at", { ascending: false }).limit(limit) : Promise.resolve({ data: [] }) : Promise.resolve({ data: [] }),
      historyType === "all" || historyType === "retirement" ? assignmentIds.length ? db.from("ppe_retirements").select("*").eq("organization_id", organizationId).in("ppe_assignment_id", assignmentIds).order("retired_at", { ascending: false }).limit(limit) : Promise.resolve({ data: [] }) : Promise.resolve({ data: [] }),
    ]);
    movements = movementResult.data ?? [];
    deliveries = deliveryResult.data ?? [];
    inspections = inspectionResult.data ?? [];
    retirements = retirementResult.data ?? [];
    const catalogIds = [...new Set([...assignments.map((item: any) => item.ppe_catalog_id), ...inventory.map((item: any) => item.ppe_catalog_id)])];
    catalog = catalogIds.length ? (await db.from("ppe_catalog").select("id,name,code").eq("organization_id", organizationId).in("id", catalogIds)).data ?? [] : [];
    const catalogName = (id: string) => catalog.find((item: any) => item.id === id)?.name ?? "Elemento";
    const assignmentName = (id: string) => catalogName(assignments.find((item: any) => item.id === id)?.ppe_catalog_id);
    const inventoryName = (id: string) => catalogName(inventory.find((item: any) => item.id === id)?.ppe_catalog_id);
    history = [
      ...movements.map((item: any) => ({ id: `movement-${item.id}`, type: "Movimiento", occurredAt: item.created_at, title: inventoryName(item.inventory_id), description: `${movementLabels[item.movement_type] ?? "Movimiento"}: ${item.quantity_delta > 0 ? "+" : ""}${item.quantity_delta} unidades` })),
      ...deliveries.map((item: any) => ({ id: `delivery-${item.id}`, type: "Entrega", occurredAt: item.delivered_at, title: assignmentName(item.ppe_assignment_id), description: `${deliveryLabels[item.delivery_kind] ?? "Entrega"}: ${item.quantity} unidades`, status: item.accepted_at ? "accepted" : "pending" })),
      ...inspections.map((item: any) => ({ id: `inspection-${item.id}`, type: "Inspección", occurredAt: item.inspected_at, title: assignmentName(item.ppe_assignment_id), description: item.notes || "Inspección registrada", status: item.status })),
      ...retirements.map((item: any) => ({ id: `retirement-${item.id}`, type: "Retiro", occurredAt: item.retired_at, title: assignmentName(item.ppe_assignment_id), description: item.reason, status: "retired" })),
    ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    const start = (page - 1) * PAGE_SIZE;
    historyHasNext = history.length > start + PAGE_SIZE || [movements, deliveries, inspections, retirements].some((items) => items.length === limit);
    history = history.slice(start, start + PAGE_SIZE);
  }

  const catalogName = (id: string) => (catalogOptions.length ? catalogOptions : catalog).find((item: any) => item.id === id)?.name ?? "Elemento";
  const siteName = (id: string | null) => id ? sites.find((item: any) => item.id === id)?.name ?? "Sede" : "Bodega general";
  const memberName = (member: any) => displayPersonName(profiles.find((profile: any) => profile.id === member?.user_id), "Persona con acceso restringido");
  const contextFields = () => <><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="return_view" value={view} /><input type="hidden" name="return_site" value={site ?? ""} /></>;
  const filterContext = <><input type="hidden" name="view" value={view} />{site ? <input type="hidden" name="site" value={site} /> : null}</>;
  const evidenceFields = () => <><label className="grid gap-1.5 text-sm font-medium">Evidencia existente<Select name="evidence_document_version_id" defaultValue=""><option value="">Sin evidencia existente</option>{versions.map((version: any) => <option key={version.id} value={version.id}>{version.original_name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Cargar evidencia<Input name="evidence_file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" /></label></>;
  const lowStock = inventory.filter((item: any) => item.reorder_point !== null && item.quantity_on_hand <= item.reorder_point);
  const activeAssignments = assignments.filter((item: any) => item.status === "active");
  // The server request time is needed to classify replacement dates.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const replacementAssignments = assignments.filter((item: any) => item.replacement_required || (item.life_expires_at && new Date(`${item.life_expires_at}T00:00:00Z`).getTime() < now));
  const pendingDeliveries = deliveries.filter((item: any) => !item.accepted_at);

  const siteSelector = <form method="get" className="flex flex-wrap items-end gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]"><input type="hidden" name="view" value={view} /><label className="grid min-w-[min(100%,18rem)] gap-1.5 text-sm font-medium">Sede<Select name="site" defaultValue={site ?? ""}><option value="">Todas las sedes</option><option value="general">Bodega general</option>{sites.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label><Button variant="secondary">Cambiar sede</Button><p className="ml-auto self-center text-sm text-[var(--muted)]">{view === "catalog" ? "El catálogo es corporativo y no cambia por sede." : site ? `Mostrando ${site === "general" ? "Bodega general" : siteName(site)}.` : "Vista consolidada de la organización."}</p></form>;

  if (workerMode) {
    return <main className="grid gap-6">
      <PageHeader eyebrow="Uso personal" title="Mis EPP" description="Consulta tus elementos asignados y confirma las entregas que recibiste." />
      <StatusBanner status={filters.notice} />
      <section className="grid gap-4" aria-labelledby="my-ppe-heading">
        <div><h2 id="my-ppe-heading" className="text-lg font-semibold tracking-[-0.018em]">Elementos asignados</h2><p className="mt-1 text-sm text-[var(--muted)]">Solo se muestran tus asignaciones y entregas.</p></div>
        {pendingDeliveries.length ? <aside className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--warning)]/25 bg-[var(--warning-soft)] px-4 py-3"><div><p className="text-sm font-semibold">Tienes {pendingDeliveries.length} {pendingDeliveries.length === 1 ? "entrega pendiente" : "entregas pendientes"}</p><p className="mt-1 text-xs text-[var(--warning)]">Confirma únicamente los elementos que recibiste.</p></div><ClockCounterClockwise size={20} className="text-[var(--warning)]" aria-hidden /></aside> : null}
        {assignments.length ? <div className="grid gap-3">{assignments.map((assignment: any) => { const itemDeliveries = deliveries.filter((item: any) => item.ppe_assignment_id === assignment.id); return <details key={assignment.id} className="group overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"><summary className="grid cursor-pointer list-none gap-3 px-5 py-4 outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{catalogName(assignment.ppe_catalog_id)}</p><StatusBadge>{assignment.status}</StatusBadge>{assignment.replacement_required ? <StatusBadge>needs_replacement</StatusBadge> : null}</div><p className="mt-1 text-xs text-[var(--muted)]">{siteName(assignment.site_id)}. Talla {assignment.size_label || "no aplica"}. Vigencia {displayDate(assignment.life_expires_at)}</p></div><span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">Ver entregas<CaretDown size={15} className="transition-transform group-open:rotate-180" /></span></summary><div className="border-t border-[var(--border)] p-5">{itemDeliveries.length ? <div className="grid gap-2">{itemDeliveries.map((delivery: any) => <article key={delivery.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[var(--muted-surface)] px-3 py-3"><div><p className="text-sm font-medium">{deliveryLabels[delivery.delivery_kind] ?? "Entrega"}. {delivery.quantity} unidades</p><p className="mt-1 text-xs text-[var(--muted)]">{displayDateTime(delivery.delivered_at)}</p></div>{delivery.accepted_at ? <StatusBadge>accepted</StatusBadge> : <form action={acceptPpeDelivery}>{contextFields()}<input type="hidden" name="delivery_id" value={delivery.id} /><Button size="sm"><CheckCircle size={15} />Aceptar entrega</Button></form>}</article>)}</div> : <p className="text-sm text-[var(--muted)]">Aún no hay entregas registradas para esta asignación.</p>}</div></details>; })}</div> : <EmptyState icon={<HardHat size={20} />} title="No tienes EPP asignados" description="Cuando el responsable registre una asignación aparecerá en este espacio." />}
        <Pagination organizationId={organizationId} site={site} view="assignments" page={page} hasPrevious={page > 1} hasNext={workerHasNext} />
      </section>
    </main>;
  }

  return <main className="grid gap-6">
    <PageHeader eyebrow="Operación preventiva" title="Elementos de protección personal" description="Controla catálogo, existencias, entregas e inspecciones desde un espacio organizado por tarea." />
    <StatusBanner status={filters.notice} />
    {siteSelector}
    <PpeTabs organizationId={organizationId} site={site} current={view} />

    {view === "summary" ? <section aria-labelledby="ppe-summary" className="grid gap-5">
      <div><h2 id="ppe-summary" className="text-lg font-semibold tracking-[-0.018em]">Estado operativo</h2><p className="mt-1 text-sm text-[var(--muted)]">Existencias y asignaciones que requieren atención.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Unidades disponibles" value={inventory.reduce((total: number, item: any) => total + Number(item.quantity_on_hand ?? 0), 0)} description="Stock del alcance seleccionado" icon={<Package size={19} />} href={ppeHref(organizationId, site, "inventory")} actionLabel="Ver inventario" /><KpiCard label="Stock bajo" value={lowStock.length} description="Ubicaciones en punto de reposición" icon={<Warning size={19} />} href={ppeHref(organizationId, site, "inventory")} actionLabel="Atender alertas" /><KpiCard label="Asignaciones activas" value={activeAssignments.length} description="Elementos bajo responsabilidad" icon={<HardHat size={19} />} href={ppeHref(organizationId, site, "assignments")} actionLabel="Ver asignaciones" /><KpiCard label="Reposición requerida" value={replacementAssignments.length} description="Por inspección o vencimiento" icon={<ClockCounterClockwise size={19} />} href={ppeHref(organizationId, site, "assignments", { status: "active" })} actionLabel="Revisar reposiciones" /></div>
      <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]"><Card><CardHeader><CardTitle>Atención requerida</CardTitle></CardHeader><CardContent className="p-0">{lowStock.length || replacementAssignments.length || pendingDeliveries.length ? <div className="divide-y divide-[var(--border)]">{lowStock.slice(0, 4).map((item: any) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"><div><p className="text-sm font-semibold">{catalogName(item.ppe_catalog_id)}</p><p className="mt-1 text-xs text-[var(--muted)]">{siteName(item.site_id)}. {item.quantity_on_hand} disponibles.</p></div><StatusBadge>needs_replacement</StatusBadge></article>)}{replacementAssignments.slice(0, 4).map((item: any) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"><div><p className="text-sm font-semibold">{catalogName(item.ppe_catalog_id)}</p><p className="mt-1 text-xs text-[var(--muted)]">Asignación con reposición pendiente.</p></div><StatusBadge>needs_replacement</StatusBadge></article>)}{pendingDeliveries.length ? <Link href={ppeHref(organizationId, site, "assignments")} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm font-semibold"><span>{pendingDeliveries.length} entregas esperan aceptación</span><span className="text-[var(--brand)]">Revisar</span></Link> : null}</div> : <div className="px-5 py-9 text-center"><p className="font-semibold">Sin alertas operativas</p><p className="mt-1 text-sm text-[var(--muted)]">El inventario y las asignaciones no requieren intervención.</p></div>}</CardContent></Card><Card><CardHeader><CardTitle>Actividad reciente</CardTitle></CardHeader><CardContent className="p-0">{deliveries.length || movements.length ? <div className="divide-y divide-[var(--border)]">{[...deliveries.map((item: any) => ({ id: `d-${item.id}`, date: item.delivered_at, title: deliveryLabels[item.delivery_kind] ?? "Entrega", detail: `${item.quantity} unidades`, status: item.accepted_at ? "accepted" : "pending" })), ...movements.map((item: any) => ({ id: `m-${item.id}`, date: item.created_at, title: movementLabels[item.movement_type] ?? "Movimiento", detail: `${item.quantity_delta > 0 ? "+" : ""}${item.quantity_delta} unidades` }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6).map((item: any) => <article key={item.id} className="flex items-center justify-between gap-3 px-5 py-3.5"><div><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.detail}. {displayDateTime(item.date)}</p></div>{item.status ? <StatusBadge>{item.status}</StatusBadge> : null}</article>)}</div> : <div className="px-5 py-9 text-center"><p className="font-semibold">Sin actividad reciente</p><p className="mt-1 text-sm text-[var(--muted)]">Los movimientos y entregas aparecerán aquí.</p></div>}</CardContent></Card></div>
    </section> : null}

    {view === "catalog" ? <section aria-labelledby="catalog-heading" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="catalog-heading" className="text-lg font-semibold tracking-[-0.018em]">Catálogo corporativo</h2><p className="mt-1 text-sm text-[var(--muted)]">Define los elementos y su relación con peligros y controles.</p></div>{manage ? <FormDrawer triggerLabel="Nuevo elemento" title="Crear elemento de protección" description="Registra la referencia corporativa y su vida útil."><form action={createPpeCatalog} className="grid gap-4">{contextFields()}<label className="grid gap-1.5 text-sm font-medium">Código<Input name="code" placeholder="CASCO-01" required /></label><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="name" required /></label><label className="grid gap-1.5 text-sm font-medium">Categoría<Input name="category" required /></label><label className="grid gap-1.5 text-sm font-medium">Vida útil en días<Input name="useful_life_days" type="number" min="1" /></label><label className="grid gap-1.5 text-sm font-medium">Descripción<Textarea name="description" /></label><label className="grid gap-1.5 text-sm font-medium">Peligro asociado<Select name="hazard_id"><option value="">Sin peligro asociado</option>{hazards.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Control asociado<Select name="risk_control_id"><option value="">Sin control asociado</option>{controls.map((item: any) => <option key={item.id} value={item.id}>{item.description}</option>)}</Select></label><Button>Crear elemento</Button></form></FormDrawer> : null}</div>
      <form className="grid gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">{filterContext}<Input name="q" defaultValue={q} placeholder="Buscar por nombre" aria-label="Buscar elemento" /><Select name="status" defaultValue={filters.status ?? "all"} aria-label="Estado del catálogo"><option value="all">Todos los estados</option><option value="active">Activos</option><option value="draft">Borradores</option><option value="archived">Archivados</option></Select><Button variant="secondary">Aplicar filtros</Button></form>
      <Card><CardContent className="p-0">{catalog.length ? <div className="divide-y divide-[var(--border)]">{catalog.map((item: any) => { const hazardsCount = catalogLinks.filter((link: any) => link.ppe_catalog_id === item.id).length; const controlsCount = controlLinks.filter((link: any) => link.ppe_catalog_id === item.id).length; return <article key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-semibold text-[var(--brand)]">{item.code}</span><p className="font-semibold">{item.name}</p><StatusBadge>{item.status}</StatusBadge></div><p className="mt-1 text-sm text-[var(--muted)]">{item.category}. Vida útil {item.useful_life_days ? `${item.useful_life_days} días` : "sin definir"}.</p>{item.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{item.description}</p> : null}</div><div className="text-right text-xs text-[var(--muted)]"><p>{hazardsCount} {hazardsCount === 1 ? "peligro vinculado" : "peligros vinculados"}</p><p className="mt-1">{controlsCount} {controlsCount === 1 ? "control vinculado" : "controles vinculados"}</p></div></article>; })}</div> : <div className="p-5"><EmptyState icon={<HardHat size={20} />} title="No hay elementos en esta vista" description={q || filters.status ? "Cambia los filtros para ampliar los resultados." : "Crea el primer elemento del catálogo corporativo."} /></div>}</CardContent></Card>
      <Pagination organizationId={organizationId} site={site} view="catalog" page={page} hasPrevious={page > 1} hasNext={page * PAGE_SIZE < catalogCount} filters={{ q, status: filters.status }} />
    </section> : null}

    {view === "inventory" ? <section aria-labelledby="inventory-heading" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="inventory-heading" className="text-lg font-semibold tracking-[-0.018em]">Inventario por ubicación</h2><p className="mt-1 text-sm text-[var(--muted)]">Consulta existencias, tallas y puntos de reposición.</p></div>{manage ? <div className="flex flex-wrap gap-2"><FormDrawer triggerLabel="Nueva ubicación" title="Crear ubicación de inventario" description="Define dónde se controla el stock de un elemento." variant="secondary" disabled={!catalogOptions.length}><form action={createPpeInventory} className="grid gap-4">{contextFields()}<label className="grid gap-1.5 text-sm font-medium">Elemento<Select name="ppe_catalog_id">{catalogOptions.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Ubicación<Select name="site_id" defaultValue={site === "general" || !site ? "" : site}><option value="">Bodega general</option>{sites.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Talla<Input name="size_label" /></label><label className="grid gap-1.5 text-sm font-medium">Punto de reposición<Input name="reorder_point" type="number" min="0" /></label><Button>Crear ubicación</Button></form></FormDrawer><FormDrawer triggerLabel="Registrar movimiento" title="Entrada o ajuste de stock" description="Registra compras, devoluciones o ajustes autorizados." disabled={!inventory.length}><form action={recordPpeInventoryMovement} className="grid gap-4">{contextFields()}<label className="grid gap-1.5 text-sm font-medium">Ubicación<Select name="inventory_id">{inventory.map((item: any) => <option key={item.id} value={item.id}>{catalogName(item.ppe_catalog_id)}. {item.size_label || "Sin talla"}. {item.quantity_on_hand} disponibles</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Tipo<Select name="movement_type"><option value="purchase">Compra</option><option value="return">Devolución</option><option value="adjustment">Ajuste</option></Select></label><label className="grid gap-1.5 text-sm font-medium">Cantidad<Input name="quantity" type="number" required /></label><label className="grid gap-1.5 text-sm font-medium">Motivo o referencia<Textarea name="note" /></label><label className="grid gap-1.5 text-sm font-medium">Evidencia existente<Select name="evidence_document_version_id"><option value="">Sin evidencia</option>{versions.map((item: any) => <option key={item.id} value={item.id}>{item.original_name}</option>)}</Select></label><Button>Registrar movimiento</Button></form></FormDrawer></div> : null}</div>
      <Card><CardContent className="p-0">{inventory.length ? <div className="divide-y divide-[var(--border)]">{inventory.map((item: any) => { const alert = item.reorder_point !== null && item.quantity_on_hand <= item.reorder_point; return <article key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{catalogName(item.ppe_catalog_id)}</p>{alert ? <StatusBadge>needs_replacement</StatusBadge> : null}</div><p className="mt-1 text-sm text-[var(--muted)]">{siteName(item.site_id)}. Talla {item.size_label || "no aplica"}.</p></div><div className="sm:text-right"><p className="font-mono text-xl font-semibold tabular-nums">{item.quantity_on_hand}</p><p className="mt-1 text-xs text-[var(--muted)]">Punto de reposición {item.reorder_point ?? "sin definir"}</p></div></article>; })}</div> : <div className="p-5"><EmptyState icon={<Package size={20} />} title="No hay inventario en esta vista" description="Crea una ubicación para comenzar a controlar existencias." /></div>}</CardContent></Card>
      <Pagination organizationId={organizationId} site={site} view="inventory" page={page} hasPrevious={page > 1} hasNext={page * PAGE_SIZE < inventoryCount} />
    </section> : null}

    {view === "assignments" ? <section aria-labelledby="assignments-heading" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 id="assignments-heading" className="text-lg font-semibold tracking-[-0.018em]">Asignaciones y seguimiento</h2><p className="mt-1 text-sm text-[var(--muted)]">Entrega, inspecciona y retira elementos desde el registro del trabajador.</p></div>{manage ? <FormDrawer triggerLabel="Nueva asignación" title="Asignar EPP a trabajador" description="Define el elemento, talla, sede y fecha esperada de reposición." disabled={!members.length || !catalogOptions.length}><form action={createPpeAssignment} className="grid gap-4">{contextFields()}<label className="grid gap-1.5 text-sm font-medium">Trabajador<Select name="organization_member_id">{members.map((item: any) => <option key={item.id} value={item.id}>{memberName(item)}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Elemento<Select name="ppe_catalog_id">{catalogOptions.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Sede<Select name="site_id" defaultValue={site === "general" || !site ? "" : site}><option value="">Sin sede</option>{sites.map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Talla<Input name="size_label" /></label><label className="grid gap-1.5 text-sm font-medium">Reposición esperada<Input name="expected_replacement_at" type="date" /></label><Button>Crear asignación</Button></form></FormDrawer> : null}</div>
      <form className="grid gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-[14rem_auto]">{filterContext}<Select name="status" defaultValue={assignmentStatus} aria-label="Estado de asignación"><option value="active">Activas</option><option value="retired">Retiradas</option><option value="all">Todas</option></Select><Button variant="secondary">Aplicar filtro</Button></form>
      {assignments.length ? <div className="grid gap-3">{assignments.map((assignment: any) => { const assignedMember = members.find((item: any) => item.id === assignment.organization_member_id); const itemDeliveries = deliveries.filter((item: any) => item.ppe_assignment_id === assignment.id); const itemInspections = inspections.filter((item: any) => item.ppe_assignment_id === assignment.id); const retirement = retirements.find((item: any) => item.ppe_assignment_id === assignment.id); const latestInspection = itemInspections[0]; const due = assignment.life_expires_at && new Date(`${assignment.life_expires_at}T00:00:00Z`).getTime() < now; const availableInventory = inventory.filter((item: any) => item.ppe_catalog_id === assignment.ppe_catalog_id && item.size_label === assignment.size_label && (item.site_id === assignment.site_id || item.site_id === null) && item.quantity_on_hand > 0); return <details key={assignment.id} className="group overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"><summary className="grid cursor-pointer list-none gap-3 px-5 py-4 outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{catalogName(assignment.ppe_catalog_id)}</p><StatusBadge>{assignment.status}</StatusBadge>{assignment.replacement_required || due ? <StatusBadge>needs_replacement</StatusBadge> : null}</div><p className="mt-1 text-sm text-[var(--muted)]">{assignedMember ? memberName(assignedMember) : "Trabajador"}. {siteName(assignment.site_id)}. Talla {assignment.size_label || "no aplica"}.</p></div><div className="flex items-center gap-4"><p className="hidden text-right text-xs text-[var(--muted)] sm:block">{itemDeliveries.length} entregas<br />{itemInspections.length} inspecciones</p><span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">Ver detalle<CaretDown size={15} className="transition-transform group-open:rotate-180" /></span></div></summary><div className="grid gap-5 border-t border-[var(--border)] p-5"><div className="grid gap-3 sm:grid-cols-3"><div><p className="text-xs font-medium text-[var(--muted)]">Vigencia</p><p className="mt-1 text-sm font-semibold">{displayDate(assignment.life_expires_at)}</p></div><div><p className="text-xs font-medium text-[var(--muted)]">Última inspección</p><p className="mt-1 text-sm font-semibold">{latestInspection ? displayDate(latestInspection.inspected_at) : "Sin inspección"}</p></div><div><p className="text-xs font-medium text-[var(--muted)]">Retiro</p><p className="mt-1 text-sm font-semibold">{retirement ? displayDate(retirement.retired_at) : "No retirado"}</p></div></div>{validate && assignment.status === "active" ? <div className="flex flex-wrap gap-2"><FormDrawer triggerLabel="Registrar entrega" title={`Entrega de ${catalogName(assignment.ppe_catalog_id)}`} description="Descuenta existencias y deja trazabilidad de la entrega." variant="secondary" disabled={!availableInventory.length}><form action={deliverPpe} className="grid gap-4">{contextFields()}<input type="hidden" name="assignment_id" value={assignment.id} /><label className="grid gap-1.5 text-sm font-medium">Inventario<Select name="inventory_id">{availableInventory.map((item: any) => <option key={item.id} value={item.id}>{siteName(item.site_id)}. {item.quantity_on_hand} disponibles</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Cantidad<Input name="quantity" type="number" min="1" required /></label><label className="grid gap-1.5 text-sm font-medium">Tipo<Select name="delivery_kind"><option value={itemDeliveries.length ? "replacement" : "initial"}>{itemDeliveries.length ? "Reposición" : "Entrega inicial"}</option></Select></label>{evidenceFields()}<Button>Registrar entrega</Button></form></FormDrawer><FormDrawer triggerLabel="Inspeccionar" title={`Inspección de ${catalogName(assignment.ppe_catalog_id)}`} description="Registra el resultado y determina si requiere reposición." variant="secondary"><form action={inspectPpe} className="grid gap-4">{contextFields()}<input type="hidden" name="assignment_id" value={assignment.id} /><label className="grid gap-1.5 text-sm font-medium">Resultado<Select name="status"><option value="suitable">Apto</option><option value="needs_replacement">Requiere reposición</option><option value="failed">No apto</option></Select></label><label className="grid gap-1.5 text-sm font-medium">Observaciones<Textarea name="notes" /></label>{evidenceFields()}<Button>Guardar inspección</Button></form></FormDrawer><FormDrawer triggerLabel="Dar de baja" title={`Retirar ${catalogName(assignment.ppe_catalog_id)}`} description="El retiro conserva la asignación y su historial." variant="secondary"><form action={retirePpe} className="grid gap-4">{contextFields()}<input type="hidden" name="assignment_id" value={assignment.id} /><label className="grid gap-1.5 text-sm font-medium">Motivo<Textarea name="reason" required /></label>{evidenceFields()}<Button variant="danger">Confirmar retiro</Button></form></FormDrawer></div> : null}<div><h3 className="text-sm font-semibold">Entregas</h3>{itemDeliveries.length ? <div className="mt-2 grid gap-2">{itemDeliveries.map((delivery: any) => <article key={delivery.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[var(--muted-surface)] px-3 py-3"><div><p className="text-sm font-medium">{deliveryLabels[delivery.delivery_kind] ?? "Entrega"}. {delivery.quantity} unidades.</p><p className="mt-1 text-xs text-[var(--muted)]">{displayDateTime(delivery.delivered_at)}</p></div><div className="flex items-center gap-2"><StatusBadge>{delivery.accepted_at ? "accepted" : "pending"}</StatusBadge>{!delivery.accepted_at && assignment.organization_member_id === membership?.id ? <form action={acceptPpeDelivery}>{contextFields()}<input type="hidden" name="delivery_id" value={delivery.id} /><Button size="sm">Aceptar</Button></form> : null}</div></article>)}</div> : <p className="mt-2 text-sm text-[var(--muted)]">Aún no hay entregas registradas.</p>}</div></div></details>; })}</div> : <EmptyState icon={<HardHat size={20} />} title="No hay asignaciones en esta vista" description="Cambia el filtro o crea una asignación para un trabajador activo." />}
      <Pagination organizationId={organizationId} site={site} view="assignments" page={page} hasPrevious={page > 1} hasNext={page * PAGE_SIZE < assignmentCount} filters={{ status: assignmentStatus }} />
    </section> : null}

    {view === "history" ? <section aria-labelledby="history-heading" className="grid gap-4">
      <div><h2 id="history-heading" className="text-lg font-semibold tracking-[-0.018em]">Historial operativo</h2><p className="mt-1 text-sm text-[var(--muted)]">Movimientos, entregas, inspecciones y retiros ordenados por fecha.</p></div>
      <form className="grid gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-[14rem_auto]">{filterContext}<Select name="type" defaultValue={historyType} aria-label="Tipo de evento"><option value="all">Todos los eventos</option><option value="movement">Movimientos</option><option value="delivery">Entregas</option><option value="inspection">Inspecciones</option><option value="retirement">Retiros</option></Select><Button variant="secondary">Aplicar filtro</Button></form>
      <Card><CardContent className="p-0">{history.length ? <div className="divide-y divide-[var(--border)]">{history.map((event) => <article key={event.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"><p className="text-xs font-semibold text-[var(--muted)]">{event.type}</p><div><p className="text-sm font-semibold">{event.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{event.description}. {displayDateTime(event.occurredAt)}</p></div>{event.status ? <StatusBadge>{event.status}</StatusBadge> : null}</article>)}</div> : <div className="p-5"><EmptyState icon={<ClockCounterClockwise size={20} />} title="No hay eventos en esta vista" description="Los movimientos y seguimientos aparecerán cuando se registren operaciones." /></div>}</CardContent></Card>
      <Pagination organizationId={organizationId} site={site} view="history" page={page} hasPrevious={page > 1} hasNext={historyHasNext} filters={{ type: historyType }} />
    </section> : null}
  </main>;
}
