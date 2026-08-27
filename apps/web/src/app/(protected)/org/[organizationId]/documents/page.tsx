import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
import { uploadDocument } from "@/modules/organizations/core-actions";
import { requireTenant } from "@/modules/organizations/tenant";

export default async function DocumentsPage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId } = await params; await requireTenant(organizationId);
  const supabase = await createClient(); const [documents, mayUpload] = await Promise.all([supabase.from("documents").select("id,title,status,expires_at,created_at").eq("organization_id", organizationId).neq("status", "deleted").order("created_at", { ascending: false }), can(organizationId, "documents.create")]);
  const { status } = await searchParams;
  return <div className="grid gap-7"><PageHeader title="Documentos y evidencias" description="Archivos privados, versionables y aislados por organización." /><StatusBanner status={status} />{mayUpload ? <Card><CardHeader><h2 className="font-semibold">Cargar documento</h2></CardHeader><CardContent><form action={uploadDocument} className="grid gap-3"><input type="hidden" name="organizationId" value={organizationId} /><label>Título<Input name="title" required /></label><label>Tipo de entidad<Input name="entity_type" defaultValue="organization" required /></label><label>ID de entidad<Input name="entity_id" required /></label><label>Vencimiento (opcional)<Input name="expires_at" type="datetime-local" /></label><label>Archivo PDF o imagen<Input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /></label><Button type="submit">Cargar archivo privado</Button></form></CardContent></Card> : null}<Card><CardHeader><h2 className="font-semibold">Registro</h2></CardHeader><CardContent className="grid gap-2">{documents.data?.map((d: { id: string; title: string; status: string; expires_at: string | null }) => <div key={d.id} className="rounded border p-3"><strong>{d.title}</strong><span className="ml-2 text-sm text-[var(--muted)]">{d.status}{d.expires_at ? ` · vence ${new Date(d.expires_at).toLocaleDateString("es-CO")}` : ""}</span></div>) ?? "Sin documentos."}</CardContent></Card></div>;
}
