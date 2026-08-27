"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Plus, Trash } from "@phosphor-icons/react";
import { useMemo, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { completeOnboarding, saveOnboardingStep } from "./core-actions";
import { onboardingSchema } from "./schemas";

type InputValues = z.input<typeof onboardingSchema>;
type Values = z.output<typeof onboardingSchema>;

export type OnboardingMemberOption = { id: string; label: string };

type OnboardingFormProps = {
  organizationId: string;
  initialStep: number;
  initialValues: InputValues;
  members: OnboardingMemberOption[];
};

const steps = [
  { title: "Organización", description: "Identidad del tenant" },
  { title: "Razón social", description: "Entidad jurídica principal" },
  { title: "Actividad económica", description: "Descripción de la operación" },
  { title: "CIIU", description: "Clasificación económica" },
  { title: "Trabajadores", description: "Fuente para aplicabilidad" },
  { title: "Clase de riesgo", description: "Clasificación vigente" },
  { title: "Sedes", description: "Ubicaciones operativas" },
  { title: "Responsable SST", description: "Miembro responsable" },
  { title: "Caracterización", description: "Condiciones de la operación" },
] as const;

const stepFields: Record<number, string[]> = {
  1: ["organization.name", "organization.nit"],
  2: ["legal_entity.legal_name", "legal_entity.trade_name", "legal_entity.tax_id"],
  3: ["economic_activity.economic_activity"],
  4: ["ciiu.ciiu_code"],
  5: ["workforce.employee_count"],
  6: ["risk.risk_class"],
  7: ["sites"],
  8: ["responsible.member_id"],
  9: ["characteristics"],
};

const characteristicFields = [
  ["work_at_height", "Trabajo en alturas"],
  ["confined_spaces", "Espacios confinados"],
  ["chemical_exposure", "Exposición química"],
  ["electrical_work", "Trabajo eléctrico"],
  ["transport_operations", "Operaciones de transporte"],
  ["heavy_machinery", "Maquinaria pesada"],
  ["night_work", "Trabajo nocturno"],
  ["remote_work", "Trabajo remoto"],
  ["manual_load_handling", "Manipulación manual de cargas"],
] as const;

export function OnboardingForm({ organizationId, initialStep, initialValues, members }: OnboardingFormProps) {
  const firstStep = Math.min(Math.max(initialStep, 1), 9);
  const [step, setStep] = useState(firstStep);
  const [maxReached, setMaxReached] = useState(firstStep);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<InputValues, unknown, Values>({ resolver: zodResolver(onboardingSchema), defaultValues: initialValues, mode: "onTouched" });
  const sites = useFieldArray({ control: form.control, name: "sites" });
  const progress = useMemo(() => Math.round((step / steps.length) * 100), [step]);

  function dataForStep(currentStep: number) {
    const values = form.getValues();
    switch (currentStep) {
      case 1: return values.organization;
      case 2: return values.legal_entity;
      case 3: return values.economic_activity;
      case 4: return values.ciiu;
      case 5: return values.workforce;
      case 6: return values.risk;
      case 7: return values.sites;
      case 8: return values.responsible;
      default: return values.characteristics;
    }
  }

  async function saveCurrentStep() {
    setMessage(null);
    const valid = await form.trigger(stepFields[step] as Parameters<typeof form.trigger>[0], { shouldFocus: true });
    if (!valid) return false;
    const result = await saveOnboardingStep({ organizationId, step, data: dataForStep(step) });
    if (!result.ok) {
      setMessage(result.message);
      return false;
    }
    setMaxReached((current) => Math.max(current, result.currentStep));
    return true;
  }

  function continueFlow() {
    startTransition(async () => {
      if (await saveCurrentStep()) setStep((current) => Math.min(current + 1, 9));
    });
  }

  function finishFlow() {
    startTransition(async () => {
      if (!(await saveCurrentStep())) return;
      const storageKey = `securia360:onboarding:${organizationId}`;
      const idempotencyKey = window.localStorage.getItem(storageKey) ?? window.crypto.randomUUID();
      window.localStorage.setItem(storageKey, idempotencyKey);
      await completeOnboarding(organizationId, idempotencyKey);
    });
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside aria-label="Progreso del onboarding">
        <div className="mb-5 flex items-center justify-between text-sm"><span className="font-semibold">Paso {step} de 9</span><span className="text-[var(--muted)]">{progress}%</span></div>
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[var(--muted-surface)]" aria-hidden="true"><div className="h-full rounded-full bg-[var(--brand)] transition-[width]" style={{ width: `${progress}%` }} /></div>
        <ol className="grid gap-1">
          {steps.map((item, index) => {
            const number = index + 1;
            const available = number <= maxReached;
            return <li key={item.title}><button type="button" disabled={!available || pending} aria-current={number === step ? "step" : undefined} onClick={() => setStep(number)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-[var(--muted-surface)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-45 aria-[current=step]:bg-emerald-50 aria-[current=step]:text-[var(--brand-strong)]"><span className="grid size-7 shrink-0 place-items-center rounded-full border border-current text-xs font-bold">{number < maxReached ? <CheckCircle weight="fill" aria-hidden="true" /> : number}</span><span>{item.title}</span></button></li>;
          })}
        </ol>
      </aside>

      <form onSubmit={(event) => event.preventDefault()} className="min-w-0">
        <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">{steps[step - 1].description}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">{steps[step - 1].title}</h2></div>
        {step === 1 ? <div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre de la organización" error={form.formState.errors.organization?.name?.message}><Input {...form.register("organization.name")} autoComplete="organization" /></Field><Field label="NIT" error={form.formState.errors.organization?.nit?.message}><Input {...form.register("organization.nit")} /></Field></div> : null}
        {step === 2 ? <div className="grid gap-4 sm:grid-cols-2"><Field label="Razón social" error={form.formState.errors.legal_entity?.legal_name?.message}><Input {...form.register("legal_entity.legal_name")} /></Field><Field label="Nombre comercial" error={form.formState.errors.legal_entity?.trade_name?.message}><Input {...form.register("legal_entity.trade_name")} /></Field><Field label="Identificación tributaria" error={form.formState.errors.legal_entity?.tax_id?.message} className="sm:col-span-2"><Input {...form.register("legal_entity.tax_id")} /></Field></div> : null}
        {step === 3 ? <Field label="Actividad económica principal" error={form.formState.errors.economic_activity?.economic_activity?.message}><Input {...form.register("economic_activity.economic_activity")} placeholder="Describe brevemente la actividad principal" /></Field> : null}
        {step === 4 ? <Field label="Código CIIU" error={form.formState.errors.ciiu?.ciiu_code?.message}><Input {...form.register("ciiu.ciiu_code")} inputMode="numeric" maxLength={4} placeholder="Ej. 6201" /></Field> : null}
        {step === 5 ? <Field label="Número de trabajadores" error={form.formState.errors.workforce?.employee_count?.message}><Input type="number" min={0} max={10_000_000} {...form.register("workforce.employee_count", { valueAsNumber: true })} /></Field> : null}
        {step === 6 ? <Field label="Clase de riesgo"><Select {...form.register("risk.risk_class", { valueAsNumber: true })}><option value={1}>I — Riesgo mínimo</option><option value={2}>II — Riesgo bajo</option><option value={3}>III — Riesgo medio</option><option value={4}>IV — Riesgo alto</option><option value={5}>V — Riesgo máximo</option></Select></Field> : null}
        {step === 7 ? <div className="grid gap-4">{sites.fields.map((site, index) => <fieldset key={site.id} className="grid gap-4 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-2"><legend className="px-2 text-sm font-semibold">Sede {index + 1}</legend><Field label="Nombre" error={form.formState.errors.sites?.[index]?.name?.message}><Input {...form.register(`sites.${index}.name`)} /></Field><Field label="Código" error={form.formState.errors.sites?.[index]?.code?.message}><Input {...form.register(`sites.${index}.code`)} /></Field><Field label="Dirección"><Input {...form.register(`sites.${index}.address`)} /></Field><Field label="Ciudad"><Input {...form.register(`sites.${index}.city`)} /></Field><Field label="Departamento"><Input {...form.register(`sites.${index}.department`)} /></Field><div className="flex items-end justify-end"><Button type="button" size="sm" variant="ghost" disabled={sites.fields.length === 1} onClick={() => sites.remove(index)}><Trash aria-hidden="true" /> Retirar sede</Button></div></fieldset>)}<Button type="button" variant="secondary" className="justify-self-start" onClick={() => sites.append({ name: "", code: "", address: "", city: "", department: "" })}><Plus aria-hidden="true" /> Agregar sede</Button></div> : null}
        {step === 8 ? <div className="grid gap-4"><Field label="Miembro responsable del SG-SST" error={form.formState.errors.responsible?.member_id?.message}><Select {...form.register("responsible.member_id")}><option value="">Selecciona un miembro activo</option>{members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</Select></Field><p className="text-sm text-[var(--muted)]">Al finalizar se asignará el rol global Responsable SST sin retirar los roles existentes.</p></div> : null}
        {step === 9 ? <fieldset><legend className="mb-4 text-sm font-semibold">Selecciona las condiciones presentes en la operación</legend><div className="grid gap-3 sm:grid-cols-2">{characteristicFields.map(([name, label]) => <Controller key={name} control={form.control} name={`characteristics.${name}`} render={({ field }) => <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-3 text-sm transition-colors hover:bg-[var(--muted-surface)]"><Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />{label}</label>} />)}</div></fieldset> : null}
        {message ? <Alert variant="danger" className="mt-6">{message}</Alert> : null}
        <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-[var(--border)] pt-5"><Button type="button" variant="secondary" disabled={step === 1 || pending} onClick={() => setStep((current) => Math.max(current - 1, 1))}>Anterior</Button>{step < 9 ? <Button type="button" disabled={pending} onClick={continueFlow}>{pending ? "Guardando…" : "Guardar y continuar"}</Button> : <Button type="button" disabled={pending} onClick={finishFlow}>{pending ? "Finalizando…" : "Finalizar configuración"}</Button>}</div>
      </form>
    </div>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return <label className={`grid gap-2 text-sm font-medium ${className ?? ""}`}>{label}{children}{error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}</label>;
}
