"use client";

import { CaretDown, CheckCircle, Plus, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { presentStatus } from "@/lib/status-presentation";
import { createImprovementAction, type ImprovementActionCreateState } from "./improvement-actions";

type MemberOption = { id: string; label: string };
const initialState = { status: "idle" } satisfies ImprovementActionCreateState;

export function ImprovementActionCreateForm({ organizationId, gapId, defaultPriority, members }: { organizationId: string; gapId: string; defaultPriority: string; members: MemberOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createImprovementAction, initialState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const handledActionId = useRef<string | null>(null);

  useEffect(() => {
    if (state.status !== "success" || !state.actionId || handledActionId.current === state.actionId) return;
    handledActionId.current = state.actionId;
    formRef.current?.reset();
    setOpen(false);
    router.refresh();
    window.history.replaceState(null, "", `#action-${state.actionId}`);
    let attempts = 0;
    const focusCreatedAction = () => {
      const action = document.getElementById(`action-${state.actionId}`);
      if (action) {
        action.focus({ preventScroll: true });
        action.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      attempts += 1;
      if (attempts < 10) window.setTimeout(focusCreatedAction, 100);
    };
    window.setTimeout(focusCreatedAction, 100);
  }, [router, state]);

  return <div className="grid justify-items-start gap-2">
    {!open ? <div className="flex flex-wrap items-center gap-3">
      <Button type="button" size="sm" aria-expanded="false" aria-controls={`new-action-${gapId}`} onClick={() => setOpen(true)}><Plus size={16} />Agregar acción</Button>
      {state.status === "success" ? <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--success)]"><CheckCircle size={17} />{state.message}</span> : null}
    </div> : <form ref={formRef} action={formAction} id={`new-action-${gapId}`} aria-label="Agregar acción" className="w-full rounded-[12px] border border-[var(--brand-soft)] bg-[var(--brand-soft)]/45 p-3 sm:p-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="gap_id" value={gapId} />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div><p className="text-sm font-semibold">Nueva acción</p><p className="mt-0.5 text-xs text-[var(--muted)]">Escribe el trabajo concreto. Puedes completar los demás datos ahora o después.</p></div>
        <Button type="button" variant="ghost" size="icon" className="-mr-2 -mt-2 size-8 shrink-0" aria-label="Cancelar nueva acción" onClick={() => setOpen(false)} disabled={pending}><X size={17} /></Button>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(15rem,1.8fr)_minmax(11rem,1fr)_minmax(9rem,.72fr)_auto]">
        <label className="grid gap-1 text-sm font-medium">Acción<Input autoFocus name="title" required minLength={2} maxLength={240} placeholder="Ej. Actualizar la matriz de peligros" aria-invalid={Boolean(state.fieldErrors?.title)} disabled={pending} /></label>
        <label className="grid gap-1 text-sm font-medium">Responsable <span className="sr-only">opcional</span><Select name="responsible_user_id" defaultValue="" disabled={pending}><option value="">Sin asignar</option>{members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</Select></label>
        <label className="grid gap-1 text-sm font-medium">Fecha objetivo <span className="sr-only">opcional</span><Input name="target_date" type="date" disabled={pending} /></label>
        <div className="flex items-end"><Button type="submit" className="w-full lg:w-auto" disabled={pending}>{pending ? "Agregando…" : "Agregar"}</Button></div>
      </div>
      <details className="group mt-3">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-[var(--brand)] outline-none focus-visible:rounded focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]">Más detalles <CaretDown size={15} className="transition-transform group-open:rotate-180" /></summary>
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
          <label className="grid gap-1 text-sm font-medium">Descripción <span className="text-xs font-normal text-[var(--muted)]">Opcional</span><Textarea name="description" maxLength={2000} placeholder="Resultado esperado, alcance o instrucciones" disabled={pending} /></label>
          <label className="grid content-start gap-1 text-sm font-medium">Prioridad <span className="text-xs font-normal text-[var(--muted)]">Opcional</span><Select name="priority" defaultValue="" disabled={pending}><option value="">Heredar: {presentStatus(defaultPriority).label}</option><option value="critical">Crítica</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></Select></label>
        </div>
      </details>
      {state.status === "error" ? <Alert variant="danger" role="alert" className="mt-3">{state.fieldErrors?.title ?? state.message}</Alert> : null}
    </form>}
  </div>;
}
