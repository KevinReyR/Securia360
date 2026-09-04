"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {} as ForgotPasswordState);
  if (state.status === "sent") return <Alert className="mt-7" variant="success">Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.</Alert>;
  return <form action={action} className="mt-8 grid gap-5"><label className="grid gap-2 text-sm font-medium">Correo electrónico<Input name="email" type="email" autoComplete="email" required /></label>{state.error ? <Alert variant="danger">{state.error}</Alert> : null}<Button type="submit" disabled={pending}>{pending ? "Enviando..." : "Enviar enlace"}</Button></form>;
}
