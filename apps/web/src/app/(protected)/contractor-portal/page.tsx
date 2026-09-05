import { CalendarDots, FileArrowUp, FileText } from "@phosphor-icons/react/dist/ssr";
import { BrandMark } from "@/components/brand-mark";
import { EmptyState } from "@/components/empty-state";
import { FormDrawer } from "@/components/form-drawer";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-controls";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { submitContractorDocument } from "@/modules/contractors/actions";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";

const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`)) : "Sin vencimiento";
const isDueSoon = (value: string | null) => value ? new Date(`${value.slice(0, 10)}T23:59:59Z`).getTime() <= Date.now() + 30 * 86_400_000 : false;

export default async function ContractorPortal({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase } = await requireAuthenticatedUser();
  const { status } = await searchParams;
  const { data: accesses } = await supabase.from("contractor_portal_accesses").select("id,organization_id,contract_id,site_id,status").eq("status", "active");
  const contractIds = [...new Set((accesses ?? []).map((access) => access.contract_id))];
  const organizationIds = [...new Set((accesses ?? []).map((access) => access.organization_id))];
  const [{ data: contracts }, { data: requirements }, { data: submissions }] = contractIds.length ? await Promise.all([
    supabase.from("contracts").select("id,organization_id,code,title,status,starts_at,ends_at").in("id", contractIds).order("starts_at", { ascending: false }),
    supabase.from("contract_document_requirements").select("id,organization_id,contract_id,title,due_at,required,status").in("contract_id", contractIds).eq("status", "active").order("due_at", { ascending: true, nullsFirst: false }),
    supabase.from("contract_document_submissions").select("id,organization_id,contract_document_requirement_id,status,submitted_at,review_note").in("organization_id", organizationIds).order("submitted_at", { ascending: false }),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];
  const requirementsPending = (requirements ?? []).filter((requirement) => !(submissions ?? []).some((submission) => submission.contract_document_requirement_id === requirement.id && submission.status === "approved")).length;
  const dueSoon = (requirements ?? []).filter((requirement) => isDueSoon(requirement.due_at)).length;

  return <div className="min-h-[100dvh] bg-[var(--background)]"><header className="border-b border-[var(--border)] bg-[var(--surface)]"><div className="mx-auto flex min-h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6"><BrandMark href="/contractor-portal" /><LogoutButton /></div></header><main className="mx-auto grid max-w-[1320px] gap-6 px-4 py-6 sm:px-6 lg:py-10">
    <PageHeader eyebrow="Portal de contratistas" title="Contratos y requisitos autorizados" description="Consulta exclusivamente los contratos, sedes y documentos incluidos en tu acceso. No puedes ver información interna ni datos de otros contratistas." />
    <StatusBanner status={status} />
    {!accesses?.length ? <EmptyState title="No tienes accesos activos" description="La organización contratante debe vincular tu cuenta y aprobar el acceso a un contrato o sede." /> : <>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen del portal"><KpiCard label="Contratos visibles" value={contracts?.length ?? 0} icon={<FileText size={19} />} /><KpiCard label="Sedes autorizadas" value={accesses.filter((access) => access.site_id).length} icon={<CalendarDots size={19} />} /><KpiCard label="Requisitos pendientes" value={requirementsPending} icon={<FileArrowUp size={19} />} /><KpiCard label="Vencen en 30 días" value={dueSoon} icon={<CalendarDots size={19} />} /></section>
      <div className="rounded-xl border border-[var(--info-border)] bg-[var(--info-soft)] px-4 py-3 text-sm leading-6 text-[var(--info)]">El portal limita cada consulta a tu contrato y alcance aprobado. Enviar un documento no lo aprueba: la organización contratante debe revisarlo.</div>
      <section className="grid gap-5">{contracts?.map((contract) => { const contractRequirements = (requirements ?? []).filter((requirement) => requirement.contract_id === contract.id); const siteCount = accesses.filter((access) => access.contract_id === contract.id && access.site_id).length; return <Card key={contract.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><CardTitle>{contract.title}</CardTitle><StatusBadge>{contract.status}</StatusBadge></div><CardDescription>Contrato {contract.code} · {dateLabel(contract.starts_at)} — {dateLabel(contract.ends_at)}</CardDescription></div><span className="text-sm font-medium text-[var(--muted)]">{siteCount ? `${siteCount} ${siteCount === 1 ? "sede autorizada" : "sedes autorizadas"}` : "Alcance general"}</span></div></CardHeader><CardContent>{contractRequirements.length ? <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">{contractRequirements.map((requirement) => { const relatedSubmissions = (submissions ?? []).filter((submission) => submission.contract_document_requirement_id === requirement.id); const latest = relatedSubmissions[0]; return <article key={requirement.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{requirement.title}</h3>{requirement.required ? <span className="text-xs font-semibold text-[var(--danger)]">Obligatorio</span> : <span className="text-xs text-[var(--muted)]">Opcional</span>}</div><p className="mt-1 text-sm text-[var(--muted)]">Vence: {dateLabel(requirement.due_at)}</p>{latest ? <div className="mt-2 flex flex-wrap items-center gap-2 text-sm"><StatusBadge>{latest.status}</StatusBadge><span className="text-[var(--muted)]">Enviado {dateLabel(latest.submitted_at)}</span>{latest.review_note ? <span className="basis-full text-[var(--muted)]">Observación: {latest.review_note}</span> : null}</div> : <p className="mt-2 text-sm text-[var(--warning)]">Aún no has enviado evidencia.</p>}</div><FormDrawer title={`Enviar ${requirement.title}`} description="El archivo se guardará de forma privada y solo podrá revisarlo el personal autorizado." triggerLabel={latest?.status === "rejected" ? "Enviar corrección" : "Enviar documento"} variant={latest ? "secondary" : "primary"}><form action={submitContractorDocument} className="grid gap-4"><input type="hidden" name="organizationId" value={requirement.organization_id} /><input type="hidden" name="requirementId" value={requirement.id} /><label className="grid gap-2 text-sm font-medium">Archivo<input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--muted-surface)] p-4 text-sm" required /></label><p className="text-xs leading-5 text-[var(--muted)]">PDF o imagen, máximo 25 MB. Evita incluir información personal que no sea necesaria.</p><Button type="submit"><FileArrowUp size={17} />Enviar para revisión</Button></form></FormDrawer></article>; })}</div> : <EmptyState title="Este contrato no tiene requisitos activos" description="La organización contratante aún no ha publicado documentos requeridos para tu alcance." />}</CardContent></Card>; })}{!contracts?.length ? <EmptyState title="No hay contratos disponibles" description="Tu acceso existe, pero ningún contrato activo está visible. Solicita revisión a la organización contratante." /> : null}</section>
    </>}
  </main></div>;
}
