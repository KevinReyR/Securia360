"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = {};

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, initialState);
  return <form action={action} className="mt-7 grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Nombre<Input name="firstName" required autoComplete="given-name" /></label><label className="grid gap-2 text-sm font-medium">Apellido<Input name="lastName" required autoComplete="family-name" /></label></div><label className="grid gap-2 text-sm font-medium">Correo electrónico<Input name="email" type="email" required autoComplete="email" /></label><label className="grid gap-2 text-sm font-medium">Contraseña<Input name="password" type="password" minLength={10} maxLength={72} required autoComplete="new-password" /><span className="text-xs font-normal text-[var(--muted)]">Mínimo 10 caracteres.</span></label>{state.error ? <Alert>{state.error}</Alert> : null}<Button type="submit" disabled={pending}>{pending ? "Creando cuenta..." : "Crear cuenta"}</Button></form>;
}
