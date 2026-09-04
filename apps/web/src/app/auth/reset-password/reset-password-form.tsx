"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePassword, type ResetPasswordState } from "./actions";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {} as ResetPasswordState);
  return <form action={action} className="mt-8 grid gap-5"><label className="grid gap-2 text-sm font-medium">Nueva contraseña<Input name="password" type="password" minLength={10} maxLength={72} autoComplete="new-password" required /><span className="text-xs font-normal text-[var(--muted)]">Usa al menos 10 caracteres.</span></label><label className="grid gap-2 text-sm font-medium">Confirma la contraseña<Input name="confirmation" type="password" minLength={10} maxLength={72} autoComplete="new-password" required /></label>{state.error ? <Alert variant="danger">{state.error}</Alert> : null}<Button type="submit" disabled={pending}>{pending ? "Actualizando..." : "Guardar contraseña"}</Button></form>;
}
