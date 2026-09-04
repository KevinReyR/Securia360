import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SgsstFlowNav } from "@/components/sgsst-flow-nav";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
import { archiveDocument, deleteDocument, downloadDocumentVersion, replaceDocumentVersion } from "@/modules/organizations/core-actions";
import { requireTenant } from "@/modules/organizations/tenant";

const entityLabels: Record<string, string> = {
  organization: "Organización",
  evidence: "Evidencia",
  improvement_action: "Acción de mejora",
  task: "Tarea",
  risk_control: "Control de riesgo",
  training_session: "Sesión de capacitación",
  incident: "Incidente",
  contractor_requirement: "Requisito de contratista",
};

const displayDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "UTC" }).format(new Date(value))
  : "Sin vencimiento";

export default async function DocumentDetailPage({ params, searchParams }: {
  params: Promise<{ organizationId: string; documentId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { organizationId, documentId } = await params;
  await requireTenant(organizationId);
  const { status } = await searchParams;
  const supabase = await createClient();
  const [documentResult, versionResult, mayRead, mayUpdate, mayDelete] = await Promise.all([
    supabase.from("documents").select("id,title,status,entity_type,entity_id,expires_at,created_at").eq("organization_id", organizationId).eq("id", documentId).neq("status", "deleted").maybeSingle(),
    supabase.from("document_versions").select("id,version_number,original_name,mime_type,size_bytes,created_at").eq("organization_id", organizationId).eq("document_id", documentId).order("version_number", { ascending: false }),
    can(organizationId, "documents.read"),
    can(organizationId, "documents.update"),
    can(organizationId, "documents.delete"),
  ]);
  const document = documentResult.data;

  if (!mayRead || !document) {
    return <div className="grid gap-7"><PageHeader title="Documento no disponible" description="No existe o no tienes acceso a este documento." action={<Link href={`/org/${organizationId}/documents`} className="text-sm font-semibold text-[var(--brand)]">Volver a documentos</Link>} /></div>;
  }

  const versions = versionResult.data ?? [];
  return (
    <div className="grid gap-7">
      <PageHeader eyebrow="Biblioteca" title={document.title} description="Consulta el archivo vigente y conserva la trazabilidad de cada reemplazo." action={<Link href={`/org/${organizationId}/documents`} className="text-sm font-semibold text-[var(--brand)]">Volver a documentos</Link>} />
      <SgsstFlowNav organizationId={organizationId} current="documents" />
      <StatusBanner status={status} />

      <section aria-label="Resumen del documento" className="grid gap-px overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
        <div className="bg-[var(--surface)] p-4"><p className="text-xs font-medium text-[var(--muted)]">Estado</p><div className="mt-2"><StatusBadge>{document.status}</StatusBadge></div></div>
        <div className="bg-[var(--surface)] p-4"><p className="text-xs font-medium text-[var(--muted)]">Relacionado con</p><p className="mt-2 text-sm font-semibold">{entityLabels[document.entity_type] ?? "Registro de la organización"}</p></div>
        <div className="bg-[var(--surface)] p-4"><p className="text-xs font-medium text-[var(--muted)]">Vencimiento</p><p className="mt-2 text-sm font-semibold">{displayDate(document.expires_at)}</p></div>
      </section>

      <Card>
        <CardHeader><h2 className="font-semibold">Historial de versiones</h2><p className="text-sm text-[var(--muted)]">{versions.length} {versions.length === 1 ? "versión conservada" : "versiones conservadas"}</p></CardHeader>
        <CardContent className="grid gap-3">
          {versions.length ? versions.map((version) => <article key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-3"><div><strong>Versión {version.version_number}</strong><p className="mt-1 text-sm text-[var(--muted)]">{version.original_name} · {(version.size_bytes / 1024).toFixed(1)} KB · {displayDate(version.created_at)}</p></div><form action={downloadDocumentVersion}><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="documentId" value={documentId} /><input type="hidden" name="versionId" value={version.id} /><Button type="submit" size="sm" variant="secondary">Descargar de forma segura</Button></form></article>) : <p className="text-sm text-[var(--muted)]">Aún no hay versiones registradas.</p>}
        </CardContent>
      </Card>

      {mayUpdate ? <Card><CardHeader><h2 className="font-semibold">Publicar una nueva versión</h2><p className="text-sm text-[var(--muted)]">La versión anterior se conserva para auditoría.</p></CardHeader><CardContent><form action={replaceDocumentVersion} className="flex flex-wrap items-end gap-3"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="documentId" value={documentId} /><label className="grid gap-1 text-sm font-medium">Archivo PDF o imagen<input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required className="text-sm" /></label><Button type="submit">Crear versión</Button></form></CardContent></Card> : null}

      <div className="flex flex-wrap gap-3">
        {mayUpdate && document.status === "active" ? <form action={archiveDocument}><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="documentId" value={documentId} /><Button type="submit" variant="secondary">Archivar documento</Button></form> : null}
      </div>

      {mayDelete ? <Card className="border-[var(--danger-border)]"><CardHeader><h2 className="font-semibold text-[var(--danger)]">Retirar de la biblioteca</h2></CardHeader><CardContent><form action={deleteDocument} className="grid gap-3"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="documentId" value={documentId} /><label className="grid gap-1 text-sm font-medium">Escribe <strong>{document.title}</strong> para confirmar<input name="confirmation" required autoComplete="off" className="min-h-10 rounded-md border border-[var(--danger-border)] px-3 text-sm" /></label><p className="text-sm text-[var(--muted)]">El documento dejará de aparecer en la biblioteca, pero su historial se conservará para auditoría.</p><div><Button type="submit" variant="danger">Retirar documento</Button></div></form></CardContent></Card> : null}
    </div>
  );
}
