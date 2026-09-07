"use client";

import { ArrowRight, ClockCounterClockwise, FileText, ShieldCheck, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearAssessments, deleteAssessment, PUBLIC_ASSESSMENT_STORAGE_KEY, PUBLIC_ASSESSMENTS_CHANGED_EVENT, readAssessments } from "./storage";
import { formatColombiaDate, RESULT_BANDS } from "./logic";
import type { StoredPublicAssessmentRecord } from "./schemas";

export function AssessmentHistory() {
  const [records, setRecords] = useState<StoredPublicAssessmentRecord[]>([]);
  const [corrupted, setCorrupted] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const result = readAssessments();
    setRecords(result.records);
    setCorrupted(result.corrupted);
    setStorageAvailable(result.available);
    setReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== PUBLIC_ASSESSMENT_STORAGE_KEY) return;
      refresh();
    };
    const onVisibilityChange = () => { if (document.visibilityState === "visible") refresh(); };

    queueMicrotask(() => { if (active) refresh(); });
    window.addEventListener(PUBLIC_ASSESSMENTS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener(PUBLIC_ASSESSMENTS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  function removeOne(record: StoredPublicAssessmentRecord) {
    if (!window.confirm(`¿Eliminar la evaluación de ${record.company.legalName}? Esta acción no se puede deshacer.`)) return;
    if (!deleteAssessment(record.id)) refresh();
  }

  function removeAll() {
    if (!window.confirm("¿Eliminar todo el historial guardado en este navegador? Esta acción no se puede deshacer.")) return;
    if (!clearAssessments()) refresh();
  }

  if (!ready) {
    return <div aria-label="Cargando evaluaciones" className="mt-8 grid gap-3"><div className="h-28 animate-pulse rounded-[14px] bg-black/[.05]" /><div className="h-28 animate-pulse rounded-[14px] bg-black/[.05]" /></div>;
  }

  return (
    <section aria-labelledby="assessment-history-title" className="mt-12 border-t border-[var(--border)] pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--brand)]">En este navegador</p>
          <h2 id="assessment-history-title" className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Tus evaluaciones</h2>
        </div>
        {records.length > 0 ? <Button variant="ghost" onClick={removeAll}><Trash size={16} /> Eliminar historial</Button> : null}
      </div>

      {corrupted ? (
        <div role="status" className="mt-5 rounded-[14px] border border-[var(--warning-border)] bg-[var(--warning-soft)] px-4 py-3 text-sm leading-6 text-[var(--warning)]">
          Encontramos información local dañada o de una versión anterior. Recuperamos las evaluaciones válidas y omitimos lo que no podía leerse.
        </div>
      ) : null}

      {!storageAvailable ? (
        <div role="alert" className="mt-5 rounded-[14px] border border-[var(--warning-border)] bg-[var(--warning-soft)] px-4 py-3 text-sm leading-6 text-[var(--warning)]">
          Este navegador está bloqueando el almacenamiento local, por lo que no podemos mostrar ni conservar evaluaciones aquí. Habilita los datos del sitio para Securia360 y vuelve a intentarlo.
          <Button variant="ghost" className="ml-2 h-auto px-1 py-0 align-baseline" onClick={refresh}>Reintentar</Button>
        </div>
      ) : null}

      {!storageAvailable ? null : records.length === 0 ? (
        <div className="mt-6 grid min-h-56 place-items-center rounded-[16px] border border-dashed border-[var(--border-strong)] bg-white px-6 text-center">
          <div className="max-w-md py-10">
            <ClockCounterClockwise size={32} weight="duotone" className="mx-auto text-[var(--brand)]" />
            <h3 className="mt-4 text-lg font-semibold">Aún no hay evaluaciones guardadas</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Comienza una evaluación gratuita. Podrás cerrarla y continuar después desde este mismo navegador.</p>
            <Button asChild className="mt-5"><Link href="/evaluacion-inicial/nueva">Crear evaluación <ArrowRight size={16} /></Link></Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {records.map((record) => {
            const completed = record.status === "completed" && record.result;
            const target = completed ? `/evaluacion-inicial/${record.id}` : `/evaluacion-inicial/nueva?assessment=${record.id}`;
            return (
              <article key={record.id} className="grid gap-5 rounded-[14px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-control)] md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[var(--success-soft)] text-[var(--brand)]">
                    {completed ? <ShieldCheck size={20} weight="duotone" /> : <FileText size={20} weight="duotone" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{record.company.legalName}</h3>
                      <span className="rounded-full bg-[var(--muted-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--muted-strong)]">{completed ? RESULT_BANDS[record.result!.band].label : "En borrador"}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">{record.profile.standards.length} estándares · Actualizada {formatColombiaDate(record.updatedAt)}</p>
                    {completed ? <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--brand)]">{record.result!.score.toFixed(2)} / 100</p> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button asChild><Link href={target}>{completed ? "Ver resultado" : "Continuar"} <ArrowRight size={16} /></Link></Button>
                  <Button variant="ghost" aria-label={`Eliminar evaluación de ${record.company.legalName}`} onClick={() => removeOne(record)}><Trash size={17} /></Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
