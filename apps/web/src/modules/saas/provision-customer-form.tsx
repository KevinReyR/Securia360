"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { provisionCustomer, type ProvisionCustomerActionState } from "./actions";

type PlanVersionOption = {
  id: string;
  label: string;
};

const initialState: ProvisionCustomerActionState = { status: "idle" };

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return <p id={id} className="text-xs font-normal leading-5 text-[var(--danger)]">{errors[0]}</p>;
}

export function ProvisionCustomerForm({ planVersions }: { planVersions: PlanVersionOption[] }) {
  const [state, formAction, pending] = useActionState(provisionCustomer, initialState);
  const [commercialStatus, setCommercialStatus] = useState("trialing");
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid min-w-0 gap-4">
      <label className="grid min-w-0 gap-1.5 text-sm font-medium">
        Código de empresa
        <Input name="code" defaultValue={state.fields?.code} required placeholder="EMPRESA_DEMO" aria-invalid={Boolean(errors.code)} aria-describedby={errors.code ? "customer-code-error" : undefined} />
        <FieldError id="customer-code-error" errors={errors.code} />
      </label>

      <label className="grid min-w-0 gap-1.5 text-sm font-medium">
        Nombre de empresa
        <Input name="name" defaultValue={state.fields?.name} required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "customer-name-error" : undefined} />
        <FieldError id="customer-name-error" errors={errors.name} />
      </label>

      <label className="grid min-w-0 gap-1.5 text-sm font-medium">
        Correo del administrador
        <Input name="administratorEmail" type="email" autoComplete="email" defaultValue={state.fields?.administratorEmail} required aria-invalid={Boolean(errors.administratorEmail)} aria-describedby={errors.administratorEmail ? "customer-email-error" : undefined} />
        <FieldError id="customer-email-error" errors={errors.administratorEmail} />
      </label>

      <label className="grid min-w-0 gap-1.5 text-sm font-medium">
        Versión publicada
        <Select name="planVersionId" defaultValue={state.fields?.planVersionId} required disabled={!planVersions.length} aria-invalid={Boolean(errors.planVersionId)} aria-describedby={errors.planVersionId ? "customer-plan-error" : undefined}>
          {planVersions.length ? planVersions.map((version) => <option key={version.id} value={version.id}>{version.label}</option>) : <option value="">No hay versiones publicadas</option>}
        </Select>
        <FieldError id="customer-plan-error" errors={errors.planVersionId} />
      </label>

      <label className="grid min-w-0 gap-1.5 text-sm font-medium">
        Estado
        <Select name="status" value={commercialStatus} onChange={(event) => setCommercialStatus(event.target.value)} aria-invalid={Boolean(errors.status)} aria-describedby="customer-status-help">
          <option value="trialing">En prueba</option>
          <option value="active">Activa</option>
          <option value="past_due">Pago pendiente</option>
          <option value="suspended">Suspendida</option>
          <option value="cancelled">Cancelada</option>
        </Select>
        <p id="customer-status-help" className="text-xs font-normal leading-5 text-[var(--muted)]">Si eliges “En prueba”, debes indicar cuándo termina el trial.</p>
        <FieldError id="customer-status-error" errors={errors.status} />
      </label>

      <fieldset className="grid min-w-0 gap-3 rounded-xl border border-[var(--border)] p-4">
        <legend className="px-1 text-sm font-semibold">Fechas comerciales</legend>
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">
          Prueba hasta {commercialStatus === "trialing" ? <span className="text-[var(--danger)]" aria-hidden="true">*</span> : null}
          <Input name="trialEndsAt" type="datetime-local" defaultValue={state.fields?.trialEndsAt} required={commercialStatus === "trialing"} aria-invalid={Boolean(errors.trialEndsAt)} aria-describedby={errors.trialEndsAt ? "customer-trial-error" : undefined} />
          <FieldError id="customer-trial-error" errors={errors.trialEndsAt} />
        </label>
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">
          Inicio del período
          <Input name="periodStart" type="datetime-local" defaultValue={state.fields?.periodStart} aria-invalid={Boolean(errors.periodStart)} aria-describedby={errors.periodStart ? "customer-period-start-error" : undefined} />
          <FieldError id="customer-period-start-error" errors={errors.periodStart} />
        </label>
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">
          Fin del período
          <Input name="periodEnd" type="datetime-local" defaultValue={state.fields?.periodEnd} aria-invalid={Boolean(errors.periodEnd)} aria-describedby={errors.periodEnd ? "customer-period-end-error" : undefined} />
          <FieldError id="customer-period-end-error" errors={errors.periodEnd} />
        </label>
      </fieldset>

      <label className="grid min-w-0 gap-1.5 text-sm font-medium">
        Referencia de cliente
        <Input name="customerReference" defaultValue={state.fields?.customerReference} aria-invalid={Boolean(errors.customerReference)} aria-describedby={errors.customerReference ? "customer-reference-error" : undefined} />
        <FieldError id="customer-reference-error" errors={errors.customerReference} />
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm font-medium">
        Referencia de suscripción
        <Input name="subscriptionReference" defaultValue={state.fields?.subscriptionReference} aria-invalid={Boolean(errors.subscriptionReference)} aria-describedby={errors.subscriptionReference ? "subscription-reference-error" : undefined} />
        <FieldError id="subscription-reference-error" errors={errors.subscriptionReference} />
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm font-medium">
        Nota comercial
        <Textarea name="note" defaultValue={state.fields?.note} aria-invalid={Boolean(errors.note)} aria-describedby={errors.note ? "customer-note-error" : undefined} />
        <FieldError id="customer-note-error" errors={errors.note} />
      </label>

      {state.status === "error" && state.message ? <Alert variant="danger">{state.message}</Alert> : null}

      <Button type="submit" disabled={pending || !planVersions.length}>
        {pending ? "Creando empresa..." : "Crear empresa e invitar administrador"}
      </Button>
    </form>
  );
}
