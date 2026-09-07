"use client";

import { ArrowRight, CheckCircle, Printer, ShieldCheck, Trash, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatColombiaDate, PHVA_LABELS, RESULT_BANDS } from "./logic";
import { deleteAssessment, findAssessment } from "./storage";
import type { StoredPublicAssessmentRecord } from "./schemas";

const OFFICIAL_RESOLUTION_URL = "https://www1.funcionpublica.gov.co/documents/34645357/34703621/Resolucion_0312_de_2019.pdf/3c93008d-dd8e-8b0d-e5ea-ec6699db86e7";

function MissingResult() {
  return <div className="mx-auto grid min-h-[60dvh] max-w-xl place-items-center text-center"><div><WarningCircle size={40} weight="duotone" className="mx-auto text-[var(--warning)]" /><h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">No encontramos este resultado</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Las evaluaciones existen únicamente en el navegador donde se realizaron. El enlace no transfiere respuestas a otro dispositivo ni a Securia360.</p><Button asChild className="mt-6"><Link href="/evaluacion-inicial/nueva">Iniciar otra evaluación <ArrowRight size={16} /></Link></Button></div></div>;
}

export function AssessmentResultView({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<StoredPublicAssessmentRecord | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) setRecord(findAssessment(assessmentId)); });
    return () => { active = false; };
  }, [assessmentId]);

  if (record === undefined) return <div aria-label="Cargando resultado" className="mx-auto max-w-4xl py-12"><div className="h-48 animate-pulse rounded-[16px] bg-black/[.05]" /></div>;
  if (!record) return <MissingResult />;
  if (record.status !== "completed" || !record.result) {
    return <div className="mx-auto grid min-h-[60dvh] max-w-xl place-items-center text-center"><div><ShieldCheck size={40} weight="duotone" className="mx-auto text-[var(--brand)]" /><h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">Esta evaluación sigue en borrador</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Completa todos los estándares para congelar el resultado.</p><Button asChild className="mt-6"><Link href={`/evaluacion-inicial/nueva?assessment=${record.id}`}>Continuar evaluación <ArrowRight size={16} /></Link></Button></div></div>;
  }

  const { result } = record;
  const band = RESULT_BANDS[result.band];

  function remove() {
    if (!window.confirm("¿Eliminar este resultado del navegador? Esta acción no se puede deshacer.")) return;
    deleteAssessment(record!.id);
    router.push("/evaluacion-inicial");
  }

  return (
    <article className="public-assessment-result mx-auto max-w-[1120px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div><p className="text-sm font-semibold text-[var(--brand)]">Resultado guardado localmente</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Evaluación inicial SG-SST</h1></div>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => window.print()}><Printer size={17} /> Imprimir o guardar PDF</Button><Button variant="ghost" onClick={remove}><Trash size={17} /> Eliminar</Button></div>
      </div>

      <section className="mt-8 grid overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[var(--shadow-control)] md:grid-cols-[.9fr_1.1fr] print:mt-4">
        <div className="bg-[var(--brand)] p-7 text-white sm:p-10">
          <p className="text-sm font-semibold text-emerald-100">Puntaje ponderado</p>
          <p className="mt-3 text-6xl font-semibold tracking-[-0.065em]">{result.score.toFixed(2)}</p>
          <p className="mt-1 text-sm text-emerald-100">sobre 100 puntos</p>
          <span className="mt-7 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">{band.label}</span>
          <p className="mt-4 text-sm leading-6 text-emerald-50">{band.description}</p>
        </div>
        <div className="p-7 sm:p-10">
          <h2 className="text-xl font-semibold tracking-[-0.025em]">{record.company.legalName}</h2>
          <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div><dt className="text-xs font-semibold text-[var(--muted)]">Perfil evaluado</dt><dd className="mt-1 text-sm font-medium">{record.profile.name}</dd></div>
            <div><dt className="text-xs font-semibold text-[var(--muted)]">Versión</dt><dd className="mt-1 text-sm font-medium">{record.profile.versionCode}</dd></div>
            <div><dt className="text-xs font-semibold text-[var(--muted)]">Estándares cumplidos</dt><dd className="mt-1 text-2xl font-semibold text-[var(--success)]">{result.metCount}</dd></div>
            <div><dt className="text-xs font-semibold text-[var(--muted)]">Estándares no cumplidos</dt><dd className="mt-1 text-2xl font-semibold text-[var(--danger)]">{result.notMetCount}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-semibold text-[var(--muted)]">Finalizada, hora de Colombia</dt><dd className="mt-1 text-sm font-medium">{formatColombiaDate(record.completedAt!)}</dd></div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="phva-results" className="mt-10">
        <h2 id="phva-results" className="text-2xl font-semibold tracking-[-0.03em]">Resultado por ciclo PHVA</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {result.cycleResults.map((cycle) => <div key={cycle.cycle} className="rounded-[14px] border border-[var(--border)] bg-white p-5"><p className="text-sm font-semibold text-[var(--brand)]">{PHVA_LABELS[cycle.cycle]}</p><p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{cycle.percentage.toFixed(2)}%</p><p className="mt-1 text-xs text-[var(--muted)]">{cycle.achieved.toFixed(2)} de {cycle.possible.toFixed(2)} puntos posibles</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[.07]" aria-hidden="true"><div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${cycle.percentage}%` }} /></div></div>)}
        </div>
      </section>

      <section aria-labelledby="gaps-title" className="mt-12">
        <div className="max-w-2xl"><p className="text-sm font-semibold text-[var(--danger)]">Prioridad de trabajo</p><h2 id="gaps-title" className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Brechas ordenadas por peso</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Comienza por revisar las brechas de mayor peso, pero confirma la prioridad con el contexto y el criterio profesional de la organización.</p></div>
        {result.gaps.length === 0 ? <div className="mt-5 flex items-start gap-3 rounded-[14px] border border-[var(--success-border)] bg-[var(--success-soft)] px-5 py-4 text-sm text-[var(--success)]"><CheckCircle size={20} className="mt-0.5 shrink-0" /><p>No registraste brechas. Conserva y verifica las evidencias que sustentan cada respuesta.</p></div> : <div className="mt-5 grid gap-3">{result.gaps.map((standard, index) => <article key={standard.code} className="rounded-[14px] border border-[var(--border)] bg-white p-5 sm:p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-xs font-semibold text-[var(--danger)]">Prioridad {index + 1} · Estándar {standard.code}</p><h3 className="mt-2 font-semibold leading-6">{standard.title}</h3></div><span className="shrink-0 text-sm font-semibold">{standard.weight.toFixed(2)} puntos</span></div><div className="mt-5 grid gap-4 border-t border-[var(--border)] pt-4 text-sm leading-6 md:grid-cols-2"><div><h4 className="font-semibold">Criterio</h4><p className="mt-1 text-[var(--muted)]">{standard.criterion || "Sin criterio adicional publicado."}</p></div><div><h4 className="font-semibold">Evidencia esperada</h4><p className="mt-1 text-[var(--muted)]">{standard.expectedEvidence || "Sin evidencia adicional publicada."}</p></div></div></article>)}</div>}
      </section>

      <details className="mt-10 rounded-[14px] border border-[var(--border)] bg-white p-5 print:break-before-page" open={result.gaps.length === 0}>
        <summary className="cursor-pointer font-semibold outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]">Ver {result.metStandards.length} estándares cumplidos</summary>
        <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-5">{result.metStandards.map((standard) => <div key={standard.code} className="flex items-start gap-3 text-sm"><CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-[var(--success)]" /><div><p className="font-semibold">{standard.code} · {standard.title}</p><p className="mt-1 text-xs text-[var(--muted)]">Peso {standard.weight.toFixed(2)}%</p></div></div>)}</div>
      </details>

      <aside className="mt-10 rounded-[16px] border border-[var(--warning-border)] bg-[var(--warning-soft)] p-5 text-sm leading-6 text-[var(--warning)] sm:p-6">
        <h2 className="font-semibold">Resultado orientativo</h2>
        <p className="mt-2">Este diagnóstico ayuda a priorizar el trabajo. No sustituye la autoevaluación formal, las evidencias, la interpretación normativa ni la revisión de una persona competente.</p>
        <p className="mt-3">Consulta la <a href={OFFICIAL_RESOLUTION_URL} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-4">Resolución 0312 de 2019 en Función Pública</a>.</p>
      </aside>

      <section className="mt-10 flex flex-col justify-between gap-6 rounded-[16px] bg-[var(--brand)] p-6 text-white sm:flex-row sm:items-center sm:p-8 print:hidden">
        <div><h2 className="text-xl font-semibold">Continúa la gestión en Securia360</h2><p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100">Crea una cuenta para organizar responsables, evidencias, tareas y seguimiento. Este resultado local no se importará automáticamente.</p></div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row"><Button variant="secondary" asChild><Link href="/auth/login">Ya tengo una cuenta</Link></Button><Button className="bg-white text-[var(--brand)] hover:bg-emerald-50" asChild><Link href="/auth/signup">Crear cuenta <ArrowRight size={16} /></Link></Button></div>
      </section>
    </article>
  );
}
