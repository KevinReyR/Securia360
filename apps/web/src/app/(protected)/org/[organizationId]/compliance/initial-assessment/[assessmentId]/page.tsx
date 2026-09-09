import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/modules/auth/permissions";
import { loadInitialAssessment } from "@/modules/compliance/initial-assessment-data";
import { InitialAssessmentWizard } from "@/modules/compliance/initial-assessment-wizard";
import { requireTenant } from "@/modules/organizations/tenant";

const cycleLabels: Record<string, string> = { PLAN: "Planear", DO: "Hacer", CHECK: "Verificar", ACT: "Actuar" };

export default async function InitialAssessmentPage({ params, searchParams }: { params: Promise<{ organizationId: string; assessmentId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId, assessmentId } = await params;
  const query = await searchParams;
  await requireTenant(organizationId);
  const [read, manage] = await Promise.all([can(organizationId, "assessments.read"), can(organizationId, "assessments.manage")]);
  if (!read) return <div className="grid gap-6"><PageHeader title="Evaluación Inicial SG-SST" description="No tienes permiso para consultar esta evaluación."/><StatusBanner status="forbidden"/></div>;
  const data = await loadInitialAssessment(organizationId, assessmentId);
  if (!data) notFound();
  const profile = data.profileVersion?.standard_profiles;
  const items = data.items.map((item) => ({ id: item.id, code: item.code, title: item.title, phvaCycle: item.phvaCycle ?? "PLAN", criterion: item.criterion, expectedEvidence: item.expectedEvidence, weight: item.weight ?? 0, response: item.response as "pending" | "met" | "not_met", score: item.score }));
  const open = ["draft", "in_progress"].includes(data.assessment.status);
  const unmet = items.filter((item) => item.response === "not_met").sort((a, b) => b.weight - a.weight);
  const met = items.filter((item) => item.response === "met");
  const byCycle = Object.entries(cycleLabels).map(([code, label]) => ({ code, label, score: items.filter((item) => item.phvaCycle === code).reduce((sum, item) => sum + Number(item.score ?? 0), 0), weight: items.filter((item) => item.phvaCycle === code).reduce((sum, item) => sum + item.weight, 0) }));
  return <div className="grid gap-6"><PageHeader eyebrow="Cumplimiento" title="Evaluación Inicial SG-SST" description={`${profile?.name ?? "Perfil aplicable"} · ${data.profileVersion?.version_code ?? "Versión histórica"}`}/><StatusBanner status={query.status}/>
    {open ? <InitialAssessmentWizard organizationId={organizationId} assessmentId={assessmentId} items={items} canManage={manage}/> : <div className="grid gap-5">
      <section className="grid gap-4 sm:grid-cols-3"><Card><CardHeader><CardTitle>Puntaje total</CardTitle></CardHeader><CardContent><p className="text-4xl font-semibold tracking-[-0.04em]">{Number(data.assessment.score ?? 0).toLocaleString("es-CO", { maximumFractionDigits: 2 })}%</p></CardContent></Card><Card><CardHeader><CardTitle>Estándares cumplidos</CardTitle></CardHeader><CardContent><p className="text-4xl font-semibold tracking-[-0.04em] text-[var(--success)]">{met.length}</p></CardContent></Card><Card><CardHeader><CardTitle>Oportunidades de mejora</CardTitle></CardHeader><CardContent><p className="text-4xl font-semibold tracking-[-0.04em] text-[var(--warning)]">{unmet.length}</p></CardContent></Card></section>
      <Card><CardHeader><CardTitle>Resultado por ciclo PHVA</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{byCycle.map((entry) => <div key={entry.code} className="rounded-[10px] border border-[var(--border)] p-4"><p className="text-sm font-semibold">{entry.label}</p><p className="mt-2 text-2xl font-semibold">{entry.score.toLocaleString("es-CO", { maximumFractionDigits: 2 })}%</p><p className="text-xs text-[var(--muted)]">de {entry.weight.toLocaleString("es-CO", { maximumFractionDigits: 2 })}% posible</p></div>)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Oportunidades de mejora</CardTitle></CardHeader><CardContent>{unmet.length ? <ol className="grid gap-3">{unmet.map((item) => <li key={item.id} className="rounded-[10px] border border-[var(--border)] p-4"><div className="flex items-start gap-3"><WarningCircle className="mt-0.5 shrink-0 text-[var(--warning)]"/><div><p className="font-semibold">{item.code} · {item.title}</p><p className="mt-1 text-sm text-[var(--muted)]">Peso {item.weight.toLocaleString("es-CO", { maximumFractionDigits: 2 })}% · Evidencia esperada: {item.expectedEvidence ?? "Revisar el criterio del estándar."}</p></div></div></li>)}</ol> : <div className="flex items-center gap-3 text-sm text-[var(--success)]"><CheckCircle/>No se identificaron oportunidades en las respuestas registradas.</div>}<Button className="mt-5" variant="secondary" asChild><Link href={`/org/${organizationId}/improvement-plan?actionState=open`}>Ver plan de mejoramiento</Link></Button></CardContent></Card>
      <details className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5"><summary className="cursor-pointer font-semibold">Ver estándares cumplidos ({met.length})</summary><ul className="mt-4 grid gap-2 text-sm text-[var(--muted)]">{met.map((item) => <li key={item.id}>{item.code} · {item.title}</li>)}</ul></details>
    </div>}
  </div>;
}
