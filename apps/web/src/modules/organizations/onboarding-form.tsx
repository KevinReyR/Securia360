"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { completeOnboarding } from "./core-actions";
import { onboardingSchema } from "./schemas";

type InputValues = z.input<typeof onboardingSchema>;
type Values = z.output<typeof onboardingSchema>;
const booleanFields: Array<{ name: keyof Values; label: string }> = [
  { name: "work_at_height", label: "Trabajo en alturas" },
  { name: "confined_spaces", label: "Espacios confinados" },
  { name: "chemical_exposure", label: "Exposición química" },
  { name: "electrical_work", label: "Trabajo eléctrico" },
  { name: "transport_operations", label: "Operaciones de transporte" },
  { name: "heavy_machinery", label: "Maquinaria pesada" },
  { name: "night_work", label: "Trabajo nocturno" },
  { name: "remote_work", label: "Trabajo remoto" },
  { name: "manual_load_handling", label: "Manipulación manual de cargas" },
];

export function OnboardingForm({ organizationId }: { organizationId: string }) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<InputValues, unknown, Values>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { employee_count: 0, risk_class: 1, work_at_height: false, confined_spaces: false, chemical_exposure: false, electrical_work: false, transport_operations: false, heavy_machinery: false, night_work: false, remote_work: false, manual_load_handling: false },
  });
  const submit = handleSubmit((_values, event) => {
    const form = event?.target as HTMLFormElement;
    startTransition(() => completeOnboarding(new FormData(form)));
  });
  return (
    <form onSubmit={submit} className="grid gap-6">
      <input type="hidden" name="organizationId" value={organizationId} />
      <ol className="grid grid-cols-3 gap-2 text-xs font-semibold"><li className={step >= 0 ? "text-[var(--brand)]" : "text-[var(--muted)]"}>Empresa</li><li className={step >= 1 ? "text-[var(--brand)]" : "text-[var(--muted)]"}>Sede principal</li><li className={step >= 2 ? "text-[var(--brand)]" : "text-[var(--muted)]"}>Caracterización</li></ol>
      {step === 0 ? <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="sr-only">Datos empresariales</legend><Field label="Razón social" error={errors.legal_name?.message}><Input {...register("legal_name")} /></Field><Field label="Nombre comercial"><Input {...register("trade_name")} /></Field><Field label="NIT" error={errors.tax_id?.message}><Input {...register("tax_id")} /></Field><Field label="Código CIIU" error={errors.ciiu_code?.message}><Input {...register("ciiu_code")} /></Field><Field label="Actividad económica" error={errors.economic_activity?.message} className="sm:col-span-2"><Input {...register("economic_activity")} /></Field><Field label="Número de trabajadores"><Input type="number" min={0} {...register("employee_count", { valueAsNumber: true })} /></Field><Field label="Clase de riesgo"><Select {...register("risk_class", { valueAsNumber: true })}><option value={1}>I</option><option value={2}>II</option><option value={3}>III</option><option value={4}>IV</option><option value={5}>V</option></Select></Field></fieldset> : null}
      {step === 1 ? <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="sr-only">Sede principal</legend><Field label="Nombre de la sede" error={errors.site_name?.message}><Input {...register("site_name")} /></Field><Field label="Código" error={errors.site_code?.message}><Input {...register("site_code")} /></Field><Field label="Ciudad"><Input {...register("city")} /></Field><Field label="Departamento"><Input {...register("department")} /></Field></fieldset> : null}
      {step === 2 ? <fieldset><legend className="mb-3 text-sm font-semibold">Selecciona las condiciones presentes en la operación</legend><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{booleanFields.map((field) => <label key={field.name} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-3 text-sm"><input type="checkbox" className="size-4 accent-[var(--brand)]" {...register(field.name)} />{field.label}</label>)}</div></fieldset> : null}
      {Object.keys(errors).length ? <p role="alert" className="text-sm text-[var(--danger)]">Completa los campos requeridos antes de finalizar.</p> : null}
      <div className="flex justify-between border-t border-[var(--border)] pt-5"><Button type="button" variant="secondary" disabled={step === 0 || pending} onClick={() => setStep((current) => current - 1)}>Anterior</Button>{step < 2 ? <Button type="button" onClick={() => setStep((current) => current + 1)}>Continuar</Button> : <Button type="submit" disabled={pending}>{pending ? "Guardando..." : "Finalizar configuración"}</Button>}</div>
    </form>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return <label className={`grid gap-2 text-sm font-medium ${className ?? ""}`}>{label}{children}{error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}</label>;
}
