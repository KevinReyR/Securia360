"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-2 text-sm font-medium">
        Correo electrónico
        <input
          className="h-11 rounded-lg border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-green-100"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.fields?.email}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Contraseña
        <input
          className="h-11 rounded-lg border border-[var(--border)] bg-white px-3 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-green-100"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state.error ? (
        <p className="rounded-lg bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className="h-11 rounded-lg bg-[var(--brand)] px-4 font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-wait disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
