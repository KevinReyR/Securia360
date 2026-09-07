"use client";

import { ArrowLeft, ArrowRight, Check, CheckCircle, Info, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CiiuActivityCombobox } from "./ciiu-activity-combobox";
import { loadPublicAssessmentCatalog } from "./catalog";
import type { EconomicActivityOption } from "./economic-activities";
import { calculatePublicAssessment, createAssessmentRecord, explainSuggestedProfile, PHVA_LABELS, suggestedProfileCode } from "./logic";
import { findAssessment, saveAssessment } from "./storage";
import { PHVA_CYCLES, publicAssessmentCompanySchema, type PublicAssessmentCatalog, type PublicAssessmentCompany, type PublicAssessmentProfile, type PublicAssessmentRecord, type PublicAssessmentResponse, type StoredPublicAssessmentRecord } from "./schemas";

type Stage = "company" | "confirm" | "questions" | "review";

export function buildStandardQuestion(standard: { code: string; criterion: string | null }) {
  const criterion = standard.criterion?.trim().replace(/[.;:]+$/, "");
  if (!criterion) return `¿La empresa cumple con el estándar ${standard.code} y puede demostrarlo con evidencia verificable?`;

  const transformations: Array<[RegExp, string]> = [
    [/^Asignar\s+/i, "¿La empresa ha asignado "],
    [/^Asegurar\s+/i, "¿La empresa asegura "],
    [/^Contar con\s+/i, "¿La empresa cuenta con "],
    [/^Definir\s+/i, "¿La empresa ha definido "],
    [/^Diseñar\s+/i, "¿La empresa ha diseñado "],
    [/^Elaborar\s+/i, "¿La empresa ha elaborado "],
    [/^Establecer\s+/i, "¿La empresa ha establecido "],
    [/^Evaluar\s+/i, "¿La empresa ha evaluado "],
    [/^Garantizar\s+/i, "¿La empresa garantiza "],
    [/^Identificar\s+/i, "¿La empresa ha identificado "],
    [/^Implementar\s+/i, "¿La empresa ha implementado "],
    [/^Investigar\s+/i, "¿La empresa ha investigado "],
    [/^Mantener\s+/i, "¿La empresa mantiene "],
    [/^Medir\s+/i, "¿La empresa mide "],
    [/^Realizar\s+/i, "¿La empresa ha realizado "],
    [/^Reportar\s+/i, "¿La empresa ha reportado "],
    [/^Suministrar\s+/i, "¿La empresa ha suministrado "],
    [/^Verificar\s+/i, "¿La empresa verifica "],
  ];

  const transformation = transformations.find(([pattern]) => pattern.test(criterion));
  if (transformation) return `${criterion.replace(transformation[0], transformation[1])}?`;
  return `¿La empresa cumple con el siguiente criterio: ${criterion.charAt(0).toLowerCase()}${criterion.slice(1)}?`;
}

const emptyCompany = {
  legalName: "",
  taxId: "",
  employeeCount: "",
  riskClass: "",
  economicActivityEntryId: "",
  ciiuCode: "",
  economicActivity: "",
  economicActivityCatalogVersion: "",
  economicActivitySourceReference: "",
};

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{required ? <span className="sr-only">, obligatorio</span> : null}{children}{error ? <span className="text-xs font-medium text-[var(--danger)]">{error}</span> : null}</label>;
}

function CatalogUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto grid min-h-[55dvh] max-w-xl place-items-center text-center">
      <div>
        <WarningCircle size={38} weight="duotone" className="mx-auto text-[var(--warning)]" />
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">La evaluación no está disponible por ahora</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">No encontramos un catálogo 0312 publicado y revisado. No mostraremos contenido incompleto ni calcularemos un resultado sin una versión válida.</p>
        <Button className="mt-6" onClick={onRetry}>Intentar de nuevo</Button>
      </div>
    </div>
  );
}

export function AssessmentWizard({ resumeId }: { resumeId?: string }) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<PublicAssessmentCatalog | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("company");
  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [selectedActivity, setSelectedActivity] = useState<EconomicActivityOption | null>(null);
  const [legacyDraft, setLegacyDraft] = useState<StoredPublicAssessmentRecord | null>(null);
  const [company, setCompany] = useState<PublicAssessmentCompany | null>(null);
  const [suggestedProfile, setSuggestedProfile] = useState<PublicAssessmentProfile | null>(null);
  const [record, setRecord] = useState<PublicAssessmentRecord | null>(null);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState("");
  const [loadNonce, setLoadNonce] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const resumed = resumeId ? findAssessment(resumeId) : null;
      if (resumed?.status === "completed") {
        router.replace(`/evaluacion-inicial/${resumed.id}`);
        return;
      }
      if (resumed?.schemaVersion === 1) {
        setLegacyDraft(resumed);
        setCompanyForm({
          ...emptyCompany,
          legalName: resumed.company.legalName,
          taxId: resumed.company.taxId,
          employeeCount: String(resumed.company.employeeCount),
        });
        setSaveMessage("Selecciona la actividad CIIU para continuar este borrador anterior. Tus respuestas se conservarán si el perfil no cambia.");
        setStage("company");
      } else if (resumed) {
        setRecord(resumed);
        setCompany(resumed.company);
        const index = PHVA_CYCLES.indexOf(resumed.currentCycle);
        setCycleIndex(index < 0 ? 0 : index);
        setStage("questions");
      }
    });
    loadPublicAssessmentCatalog()
      .then((value) => { if (active) { setCatalog(value); setCatalogError(false); } })
      .catch(() => { if (active) setCatalogError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadNonce, resumeId, router]);

  const answeredCount = record ? Object.keys(record.responses).filter((code) => record.profile.standards.some((standard) => standard.code === code)).length : 0;
  const totalCount = record?.profile.standards.length ?? 0;
  const remainingCount = totalCount - answeredCount;
  const progress = totalCount ? Math.round((answeredCount / totalCount) * 100) : 0;
  const cycle = PHVA_CYCLES[cycleIndex];
  const cycleStandards = useMemo(() => record?.profile.standards.filter((standard) => standard.phvaCycle === cycle) ?? [], [record, cycle]);

  function submitCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!catalog) return;
    const parsed = publicAssessmentCompanySchema.safeParse(companyForm);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
      setFieldErrors(errors);
      return;
    }
    const code = suggestedProfileCode(parsed.data.employeeCount, parsed.data.riskClass);
    const profile = catalog.profiles.find((item) => item.code === code) ?? null;
    if (!profile) { setCatalogError(true); return; }
    setFieldErrors({});
    setCompany(parsed.data);
    setSuggestedProfile(profile);
    setStage("confirm");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function confirmProfile() {
    if (!company || !suggestedProfile) return;
    const profileChanged = legacyDraft?.profile.code !== suggestedProfile.code;
    const created = createAssessmentRecord(
      company,
      suggestedProfile,
      legacyDraft?.id,
      legacyDraft?.createdAt,
    );
    const next: PublicAssessmentRecord = legacyDraft ? {
      ...created,
      responses: profileChanged ? {} : Object.fromEntries(
        Object.entries(legacyDraft.responses).filter(([code]) => suggestedProfile.standards.some((standard) => standard.code === code)),
      ),
      currentCycle: profileChanged ? "PLAN" : legacyDraft.currentCycle,
      updatedAt: new Date().toISOString(),
    } : created;
    saveAssessment(next);
    setLegacyDraft(null);
    setRecord(next);
    setCycleIndex(0);
    setStage("questions");
    setSaveMessage(profileChanged ? "El perfil cambió y se reiniciaron las respuestas incompatibles." : "Borrador guardado en este navegador.");
    router.replace(`/evaluacion-inicial/nueva?assessment=${next.id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateRecord(transform: (current: PublicAssessmentRecord) => PublicAssessmentRecord, message: string) {
    setRecord((current) => {
      if (!current) return current;
      const next = transform(current);
      saveAssessment(next);
      return next;
    });
    setSaveMessage(message);
  }

  function answer(code: string, response: PublicAssessmentResponse) {
    updateRecord((current) => ({ ...current, responses: { ...current.responses, [code]: response }, updatedAt: new Date().toISOString() }), "Respuesta guardada automáticamente.");
  }

  function goToCycle(nextIndex: number) {
    if (!record) return;
    const bounded = Math.min(Math.max(nextIndex, 0), PHVA_CYCLES.length - 1);
    const nextCycle = PHVA_CYCLES[bounded];
    setCycleIndex(bounded);
    updateRecord((current) => ({ ...current, currentCycle: nextCycle, updatedAt: new Date().toISOString() }), "Progreso guardado.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finishAssessment() {
    if (!record || remainingCount > 0) return;
    const now = new Date().toISOString();
    const result = calculatePublicAssessment(record.profile, record.responses, now);
    const completed: PublicAssessmentRecord = { ...record, status: "completed", completedAt: now, updatedAt: now, result };
    saveAssessment(completed);
    router.push(`/evaluacion-inicial/${completed.id}`);
  }

  if (loading && !record) {
    return <div aria-label="Cargando catálogo" className="mx-auto max-w-3xl py-12"><div className="h-8 w-64 animate-pulse rounded-lg bg-black/[.06]" /><div className="mt-6 h-72 animate-pulse rounded-[16px] bg-black/[.05]" /></div>;
  }
  if (catalogError && !record) return <CatalogUnavailable onRetry={() => { setLoading(true); setLoadNonce((value) => value + 1); }} />;

  if (stage === "company") {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[var(--brand)]">Paso 1 de 3</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Configura la empresa</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Estos datos se usan únicamente para sugerir el perfil de estándares. Permanecen en este navegador.</p>
        </div>
        <form onSubmit={submitCompany} className="mt-8 grid gap-6 rounded-[16px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-control)] sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Razón social" required error={fieldErrors.legalName}><Input value={companyForm.legalName} onChange={(e) => setCompanyForm({ ...companyForm, legalName: e.target.value })} autoComplete="organization" aria-invalid={Boolean(fieldErrors.legalName)} /></Field>
            <Field label="NIT (opcional)" error={fieldErrors.taxId}><Input value={companyForm.taxId} onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })} inputMode="text" aria-invalid={Boolean(fieldErrors.taxId)} /></Field>
            <div className="grid gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium">Código CIIU y actividad económica<span className="sr-only">, obligatorio</span></span>
              <CiiuActivityCombobox
                value={selectedActivity}
                invalid={Boolean(fieldErrors.economicActivityEntryId || fieldErrors.ciiuCode)}
                onChange={(option) => {
                  setSelectedActivity(option);
                  setCompanyForm((current) => ({
                    ...current,
                    economicActivityEntryId: option.entry_id,
                    ciiuCode: option.ciiu_code,
                    economicActivity: option.activity,
                    economicActivityCatalogVersion: option.catalog_version,
                    economicActivitySourceReference: option.source_reference,
                    riskClass: String(option.risk_class),
                  }));
                  setFieldErrors((current) => ({ ...current, economicActivityEntryId: "", ciiuCode: "", economicActivity: "", riskClass: "" }));
                }}
              />
              {fieldErrors.economicActivityEntryId || fieldErrors.ciiuCode ? <span className="text-xs font-medium text-[var(--danger)]">{fieldErrors.economicActivityEntryId || fieldErrors.ciiuCode}</span> : null}
            </div>
            {selectedActivity ? (
              <div className="sm:col-span-2 rounded-[12px] border border-[var(--border)] bg-[var(--muted-surface)] px-4 py-3">
                <p className="text-xs font-semibold text-[var(--muted)]">Actividad seleccionada</p>
                <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">{selectedActivity.activity}</p>
              </div>
            ) : null}
            <Field label="Número de trabajadores" required error={fieldErrors.employeeCount}><Input value={companyForm.employeeCount} onChange={(e) => setCompanyForm({ ...companyForm, employeeCount: e.target.value })} type="number" min={1} max={1000000} inputMode="numeric" aria-invalid={Boolean(fieldErrors.employeeCount)} /></Field>
            <Field label="Clase de riesgo" required error={fieldErrors.riskClass}>
              <Input value={companyForm.riskClass ? `Clase ${["", "I", "II", "III", "IV", "V"][Number(companyForm.riskClass)]}` : "Se asigna al elegir la actividad"} readOnly aria-readonly="true" className="bg-[var(--muted-surface)]" />
            </Field>
          </div>
          {legacyDraft ? <div role="status" className="flex items-start gap-3 rounded-[12px] bg-[var(--warning-soft)] px-4 py-3 text-sm leading-6 text-[var(--warning)]"><WarningCircle size={19} className="mt-0.5 shrink-0" /><p>{saveMessage}</p></div> : null}
          <div className="flex items-start gap-3 rounded-[12px] bg-[var(--muted-surface)] px-4 py-3 text-sm leading-6 text-[var(--muted-strong)]"><Info size={19} className="mt-0.5 shrink-0 text-[var(--brand)]" /><p>Confirma que la descripción seleccionada corresponda a la actividad real de la empresa. El catálogo asigna la clase de riesgo; la selección y el perfil sugerido requieren validación profesional.</p></div>
          <Button type="submit" size="lg" className="justify-self-end">Continuar <ArrowRight size={17} /></Button>
        </form>
      </div>
    );
  }

  if (stage === "confirm" && company && suggestedProfile) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-[var(--brand)]">Paso 2 de 3</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Confirma el perfil sugerido</h1>
        <div className="mt-8 rounded-[16px] border border-[var(--success-border)] bg-white p-6 shadow-[var(--shadow-control)] sm:p-8">
          <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-[var(--success-soft)] text-[var(--brand)]"><ShieldCheck size={23} weight="duotone" /></span><div><p className="text-sm font-semibold text-[var(--brand)]">{company.legalName}</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{suggestedProfile.name}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{suggestedProfile.standards.length} estándares · {explainSuggestedProfile(company.employeeCount, company.riskClass)}</p></div></div>
          <dl className="mt-7 grid gap-4 border-t border-[var(--border)] pt-6 sm:grid-cols-2"><div><dt className="text-xs font-semibold text-[var(--muted)]">Versión del perfil</dt><dd className="mt-1 text-sm font-medium">{suggestedProfile.versionCode}</dd></div><div><dt className="text-xs font-semibold text-[var(--muted)]">Referencia</dt><dd className="mt-1 text-sm font-medium">{suggestedProfile.source.officialReference}</dd></div></dl>
          <dl className="mt-4 grid gap-4 rounded-[12px] bg-[var(--muted-surface)] p-4 sm:grid-cols-[120px_1fr]"><div><dt className="text-xs font-semibold text-[var(--muted)]">CIIU y riesgo</dt><dd className="mt-1 font-mono text-sm font-semibold">{company.ciiuCode} · Clase {["", "I", "II", "III", "IV", "V"][company.riskClass]}</dd></div><div><dt className="text-xs font-semibold text-[var(--muted)]">Actividad</dt><dd className="mt-1 text-sm leading-6">{company.economicActivity}</dd></div></dl>
          {legacyDraft && legacyDraft.profile.code !== suggestedProfile.code ? <p role="alert" className="mt-4 rounded-[12px] border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm leading-6 text-[var(--danger)]">El riesgo de la actividad cambia el perfil de {legacyDraft.profile.standards.length} a {suggestedProfile.standards.length} estándares. Al confirmar se reiniciarán las respuestas anteriores porque no son compatibles con el nuevo conjunto.</p> : null}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => setStage("company")}><ArrowLeft size={16} /> Corregir datos</Button><Button onClick={confirmProfile}>Confirmar e iniciar <ArrowRight size={16} /></Button></div>
        </div>
      </div>
    );
  }

  if (!record) return null;

  if (stage === "review") {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold text-[var(--brand)]">Revisión final</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Revisa antes de calcular</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">El resultado quedará congelado en este navegador. No modificará datos ni creará acciones en Securia360.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PHVA_CYCLES.map((item, index) => {
            const standards = record.profile.standards.filter((standard) => standard.phvaCycle === item);
            const answered = standards.filter((standard) => record.responses[standard.code]).length;
            return <button key={item} type="button" onClick={() => { setCycleIndex(index); setStage("questions"); }} className="rounded-[14px] border border-[var(--border)] bg-white p-5 text-left outline-none hover:border-[var(--brand)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]"><span className="text-sm font-semibold text-[var(--brand)]">{PHVA_LABELS[item]}</span><span className="mt-2 block text-2xl font-semibold">{answered} de {standards.length}</span><span className="mt-1 block text-xs text-[var(--muted)]">respuestas registradas</span></button>;
          })}
        </div>
        {remainingCount > 0 ? <div role="alert" className="mt-6 flex items-start gap-3 rounded-[14px] border border-[var(--warning-border)] bg-[var(--warning-soft)] px-4 py-3 text-sm"><WarningCircle size={19} className="mt-0.5 shrink-0" /><p>Faltan {remainingCount} {remainingCount === 1 ? "respuesta" : "respuestas"}. Vuelve al cuestionario para completarlas.</p></div> : <div role="status" className="mt-6 flex items-start gap-3 rounded-[14px] border border-[var(--success-border)] bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]"><CheckCircle size={19} className="mt-0.5 shrink-0" /><p>Todas las respuestas están completas. Ya puedes calcular el resultado.</p></div>}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={() => setStage("questions")}><ArrowLeft size={16} /> Volver al cuestionario</Button><Button disabled={remainingCount > 0} onClick={finishAssessment}>Finalizar y ver resultado <ArrowRight size={16} /></Button></div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
      <div className="min-w-0">
        <div className="sticky top-0 z-20 -mx-4 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 pb-4 backdrop-blur-lg lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0">
          <div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[var(--brand)]">Paso 3 de 3</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{PHVA_LABELS[cycle]}</h1></div><p className="text-right text-sm font-semibold">{progress}%<span className="block text-xs font-normal text-[var(--muted)]">{answeredCount} de {totalCount}</span></p></div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[.07]" aria-hidden="true"><div className="h-full rounded-full bg-[var(--brand)] transition-[width]" style={{ width: `${progress}%` }} /></div>
          <nav aria-label="Ciclos PHVA" className="mt-4 grid grid-cols-4 gap-1 rounded-[12px] bg-[var(--muted-surface)] p-1">
            {PHVA_CYCLES.map((item, index) => <button key={item} type="button" onClick={() => goToCycle(index)} aria-current={item === cycle ? "step" : undefined} className="rounded-[9px] px-2 py-2 text-xs font-semibold outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] aria-[current=step]:bg-white aria-[current=step]:text-[var(--brand)] aria-[current=step]:shadow-sm sm:text-sm">{PHVA_LABELS[item]}</button>)}
          </nav>
        </div>

        <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-[var(--muted-strong)]"><Info size={18} className="mt-0.5 shrink-0 text-[var(--brand)]" />Marca “Cumple” solo cuando exista evidencia verificable. Si no puedes demostrarlo, selecciona “No cumple”.</p>
        <div className="mt-5 grid gap-4">
          {cycleStandards.map((standard) => {
            const value = record.responses[standard.code];
            return (
              <article key={standard.code} className="rounded-[14px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-control)] sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-xs font-semibold text-[var(--brand)]">Estándar {standard.code}</p><h2 className="mt-2 text-lg font-semibold leading-7 tracking-[-0.02em]">{standard.title}</h2></div><span className="shrink-0 rounded-full bg-[var(--muted-surface)] px-2.5 py-1 text-xs font-semibold">Peso {standard.weight.toFixed(2)}%</span></div>
                <p className="mt-5 rounded-[10px] border border-[var(--brand-soft)] bg-[var(--brand-soft)]/45 px-4 py-3 text-sm font-medium leading-6 text-[var(--foreground)]"><span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand)]">Pregunta para responder</span>{buildStandardQuestion(standard)}</p>
                <details className="mt-5 rounded-[10px] bg-[var(--muted-surface)] px-4 py-3 text-sm"><summary className="cursor-pointer font-semibold text-[var(--muted-strong)] outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]">Ver criterio y evidencia esperada</summary><div className="mt-4 grid gap-4 border-t border-[var(--border)] pt-4 leading-6 text-[var(--muted)]"><div><h3 className="font-semibold text-[var(--foreground)]">Criterio</h3><p className="mt-1">{standard.criterion || "El catálogo publicado no contiene un criterio adicional."}</p></div><div><h3 className="font-semibold text-[var(--foreground)]">Evidencia esperada</h3><p className="mt-1">{standard.expectedEvidence || "El catálogo publicado no contiene una evidencia adicional."}</p></div></div></details>
                <RadioGroup value={value ?? ""} onValueChange={(next) => answer(standard.code, next as PublicAssessmentResponse)} aria-label={`Respuesta para el estándar ${standard.code}`} className="mt-5 sm:grid-cols-2">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-[11px] border px-4 py-3 text-sm font-semibold transition-colors ${value === "met" ? "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"}`}><RadioGroupItem value="met" /><Check size={17} /> Cumple</label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-[11px] border px-4 py-3 text-sm font-semibold transition-colors ${value === "not_met" ? "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"}`}><RadioGroupItem value="not_met" /><WarningCircle size={17} /> No cumple</label>
                </RadioGroup>
              </article>
            );
          })}
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button variant="secondary" disabled={cycleIndex === 0} onClick={() => goToCycle(cycleIndex - 1)}><ArrowLeft size={16} /> Anterior</Button>{cycleIndex < PHVA_CYCLES.length - 1 ? <Button onClick={() => goToCycle(cycleIndex + 1)}>Siguiente ciclo <ArrowRight size={16} /></Button> : <Button onClick={() => { setStage("review"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Revisar respuestas <ArrowRight size={16} /></Button>}</div>
      </div>

      <aside className="sticky top-6 hidden rounded-[14px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-control)] lg:block">
        <p className="text-xs font-semibold text-[var(--muted)]">Evaluando</p><h2 className="mt-1 truncate font-semibold">{record.company.legalName}</h2><p className="mt-1 text-sm text-[var(--muted)]">{record.profile.name}</p>
        <dl className="mt-5 grid gap-4 border-t border-[var(--border)] pt-5"><div><dt className="text-xs text-[var(--muted)]">Progreso</dt><dd className="mt-1 text-2xl font-semibold">{answeredCount} / {totalCount}</dd></div><div><dt className="text-xs text-[var(--muted)]">Sin responder</dt><dd className="mt-1 font-semibold">{remainingCount}</dd></div></dl>
        <p aria-live="polite" className="mt-5 min-h-10 text-xs leading-5 text-[var(--success)]">{saveMessage}</p>
        <Button variant="secondary" className="mt-2 w-full" onClick={() => setStage("review")}>Revisar evaluación</Button>
      </aside>
      <p aria-live="polite" className="fixed inset-x-4 bottom-4 z-30 rounded-[10px] border border-[var(--success-border)] bg-white px-4 py-3 text-center text-xs font-medium text-[var(--success)] shadow-lg lg:hidden">{saveMessage || `${remainingCount} respuestas pendientes`}</p>
    </div>
  );
}
