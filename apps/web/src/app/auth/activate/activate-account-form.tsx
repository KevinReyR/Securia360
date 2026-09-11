"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { activateAccount, type ActivateAccountState } from "./actions";

export function ActivateAccountForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(activateAccount, {} as ActivateAccountState);

  return (
    <form action={action} className="mt-8 grid gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">Primer nombre<Input name="first_name" autoComplete="given-name" maxLength={80} required /></label>
        <label className="grid gap-2 text-sm font-medium">Segundo nombre<Input name="middle_name" autoComplete="additional-name" maxLength={200} /></label>
        <label className="grid gap-2 text-sm font-medium">Primer apellido<Input name="last_name" autoComplete="family-name" maxLength={80} required /></label>
        <label className="grid gap-2 text-sm font-medium">Segundo apellido<Input name="second_last_name" maxLength={200} /></label>
      </div>
      <label className="grid gap-2 text-sm font-medium">Teléfono<Input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={30} required /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">Nueva contraseña<Input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required /><span className="text-xs font-normal text-[var(--muted)]">Usa al menos 10 caracteres.</span></label>
        <label className="grid gap-2 text-sm font-medium">Confirma la contraseña<Input name="confirmation" type="password" autoComplete="new-password" minLength={10} maxLength={72} required /></label>
      </div>
      {state.error ? <Alert variant="danger">{state.error}</Alert> : null}
      <Button type="submit" disabled={pending}>{pending ? "Activando cuenta..." : "Activar mi cuenta"}</Button>
    </form>
  );
}
