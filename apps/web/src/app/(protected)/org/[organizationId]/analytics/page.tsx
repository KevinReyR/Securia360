/* eslint-disable @typescript-eslint/no-explicit-any */
import { Archive, Calculator, ChartLineUp, FileText, ListChecks } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AnalysisNav } from "@/components/analysis-nav";
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
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { archiveIndicatorCatalog, createIndicatorCatalog, createIndicatorVersion, requestCalculation, updateIndicatorVersionStatus } from "@/modules/analytics/actions";
import { indicatorTemplates } from "@/modules/analytics/schemas";

const PAGE_SIZE = 20;
const periodicityLabels: Record<string, string> = { daily: "Diaria", weekly: "Semanal", monthly: "Mensual", quarterly: "Trimestral", yearly: "Anual" };
const directionLabels: Record<string, string> = { at_least: "Al menos", at_most: "Como máximo", exact: "Exactamente" };
const dateLabel = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`)) : "Sin fecha";

export default async function AnalyticsPage({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { organizationId } = await params;
  const query = await searchParams;
  const text = typeof query.q === "string" ? query.q.slice(0, 120) : "";
  const periodStart = typeof query.period_start === "string" ? query.period_start : "";
  const periodEnd = typeof query.period_end === "string" ? query.period_end : "";
  const legalEntityId = typeof query.legal_entity_id === "string" ? query.legal_entity_id : "";
  const siteId = typeof query.site_id === "string" ? query.site_id : "";
  const notice = typeof query.status === "string" ? query.status : undefined;
  const page = Math.max(1, Number(typeof query.page === "string" ? query.page : "1") || 1);
  const { supabase } = await requireAuthenticatedUser();
  const db = supabase as any;
  const [read, manage, approve] = await Promise.all([
    can(organizationId, "analytics.read"),
    can(organizationId, "analytics.manage"),
    can(organizationId, "analytics.approve"),
  ]);
  if (!read) return <EmptyState title="Sin acceso a indicadores" description="Solicita acceso al responsable de tu organización." />;

  let resultQuery = db.from("indicator_results")
    .select("*, indicator_versions(formula_description, periodicity, source_config, version_number, indicator_catalog(id, name, code))", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("period_end", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (periodStart) resultQuery = resultQuery.gte("period_start", periodStart);
  if (periodEnd) resultQuery = resultQuery.lte("period_end", periodEnd);
  if (legalEntityId) resultQuery = resultQuery.eq("legal_entity_id", legalEntityId);
  if (siteId) resultQuery = resultQuery.eq("site_id", siteId);

  const [catalogR, versionsR, resultsR, liveR, legalEntitiesR, sitesR, membersR] = await Promise.all([
    db.from("indicator_catalog").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
    db.from("indicator_versions").select("*").eq("organization_id", organizationId).order("indicator_id").order("version_number", { ascending: false }).limit(200),
    resultQuery,
    db.from("management_dashboard_metrics").select("*").eq("organization_id", organizationId).maybeSingle(),
    db.from("legal_entities").select("id,legal_name").eq("organization_id", organizationId).eq("status", "active").order("legal_name"),
    db.from("sites").select("id,name,legal_entity_id").eq("organization_id", organizationId).eq("status", "active").order("name"),
    db.from("organization_members").select("user_id").eq("organization_id", organizationId).eq("status", "active"),
  ]);
  const catalog = catalogR.data ?? [];
  const versions = versionsR.data ?? [];
  const results = resultsR.data ?? [];
  const memberIds = (membersR.data ?? []).map((member: any) => member.user_id);
  const { data: memberProfiles } = memberIds.length ? await db.from("profiles").select("id,first_name,last_name").in("id", memberIds) : { data: [] };
  const memberNames = new Map<string, string>((memberProfiles ?? []).map((profile: any) => [String(profile.id), [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Persona sin nombre"]));
  const hidden = <input type="hidden" name="organizationId" value={organizationId} />;
  const filteredScope = Boolean(legalEntityId || siteId);
  const totalPages = Math.max(1, Math.ceil((resultsR.count ?? 0) / PAGE_SIZE));
  const activeCatalog = catalog.filter((item: any) => item.status === "active");
  const approvedVersions = versions.filter((item: any) => item.status === "approved");
  const filteredCatalog = catalog.filter((item: any) => !text || `${item.code} ${item.name}`.toLowerCase().includes(text.toLowerCase()));
  const pageHref = (targetPage: number) => {
    const values = new URLSearchParams();
    if (text) values.set("q", text);
    if (periodStart) values.set("period_start", periodStart);
    if (periodEnd) values.set("period_end", periodEnd);
    if (legalEntityId) values.set("legal_entity_id", legalEntityId);
    if (siteId) values.set("site_id", siteId);
    values.set("page", String(targetPage));
    return `?${values.toString()}`;
  };

  const catalogForm = <form action={createIndicatorCatalog} className="grid gap-4">{hidden}<label className="grid gap-1.5 text-sm font-medium">Código<Input name="code" placeholder="TAREAS_ABIERTAS" required /></label><label className="grid gap-1.5 text-sm font-medium">Nombre<Input name="name" placeholder="Tareas abiertas" required /></label><label className="grid gap-1.5 text-sm font-medium">Propósito<Textarea name="description" placeholder="Explica qué decisión ayuda a tomar" /></label><label className="grid gap-1.5 text-sm font-medium">Responsable<Select name="owner_user_id"><option value="">Sin responsable</option>{(membersR.data ?? []).map((member: any) => <option key={member.user_id} value={member.user_id}>{memberNames.get(member.user_id) ?? "Persona sin nombre"}</option>)}</Select></label><Button>Crear indicador</Button></form>;
  const versionForm = <form action={createIndicatorVersion} className="grid gap-4">{hidden}<label className="grid gap-1.5 text-sm font-medium">Indicador<Select name="indicator_id" required><option value="">Selecciona un indicador</option>{activeCatalog.map((item: any) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</Select></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Versión<Input name="version_number" type="number" min="1" defaultValue="1" required /></label><label className="grid gap-1.5 text-sm font-medium">Periodicidad<Select name="periodicity" defaultValue="monthly"><option value="daily">Diaria</option><option value="weekly">Semanal</option><option value="monthly">Mensual</option><option value="quarterly">Trimestral</option><option value="yearly">Anual</option></Select></label></div><label className="grid gap-1.5 text-sm font-medium">Fuente de cálculo<Select name="template">{Object.entries(indicatorTemplates).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Select></label><label className="grid gap-1.5 text-sm font-medium">Explicación de la fórmula<Textarea name="formula_description" placeholder="Describe el cálculo en lenguaje comprensible" required /></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Meta opcional<Input name="target_value" type="number" step="0.01" /></label><label className="grid gap-1.5 text-sm font-medium">Dirección<Select name="target_direction"><option value="at_least">Al menos</option><option value="at_most">Como máximo</option><option value="exact">Exactamente</option></Select></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Vigente desde<Input name="effective_from" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label className="grid gap-1.5 text-sm font-medium">Vigente hasta<Input name="effective_to" type="date" /></label></div><Button disabled={!activeCatalog.length}>Guardar borrador</Button></form>;

  return <main className="grid gap-7">
    <PageHeader eyebrow="Análisis gerencial" title="Indicadores" description="Consulta el estado actual y compáralo con cortes históricos calculados exclusivamente en el servidor." action={manage ? <FormDrawer triggerLabel="Nuevo indicador" title="Indicador gerencial" description="Define el propósito y responsable antes de configurar su cálculo.">{catalogForm}</FormDrawer> : undefined} />
    <AnalysisNav organizationId={organizationId} current="analytics" />
    <StatusBanner status={notice} />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Tareas abiertas" value={liveR.data?.open_tasks ?? "—"} icon={<ListChecks size={18} />} /><KpiCard label="Acciones abiertas" value={liveR.data?.open_actions ?? "—"} icon={<ChartLineUp size={18} />} /><KpiCard label="Documentos activos" value={liveR.data?.active_documents ?? "—"} icon={<FileText size={18} />} /><KpiCard label="Cortes históricos" value={resultsR.count ?? 0} icon={<Archive size={18} />} /></section>
    <aside className="rounded-[14px] border border-[var(--info-border)] bg-[var(--info-soft)] p-4 text-sm leading-6 text-[var(--info)]"><strong>Estado vivo e histórico son distintos.</strong> Las cifras superiores cambian con la operación actual. Cada resultado histórico conserva la versión, fórmula, meta y fecha exacta de cálculo.</aside>
    <Card><CardContent className="pt-5"><form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_repeat(4,minmax(9rem,12rem))_auto]"><Input name="q" placeholder="Buscar indicador" defaultValue={text} aria-label="Buscar indicador" /><Input name="period_start" type="date" defaultValue={periodStart} aria-label="Inicio del período" /><Input name="period_end" type="date" defaultValue={periodEnd} aria-label="Fin del período" /><Select name="legal_entity_id" defaultValue={legalEntityId} aria-label="Razón social"><option value="">Todas las razones sociales</option>{(legalEntitiesR.data ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.legal_name}</option>)}</Select><Select name="site_id" defaultValue={siteId} aria-label="Sede"><option value="">Todas las sedes</option>{(sitesR.data ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Button variant="secondary">Aplicar</Button></form></CardContent></Card>
    {filteredScope ? <EmptyState title="Sin desglose para este alcance" description="Las métricas iniciales se calculan a nivel de organización. Los filtros solo muestran históricos que fueron calculados para la razón social o sede seleccionada." /> : null}
    {manage ? <Card><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5"><div><p className="font-semibold">Versiones de cálculo</p><p className="mt-1 text-sm text-[var(--muted)]">Una versión aprobada queda inmutable y permite generar cortes reproducibles.</p></div><FormDrawer triggerLabel="Nueva versión" title="Versión de cálculo" description="Configura una plantilla segura y explicable; no se admite SQL ni fórmulas arbitrarias." variant="secondary" disabled={!activeCatalog.length}>{versionForm}</FormDrawer></CardContent></Card> : null}
    <section className="grid gap-3" aria-labelledby="indicator-catalog"><div className="flex items-center justify-between"><h2 id="indicator-catalog" className="text-lg font-semibold">Catálogo y versiones</h2><span className="text-xs text-[var(--muted)]">{activeCatalog.length} activos · {approvedVersions.length} versiones aprobadas</span></div>{filteredCatalog.length ? filteredCatalog.map((item: any) => <Card key={item.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{item.code} · {item.name}</CardTitle>{item.description ? <p className="mt-1 max-w-3xl text-sm text-[var(--muted)]">{item.description}</p> : null}</div><StatusBadge>{item.status}</StatusBadge></div></CardHeader><CardContent className="grid gap-3">{versions.filter((version: any) => version.indicator_id === item.id).map((version: any) => { const template = version.source_config?.template as keyof typeof indicatorTemplates; return <article key={version.id} className="rounded-[10px] border border-[var(--border)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">Versión {version.version_number} · {periodicityLabels[version.periodicity] ?? "Periodicidad definida"}</p><p className="mt-1 text-sm text-[var(--muted)]">{indicatorTemplates[template] ?? "Fuente no disponible"}</p></div><StatusBadge>{version.status}</StatusBadge></div><p className="mt-3 text-sm leading-6"><strong>Cómo se calcula:</strong> {version.formula_description}</p><p className="mt-1 text-sm text-[var(--muted)]"><strong>Meta:</strong> {version.target_value == null ? "Sin meta" : `${directionLabels[version.target_direction] ?? "Objetivo"} ${version.target_value}`} · vigente desde {dateLabel(version.effective_from)}</p><div className="mt-3 flex flex-wrap gap-2">{version.status === "draft" && approve ? <form action={updateIndicatorVersionStatus}>{hidden}<input type="hidden" name="id" value={version.id} /><input type="hidden" name="status" value="approved" /><Button size="sm">Aprobar versión</Button></form> : null}{version.status === "approved" && manage ? <FormDrawer triggerLabel="Generar corte" title={`Corte histórico · ${item.name}`} description="El resultado se calculará en el servidor y quedará asociado a esta versión." variant="secondary"><form action={requestCalculation} className="grid gap-4">{hidden}<input type="hidden" name="indicator_version_id" value={version.id} /><label className="grid gap-1.5 text-sm font-medium">Desde<Input name="period_start" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label className="grid gap-1.5 text-sm font-medium">Hasta<Input name="period_end" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><Button><Calculator size={17} />Calcular corte</Button></form></FormDrawer> : null}</div></article>; })}{manage && item.status === "active" ? <form action={archiveIndicatorCatalog}>{hidden}<input type="hidden" name="id" value={item.id} /><Button size="sm" variant="ghost">Archivar indicador</Button></form> : null}</CardContent></Card>) : <EmptyState title="No hay indicadores en esta vista" description={text ? "Cambia la búsqueda para ampliar los resultados." : "Crea el primer indicador y configura su versión de cálculo."} />}</section>
    <section className="grid gap-3" aria-labelledby="historical-results"><div className="flex items-center justify-between"><h2 id="historical-results" className="text-lg font-semibold">Resultados históricos</h2><span className="text-xs text-[var(--muted)]">Página {page} de {totalPages}</span></div>{results.length ? <div className="grid gap-3 lg:grid-cols-2">{results.map((result: any) => <Card key={result.id}><CardContent className="pt-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{result.indicator_versions?.indicator_catalog?.code} · {result.indicator_versions?.indicator_catalog?.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{dateLabel(result.period_start)} a {dateLabel(result.period_end)}</p></div><p className="font-mono text-3xl font-semibold tabular-nums">{result.value}</p></div><dl className="mt-4 grid gap-2 text-sm"><div><dt className="text-[var(--muted)]">Versión y meta</dt><dd>v{result.indicator_versions?.version_number} · {result.target_value == null ? "Sin meta" : `${directionLabels[result.target_direction_snapshot] ?? "Objetivo"} ${result.target_value}`}</dd></div><div><dt className="text-[var(--muted)]">Fórmula congelada</dt><dd>{result.formula_snapshot}</dd></div><div><dt className="text-[var(--muted)]">Momento del cálculo</dt><dd>{dateLabel(result.explanation?.measured_at ?? result.created_at)}</dd></div></dl></CardContent></Card>)}</div> : <EmptyState title="Sin resultados para el filtro" description="Aprueba una versión y genera un corte. Los resultados no se editan ni reemplazan." />}{totalPages > 1 ? <nav aria-label="Paginación de resultados" className="flex items-center justify-between"><Button asChild size="sm" variant="ghost" disabled={page <= 1}><Link href={pageHref(page - 1)}>Anterior</Link></Button><Button asChild size="sm" variant="ghost" disabled={page >= totalPages}><Link href={pageHref(page + 1)}>Siguiente</Link></Button></nav> : null}</section>
  </main>;
}
