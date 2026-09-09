"use client";

import { Check, CheckCircle, CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { buildStandardQuestion } from "./standard-question";
import { completeInitialAssessment, saveInitialAssessmentResponse } from "./initial-assessment-actions";

export type InitialAssessmentItem = {
  id: string;
  code: string;
  title: string;
  phvaCycle: string;
  criterion: string | null;
  expectedEvidence: string | null;
  weight: number;
  response: "pending" | "met" | "not_met";
};

const cycles = ["PLAN", "DO", "CHECK", "ACT"] as const;
const cycleLabels = { PLAN: "Planear", DO: "Hacer", CHECK: "Verificar", ACT: "Actuar" };

export function InitialAssessmentWizard({ organizationId, assessmentId, items, canManage }: { organizationId: string; assessmentId: string; items: InitialAssessmentItem[]; canManage: boolean }) {
  const [responses, setResponses] = useState(() => Object.fromEntries(items.map((item) => [item.id, item.response])) as Record<string, InitialAssessmentItem["response"]>);
  const [cycle, setCycle] = useState<(typeof cycles)[number]>(() => cycles.find((entry) => items.some((item) => item.phvaCycle === entry && item.response === "pending")) ?? "PLAN");
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, "saved" | "error">>({});
  const visible = useMemo(() => items.filter((item) => item.phvaCycle === cycle), [cycle, items]);
  const answered = Object.values(responses).filter((value) => value === "met" || value === "not_met").length;
  const remaining = items.length - answered;

  async function answer(itemId: string, response: "met" | "not_met") {
    if (!canManage || saving) return;
    const previous = responses[itemId];
    setResponses((current) => ({ ...current, [itemId]: response }));
    setSaving(itemId);
    setFeedback((current) => ({ ...current, [itemId]: undefined as never }));
    const result = await saveInitialAssessmentResponse({ organizationId, assessmentId, itemId, response });
    setSaving(null);
    if (!result.ok) {
      setResponses((current) => ({ ...current, [itemId]: previous }));
      setFeedback((current) => ({ ...current, [itemId]: "error" }));
      return;
    }
    setFeedback((current) => ({ ...current, [itemId]: "saved" }));
  }

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
    <div className="grid gap-5">
      <nav aria-label="Ciclos PHVA" className="flex flex-wrap gap-2">{cycles.map((entry) => {
        const total = items.filter((item) => item.phvaCycle === entry).length;
        const done = items.filter((item) => item.phvaCycle === entry && ["met", "not_met"].includes(responses[item.id])).length;
        return <button key={entry} type="button" onClick={() => setCycle(entry)} aria-current={cycle === entry ? "step" : undefined} className={`min-h-10 rounded-[10px] border px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${cycle === entry ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"}`}>{cycleLabels[entry]} · {done}/{total}</button>;
      })}</nav>

      <section aria-labelledby={`cycle-${cycle}`} className="grid gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.09em] text-[var(--brand)]">Ciclo PHVA</p><h2 id={`cycle-${cycle}`} className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{cycleLabels[cycle]}</h2></div>
        {visible.map((item) => <article key={item.id} className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand)]">Estándar {item.code}</p><h3 className="mt-1 text-base font-semibold leading-6">{item.title}</h3></div><span className="rounded-full bg-[var(--muted-surface)] px-2.5 py-1 text-xs font-semibold">Peso {item.weight.toLocaleString("es-CO", { maximumFractionDigits: 2 })}%</span></div>
          <p className="mt-4 rounded-[10px] border border-[var(--brand-soft)] bg-[var(--brand-soft)]/45 px-4 py-3 text-sm font-medium leading-6"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand)]">Pregunta para responder</span>{buildStandardQuestion(item)}</p>
          <details className="mt-4 rounded-[10px] border border-[var(--border)] px-4 py-3 text-sm"><summary className="cursor-pointer font-semibold">Ver criterio y evidencia esperada</summary><div className="mt-3 grid gap-3 text-[var(--muted)]"><p><b className="text-[var(--foreground)]">Criterio:</b> {item.criterion ?? "No disponible en este corte histórico."}</p><p><b className="text-[var(--foreground)]">Evidencia esperada:</b> {item.expectedEvidence ?? "No disponible en este corte histórico."}</p></div></details>
          <RadioGroup className="mt-5 grid gap-3 sm:grid-cols-2" value={responses[item.id]} disabled={!canManage || saving === item.id} onValueChange={(value) => answer(item.id, value as "met" | "not_met")} aria-label={`Respuesta para ${item.code}`}>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] border border-[var(--border)] px-4 text-sm font-semibold has-[[data-state=checked]]:border-[var(--brand)] has-[[data-state=checked]]:bg-[var(--brand-soft)]"><RadioGroupItem value="met" />Sí, cumple</label>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] border border-[var(--border)] px-4 text-sm font-semibold has-[[data-state=checked]]:border-[var(--danger)] has-[[data-state=checked]]:bg-[var(--danger-soft)]"><RadioGroupItem value="not_met" />No cumple</label>
          </RadioGroup>
          <div aria-live="polite" className="mt-3 min-h-5 text-xs font-medium">{saving === item.id ? <span className="flex items-center gap-1.5 text-[var(--muted)]"><CircleNotch className="animate-spin" />Guardando…</span> : feedback[item.id] === "saved" ? <span className="flex items-center gap-1.5 text-[var(--success)]"><Check />Guardada</span> : feedback[item.id] === "error" ? <span className="flex items-center gap-1.5 text-[var(--danger)]"><WarningCircle />No pudimos guardar. Intenta nuevamente.</span> : null}</div>
        </article>)}
      </section>
    </div>

    <aside className="h-fit rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 xl:sticky xl:top-24">
      <p className="text-sm font-semibold">Avance de la evaluación</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{answered} de {items.length}</p><p className="mt-1 text-sm text-[var(--muted)]">{remaining ? `${remaining} respuestas pendientes` : "Todas las respuestas están listas"}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--muted-surface)]"><div className="h-full bg-[var(--brand)] transition-[width]" style={{ width: `${items.length ? Math.round(answered / items.length * 100) : 0}%` }} /></div>
      {!canManage ? <p className="mt-5 rounded-[10px] bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning)]">Puedes consultar la evaluación, pero no modificarla.</p> : null}
      {canManage ? <form action={completeInitialAssessment} className="mt-5"><input type="hidden" name="organizationId" value={organizationId}/><input type="hidden" name="assessmentId" value={assessmentId}/><Button className="w-full" disabled={remaining > 0 || Boolean(saving)}>{remaining ? `Faltan ${remaining} respuestas` : <><CheckCircle />Completar y calcular</>}</Button></form> : null}
      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">Marca “Sí, cumple” únicamente cuando exista evidencia verificable.</p>
    </aside>
  </div>;
}
