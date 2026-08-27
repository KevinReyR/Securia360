"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-2 text-sm font-medium">
        Correo electrónico
        <Input
          className="h-11"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.fields?.email}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Contraseña
        <Input
          className="h-11"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error ? (
        <Alert variant="danger">
          {state.error}
        </Alert>
      ) : null}
      <Button
        className="h-11"
        type="submit"
        disabled={pending}
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
