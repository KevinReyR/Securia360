import { BookOpenText, ChatCircleDots, Sparkle, Warning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { FormDrawer } from "@/components/form-drawer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { can } from "@/modules/auth/permissions";
import { copilotConfig } from "@/modules/copilot/openai";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { askCopilot, createProposal, decideProposal } from "./actions";

type Source = { source_label: string; excerpt: string | null };
type Message = { id: string; role: string; content: string; prompt_injection_flag: boolean; created_at: string; copilot_sources: Source[] | null };
type Proposal = { id: string; proposal_type: string; proposal: unknown; status: string; decision_note?: string | null; created_at: string };
const proposalLabels: Record<string, string> = { draft_task: "Borrador de tarea", draft_action: "Borrador de acción", draft_document: "Borrador documental", critical_classification: "Propuesta de clasificación", critical_approval: "Propuesta de aprobación", legal_or_medical: "Consulta legal o médica" };
const dateTime = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }).format(new Date(value)) : "Sin fecha";

export default async function CopilotPage({ params, searchParams }: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { organizationId } = await params;
  const { conversation } = await searchParams;
  const [read, manage] = await Promise.all([can(organizationId, "copilot.read"), can(organizationId, "copilot.manage")]);
  if (!read) return <EmptyState title="Sin acceso a Securia Copilot" description="Solicita acceso al responsable de tu organización." />;
  const { supabase, userId } = await requireAuthenticatedUser();
  const conversationResult = await supabase.from("copilot_conversations").select("id,title,updated_at").eq("organization_id", organizationId).eq("actor_user_id", userId).order("updated_at", { ascending: false }).limit(30);
  const conversations = conversationResult.data ?? [];
  const active = conversation === "new" ? undefined : conversation ?? conversations[0]?.id;
  const result = active ? await Promise.all([
    supabase.from("copilot_messages").select("id,role,content,prompt_injection_flag,created_at,copilot_sources(source_label,excerpt,source_snapshot)").eq("conversation_id", active).order("created_at"),
    supabase.from("copilot_action_proposals").select("id,proposal_type,proposal,status,decision_note,created_at").eq("conversation_id", active).order("created_at", { ascending: false }),
  ]) : null;
  const messages = (result?.[0].data ?? []) as Message[];
  const proposals = (result?.[1].data ?? []) as Proposal[];
  const sourceCount = messages.reduce((total, message) => total + (message.copilot_sources?.length ?? 0), 0);
  const flaggedCount = messages.filter((message) => message.prompt_injection_flag).length;
  const pendingProposals = proposals.filter((proposal) => proposal.status === "pending_human_confirmation").length;
  const configured = Boolean(copilotConfig());
  const hidden = <input type="hidden" name="organizationId" value={organizationId} />;
  const questionForm = <form action={askCopilot} className="grid gap-3">{hidden}{active ? <input type="hidden" name="conversationId" value={active} /> : null}<label className="grid gap-1.5 text-sm font-medium">Pregunta o solicitud<Textarea name="question" required minLength={3} maxLength={1600} className="min-h-32" placeholder="¿Qué acciones abiertas requieren atención esta semana?" /></label><p className="text-xs leading-5 text-[var(--muted)]">Copilot consulta únicamente fuentes que ya puedes leer. No ejecuta cambios ni toma decisiones por ti.</p><Button disabled={!configured}><Sparkle size={17} />Consultar Copilot</Button></form>;

  return <main className="grid gap-7">
    <PageHeader eyebrow="Asistente autorizado" title="Securia Copilot" description="Busca y explica información operativa con fuentes trazables, dentro de los permisos de esta organización." action={<FormDrawer triggerLabel="Nueva consulta" title={active ? "Continuar conversación" : "Nueva conversación"} description="La respuesta usará contexto mínimo y autorizado.">{questionForm}</FormDrawer>} />
    {!configured ? <aside className="rounded-[14px] border border-[var(--warning-border)] bg-[var(--warning-soft)] p-4 text-sm leading-6 text-[var(--warning)]"><strong>Proveedor pendiente de configuración.</strong> Puedes revisar el historial, pero las nuevas respuestas permanecen bloqueadas de forma segura.</aside> : null}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><KpiCard label="Conversaciones" value={conversations.length} icon={<ChatCircleDots size={18} />} /><KpiCard label="Fuentes citadas" value={sourceCount} icon={<BookOpenText size={18} />} /><KpiCard label="Propuestas pendientes" value={pendingProposals} icon={<Sparkle size={18} />} /><KpiCard label="Contextos bloqueados" value={flaggedCount} icon={<Warning size={18} />} /></section>
    <aside className="rounded-[14px] border border-[var(--border)] bg-[var(--muted-surface)] p-4 text-sm leading-6 text-[var(--muted-strong)]"><strong>Alcance del asistente.</strong> Las fuentes se tratan como contenido no confiable. Copilot no cambia clasificaciones, aprueba evaluaciones, cierra hallazgos ni toma decisiones legales o médicas.</aside>
    <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <Card className="self-start"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Conversaciones</CardTitle><Button asChild size="sm" variant="ghost"><Link href="?conversation=new">Nueva</Link></Button></div></CardHeader><CardContent className="grid gap-1">{conversations.length ? conversations.map((item) => <Link className={`rounded-[9px] px-3 py-2 text-sm transition-colors ${item.id === active ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)]" : "text-[var(--muted-strong)] hover:bg-[var(--muted-surface)]"}`} href={`?conversation=${item.id}`} key={item.id} aria-current={item.id === active ? "page" : undefined}><span className="line-clamp-2">{item.title ?? "Conversación sin título"}</span><span className="mt-1 block text-xs font-normal text-[var(--muted)]">{dateTime(item.updated_at)}</span></Link>) : <p className="text-sm text-[var(--muted)]">Aún no hay conversaciones.</p>}</CardContent></Card>
      <div className="grid gap-5">
        <section className="grid gap-3" aria-label="Conversación con Copilot">{messages.length ? messages.map((message) => <article key={message.id} className={`max-w-3xl rounded-[14px] p-4 ${message.role === "user" ? "ml-auto bg-[var(--brand)] text-white" : "border border-[var(--border)] bg-[var(--surface)]"}`}><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold">{message.role === "user" ? "Tú" : "Securia Copilot"}</p><time className={`text-xs ${message.role === "user" ? "text-white/70" : "text-[var(--muted)]"}`}>{dateTime(message.created_at)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>{message.prompt_injection_flag ? <p className="mt-3 rounded-[9px] bg-[var(--warning-soft)] p-2 text-xs text-[var(--warning)]">Se detectaron instrucciones dentro del contexto. Fueron ignoradas y no se ejecutó ninguna herramienta.</p> : null}{message.copilot_sources?.length ? <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold">{message.copilot_sources.length} fuentes autorizadas</summary><ul className="mt-2 grid gap-2">{message.copilot_sources.map((source, index) => <li className="rounded-[9px] bg-[var(--muted-surface)] p-2 text-xs text-[var(--muted-strong)]" key={`${source.source_label}-${index}`}><strong>{source.source_label}</strong>{source.excerpt ? <span className="mt-1 block">{source.excerpt}</span> : null}</li>)}</ul></details> : null}</article>) : <EmptyState icon={<Sparkle size={20} />} title={active ? "Esta conversación está vacía" : "Inicia una conversación"} description="Pregunta por tareas, documentos, evaluaciones o riesgos que tengas permiso para consultar." action={<FormDrawer triggerLabel="Escribir pregunta" title="Consulta autorizada" description="La respuesta citará las fuentes utilizadas.">{questionForm}</FormDrawer>} />}</section>
        {active && manage ? <Card><CardHeader><CardTitle>Propuestas para revisión humana</CardTitle><p className="text-sm text-[var(--muted)]">Aceptar una propuesta solo registra la decisión; nunca ejecuta cambios automáticamente.</p></CardHeader><CardContent className="grid gap-4"><FormDrawer triggerLabel="Registrar propuesta" title="Propuesta auditable" description="El trabajo deberá ejecutarse después mediante el flujo normal." variant="secondary"><form action={createProposal} className="grid gap-4">{hidden}<input type="hidden" name="conversationId" value={active} /><label className="grid gap-1.5 text-sm font-medium">Tipo<Select name="proposalType"><option value="draft_task">Borrador de tarea</option><option value="draft_action">Borrador de acción</option><option value="draft_document">Borrador documental</option></Select></label><label className="grid gap-1.5 text-sm font-medium">Resumen<Textarea name="summary" required placeholder="Describe lo que una persona debería revisar" /></label><Button>Registrar propuesta</Button></form></FormDrawer>{proposals.length ? proposals.map((proposal) => { const summary = typeof proposal.proposal === "object" && proposal.proposal && "summary" in proposal.proposal ? String((proposal.proposal as { summary?: unknown }).summary ?? "") : ""; return <article className="rounded-[10px] border border-[var(--border)] p-4" key={proposal.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">{proposalLabels[proposal.proposal_type] ?? "Propuesta operativa"}</p><p className="mt-1 text-sm text-[var(--muted)]">{summary}</p></div><StatusBadge>{proposal.status}</StatusBadge></div>{proposal.decision_note ? <p className="mt-3 text-sm"><strong>Fundamento:</strong> {proposal.decision_note}</p> : null}{proposal.status === "pending_human_confirmation" ? <form action={decideProposal} className="mt-3 grid gap-3">{hidden}<input type="hidden" name="proposalId" value={proposal.id} /><Textarea name="note" required placeholder="Fundamento de la decisión" /><div className="flex gap-2"><Button name="status" value="accepted" size="sm">Aceptar registro</Button><Button name="status" value="rejected" size="sm" variant="secondary">Rechazar</Button></div></form> : null}</article>; }) : <p className="text-sm text-[var(--muted)]">Esta conversación no tiene propuestas.</p>}</CardContent></Card> : null}
      </div>
    </div>
  </main>;
}
