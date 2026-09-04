/* eslint-disable @typescript-eslint/no-explicit-any */
import { CheckCircle, FileArrowUp, Rows, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AnalysisNav } from "@/components/analysis-nav";
import { EmptyState } from "@/components/empty-state";
import { FormDrawer } from "@/components/form-drawer";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { can } from "@/modules/auth/permissions";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { commitImport, rollbackImport, stageImport } from "@/modules/imports/actions";
import { targetLabels, templateColumns, type ImportTarget } from "@/modules/imports/schemas";

const targets = Object.keys(targetLabels) as ImportTarget[];
const columnLabels: Record<string, string> = {
  legal_name: "Razón social", tax_id: "NIT", trade_name: "Nombre comercial", ciiu_code: "Código CIIU", economic_activity: "Actividad económica", risk_class: "Clase de riesgo",
  name: "Nombre", code: "Código", legal_entity_tax_id: "NIT de la razón social", address: "Dirección", city: "Ciudad", department: "Departamento", site_code: "Código de sede",
  employee_code: "Código de trabajador", first_name: "Nombres", last_name: "Apellidos", work_email: "Correo laboral", area_code: "Código de área", status: "Estado",
};
const mappingFields = Object.keys(columnLabels);
const dateTime = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin fecha";

function normalizedFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).filter(([, fieldValue]) => fieldValue !== null && fieldValue !== "").map(([key, fieldValue]) => ({ label: columnLabels[key] ?? "Dato importado", value: String(fieldValue) }));
}

function validationMessages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((error) => {
    if (typeof error === "string") return error;
    if (error && typeof error === "object") {
      const item = error as { message?: unknown; path?: unknown; field?: unknown };
      const field = String(item.field ?? item.path ?? "Dato");
      return `${columnLabels[field] ?? field}: ${String(item.message ?? "valor no válido")}`;
    }
    return "Valor no válido";
  });
}

export default async function ImportsPage({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ status?: string; q?: string; state?: string; target?: string }>;
}) {
  const { organizationId } = await params;
  const filters = await searchParams;
  const { supabase } = await requireAuthenticatedUser();
  const db = supabase as any;
  const [read, manage, jobsR] = await Promise.all([
    can(organizationId, "imports.read"),
    can(organizationId, "imports.manage"),
    db.from("import_jobs").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
  ]);
  if (!read && !manage) return <EmptyState title="Sin acceso a importaciones" description="Solicita acceso al responsable de tu organización." />;
  const jobs = jobsR.data ?? [];
  const statusValue = filters.status ?? "";
  const previewId = statusValue.startsWith("preview-") ? statusValue.slice(8) : statusValue.startsWith("reused-") ? statusValue.slice(7) : null;
  const preview = previewId ? jobs.find((job: any) => job.id === previewId) : null;
  const rowsR = preview ? await db.from("import_rows").select("row_number,normalized_data,validation_errors,status").eq("organization_id", organizationId).eq("import_job_id", preview.id).order("row_number").limit(25) : { data: [] };
  const q = (filters.q ?? "").trim().toLowerCase();
  const state = filters.state ?? "all";
  const target = filters.target ?? "all";
  const visibleJobs = jobs.filter((job: any) => (state === "all" || job.status === state) && (target === "all" || job.target_entity_type === target) && (!q || String(job.file_name ?? "").toLowerCase().includes(q)));
  const totalImported = jobs.reduce((sum: number, job: any) => sum + Number(job.summary?.imported_rows ?? 0), 0);
  const rollbackConflicts = jobs.reduce((sum: number, job: any) => sum + Number(job.summary?.rollback_conflicts ?? 0), 0);
  const notice = preview
    ? undefined
    : statusValue === "completed"
      ? "import-completed"
      : statusValue === "rolled-back"
        ? "import-rolled-back"
        : statusValue.startsWith("error-")
          ? "error"
          : statusValue;
  const hidden = <input type="hidden" name="organizationId" value={organizationId} />;

  const uploadForm = <form action={stageImport} className="grid gap-4">{hidden}<label className="grid gap-1.5 text-sm font-medium">Tipo de información<Select name="target" defaultValue="worker"><option value="worker">Trabajadores</option><option value="legal_entity">Razones sociales</option><option value="site">Sedes</option><option value="area">Áreas</option></Select></label><label className="grid gap-1.5 text-sm font-medium">Archivo CSV o XLSX<Input name="file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required /></label><p className="text-sm leading-6 text-[var(--muted)]">Máximo 10 MB, una hoja, 1.000 filas y 50 columnas. No incluyas datos clínicos, financieros ni documentos de identidad.</p><details className="rounded-[10px] border border-[var(--border)] p-3 text-sm"><summary className="cursor-pointer font-medium">Relacionar encabezados manualmente</summary><p className="mt-2 text-xs text-[var(--muted)]">Úsalo solo si tu archivo emplea nombres diferentes a la plantilla.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{mappingFields.map((field) => <label key={field} className="grid gap-1 text-xs font-medium">{columnLabels[field]}<Input name={field} placeholder="Encabezado en tu archivo" /></label>)}</div></details><Button><FileArrowUp size={18} />Analizar archivo</Button></form>;

  return <main className="grid gap-7">
    <PageHeader eyebrow="Carga controlada" title="Importaciones" description="Previsualiza y valida estructura o nómina antes de guardar. Cada carga es idempotente, auditable y reversible de forma lógica." action={manage ? <FormDrawer triggerLabel="Importar archivo" title="Nueva importación" description="Selecciona el tipo de información y carga un archivo privado.">{uploadForm}</FormDrawer> : undefined} />
    <AnalysisNav organizationId={organizationId} current="imports" />
    <StatusBanner status={notice} />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Archivos procesados" value={jobs.length} icon={<FileArrowUp size={18} />} /><KpiCard label="Registros importados" value={totalImported} icon={<Rows size={18} />} /><KpiCard label="Procesos completados" value={jobs.filter((job: any) => job.status === "completed").length} icon={<CheckCircle size={18} />} /><KpiCard label="Conflictos de reversión" value={rollbackConflicts} icon={<WarningCircle size={18} />} /></section>
    <section className="grid gap-3" aria-labelledby="templates-title"><div><h2 id="templates-title" className="text-lg font-semibold">Plantillas disponibles</h2><p className="mt-1 text-sm text-[var(--muted)]">Descarga una plantilla para reducir errores de encabezado y relaciones.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{targets.map((item) => <Card key={item}><CardContent className="pt-5"><p className="font-semibold">{targetLabels[item]}</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{templateColumns[item].map((column) => columnLabels[column] ?? column).join(" · ")}</p><Button asChild size="sm" variant="ghost" className="mt-3"><Link href={`/org/${organizationId}/imports/template/${item}`}>Descargar CSV</Link></Button></CardContent></Card>)}</div></section>
    {preview ? <section className="grid gap-3" aria-labelledby="preview-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="preview-title" className="text-lg font-semibold">Previsualización · {targetLabels[preview.target_entity_type as ImportTarget]}</h2><p className="mt-1 text-sm text-[var(--muted)]">Revisa las primeras filas antes de confirmar.</p></div><div className="flex gap-2"><StatusBadge>{(preview.summary?.invalid_rows ?? 0) > 0 ? "invalid" : "valid"}</StatusBadge><span className="text-sm text-[var(--muted)]">{preview.summary?.valid_rows ?? 0} válidas · {preview.summary?.invalid_rows ?? 0} con errores</span></div></div>{(preview.summary?.invalid_rows ?? 0) > 0 ? <Button asChild size="sm" variant="secondary"><Link href={`/org/${organizationId}/imports/${preview.id}/errors`}>Descargar reporte de errores</Link></Button> : null}<Card><CardContent className="divide-y divide-[var(--border)]">{(rowsR.data ?? []).map((row: any) => { const errors = validationMessages(row.validation_errors); const fields = normalizedFields(row.normalized_data); return <article key={row.row_number} className="grid gap-3 py-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Fila {row.row_number}</p><StatusBadge>{row.status}</StatusBadge></div>{errors.length ? <ul className="grid gap-1 text-sm text-[var(--danger)]">{errors.map((error, index) => <li key={`${row.row_number}-${index}`}>{error}</li>)}</ul> : <dl className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">{fields.map((field) => <div key={field.label}><dt className="text-xs text-[var(--muted)]">{field.label}</dt><dd>{field.value}</dd></div>)}</dl>}</article>; })}</CardContent></Card>{manage ? <form action={commitImport}>{hidden}<input type="hidden" name="id" value={preview.id} /><Button disabled={(preview.summary?.invalid_rows ?? 0) > 0}>Confirmar importación</Button></form> : null}</section> : null}
    <Card><CardContent className="pt-5"><form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]"><Input name="q" defaultValue={filters.q} placeholder="Buscar archivo" aria-label="Buscar importación" /><Select name="target" defaultValue={target} aria-label="Tipo de información"><option value="all">Todos los tipos</option>{targets.map((item) => <option key={item} value={item}>{targetLabels[item]}</option>)}</Select><Select name="state" defaultValue={state} aria-label="Estado"><option value="all">Todos los estados</option><option value="preview">En revisión</option><option value="completed">Completada</option><option value="rolled_back">Revertida</option><option value="failed">Fallida</option></Select><Button variant="secondary">Aplicar filtros</Button></form></CardContent></Card>
    <section className="grid gap-3" aria-labelledby="history-title"><div className="flex items-center justify-between"><h2 id="history-title" className="text-lg font-semibold">Historial</h2><span className="text-xs text-[var(--muted)]">{visibleJobs.length} resultados</span></div>{visibleJobs.length ? visibleJobs.map((job: any) => <Card key={job.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{targetLabels[job.target_entity_type as ImportTarget] ?? "Importación"}</p><StatusBadge>{job.status}</StatusBadge></div><p className="mt-1 text-sm text-[var(--muted)]">{job.file_name} · {dateTime(job.created_at)}</p><p className="mt-1 text-xs text-[var(--muted)]">{job.summary?.imported_rows ?? 0} registros importados · {job.summary?.rollback_conflicts ?? 0} conflictos de reversión</p></div>{manage && job.status === "completed" ? <FormDrawer triggerLabel="Revertir" title="Reversión lógica" description="Los registros creados se archivarán. Los cambios manuales posteriores no se sobrescribirán." variant="secondary"><form action={rollbackImport} className="grid gap-4">{hidden}<input type="hidden" name="id" value={job.id} /><p className="text-sm leading-6">Confirma la reversión de <strong>{job.file_name}</strong>. Los conflictos quedarán en el reporte del proceso.</p><Button variant="danger">Confirmar reversión</Button></form></FormDrawer> : null}</CardContent></Card>) : <EmptyState title="No hay importaciones en esta vista" description={q || state !== "all" || target !== "all" ? "Cambia los filtros para ampliar los resultados." : "Carga una plantilla para iniciar una previsualización segura."} />}</section>
  </main>;
}
