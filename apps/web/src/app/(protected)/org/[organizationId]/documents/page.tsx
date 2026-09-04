import { FileArrowUp, FileText, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { FormDrawer } from "@/components/form-drawer";
import { PageHeader } from "@/components/page-header";
import { SgsstFlowNav } from "@/components/sgsst-flow-nav";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
import { uploadDocument } from "@/modules/organizations/core-actions";
import { requireTenant } from "@/modules/organizations/tenant";

const entityLabels: Record<string, string> = {
  organization: "Organización",
  evidence: "Evidencia",
  improvement_action: "Acción de mejora",
  task: "Tarea",
  risk_control: "Control de riesgo",
};

export default async function DocumentsPage({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ status?: string; q?: string; state?: string; page?: string }>;
}) {
  const { organizationId } = await params;
  await requireTenant(organizationId);
  const { status, q = "", state = "active", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = 12;
  const supabase = await createClient();
  let query = supabase
    .from("documents")
    .select("id,title,status,expires_at,created_at,entity_type", { count: "exact" })
    .eq("organization_id", organizationId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });
  if (state !== "all") query = query.eq("status", state);
  if (q.trim()) query = query.ilike("title", `%${q.trim().replace(/[%_]/g, "")}%`);

  const currentTime = new Date();
  const expiresBefore = new Date(currentTime.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const [documents, mayUpload, mayRead, activeCount, archivedCount, expiringCount] = await Promise.all([
    query.range((currentPage - 1) * pageSize, currentPage * pageSize - 1),
    can(organizationId, "documents.create"),
    can(organizationId, "documents.read"),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "archived"),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active").gte("expires_at", currentTime.toISOString()).lte("expires_at", expiresBefore),
  ]);
  const totalPages = Math.max(1, Math.ceil((documents.count ?? 0) / pageSize));
  const pageHref = (next: number) => `/org/${organizationId}/documents?${new URLSearchParams({ ...(q ? { q } : {}), ...(state !== "active" ? { state } : {}), page: String(next) }).toString()}`;

  if (!mayRead) return <EmptyState title="No puedes consultar documentos" description="Solicita acceso al responsable de tu organización." />;

  const uploadForm = (
    <form action={uploadDocument} className="grid gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="entity_type" value="organization" />
      <input type="hidden" name="entity_id" value={organizationId} />
      <label className="grid gap-1.5 text-sm font-medium">Título<Input name="title" required placeholder="Ej. Política de seguridad y salud" /></label>
      <label className="grid gap-1.5 text-sm font-medium">Vencimiento opcional<Input name="expires_at" type="datetime-local" /></label>
      <label className="grid gap-1.5 text-sm font-medium">Archivo PDF o imagen<Input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /></label>
      <p className="text-xs leading-5 text-[var(--muted)]">El archivo será privado. Puedes asociar evidencias específicas desde la tarea, control o acción correspondiente.</p>
      <Button type="submit">Cargar documento</Button>
    </form>
  );

  return (
    <div className="grid gap-7">
      <PageHeader eyebrow="Biblioteca" title="Documentos y evidencias" description="Consulta versiones, controla vencimientos y conserva cada archivo en su contexto." action={mayUpload ? <FormDrawer triggerLabel="Cargar documento" title="Nuevo documento" description="Añade un archivo general a la biblioteca de la organización.">{uploadForm}</FormDrawer> : undefined} />
      <SgsstFlowNav organizationId={organizationId} current="documents" />
      <StatusBanner status={status} />
      <section aria-label="Resumen documental" className="grid gap-px overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
        {[["Documentos activos", activeCount.count ?? 0], ["Vencen en 30 días", expiringCount.count ?? 0], ["Archivados", archivedCount.count ?? 0]].map(([label, value]) => <div key={label} className="bg-[var(--surface)] p-4"><p className="text-xs font-medium text-[var(--muted)]">{label}</p><p className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{value}</p></div>)}
      </section>
      <Card>
        <CardHeader className="border-b border-[var(--border)]"><CardTitle>Biblioteca</CardTitle></CardHeader>
        <CardContent className="grid gap-5 pt-5">
          <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto]">
            <label className="relative"><MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" /><Input className="pl-10" name="q" defaultValue={q} placeholder="Buscar por título" aria-label="Buscar documentos" /></label>
            <Select name="state" defaultValue={state} aria-label="Estado"><option value="active">Activos</option><option value="archived">Archivados</option><option value="all">Todos</option></Select>
            <Button type="submit" variant="secondary">Aplicar filtros</Button>
          </form>

          {documents.data?.length ? <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">{documents.data.map((document) => (
            <Link key={document.id} href={`/org/${organizationId}/documents/${document.id}`} className="group grid gap-2 py-4 outline-none transition-colors hover:bg-[var(--muted-surface)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-3">
              <span className="flex min-w-0 items-start gap-3"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)]"><FileText size={18} /></span><span className="min-w-0"><strong className="block truncate text-sm group-hover:text-[var(--brand)]">{document.title}</strong><span className="mt-1 block text-xs text-[var(--muted)]">{entityLabels[document.entity_type] ?? "Documento"}{document.expires_at ? ` · Vence ${new Date(document.expires_at).toLocaleDateString("es-CO")}` : " · Sin vencimiento"}</span></span></span>
              <StatusBadge>{document.status}</StatusBadge>
            </Link>
          ))}</div> : <EmptyState icon={<FileArrowUp size={28} />} title="No hay documentos en esta vista" description={q || state !== "active" ? "Cambia los filtros para ampliar la búsqueda." : "Carga el primer documento general o añade una evidencia desde su flujo de trabajo."} />}

          {totalPages > 1 ? <nav aria-label="Paginación de documentos" className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4 text-sm"><Button asChild variant="ghost" size="sm"><Link aria-disabled={currentPage === 1} href={pageHref(Math.max(1, currentPage - 1))}>Anterior</Link></Button><span className="text-[var(--muted)]">Página {currentPage} de {totalPages}</span><Button asChild variant="ghost" size="sm"><Link aria-disabled={currentPage === totalPages} href={pageHref(Math.min(totalPages, currentPage + 1))}>Siguiente</Link></Button></nav> : null}
        </CardContent>
      </Card>
    </div>
  );
}
