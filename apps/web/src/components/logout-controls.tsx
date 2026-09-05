"use client";

import { SignOut } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { DropdownMenuItem } from "./ui/dropdown-menu";

type LogoutController = {
  pending: boolean;
  message: string | null;
  signOut: () => Promise<void>;
};

export function useLocalLogout(): LogoutController {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signOut() {
    if (pending) return;

    setPending(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      setMessage("No pudimos cerrar la sesión. Comprueba tu conexión e inténtalo de nuevo.");
      setPending(false);
      return;
    }

    router.replace("/auth/login");
    router.refresh();
  }

  return { pending, message, signOut };
}

export function LogoutMenuItem() {
  const { pending, message, signOut } = useLocalLogout();

  return <>
    <DropdownMenuItem
      disabled={pending}
      className="text-[var(--danger)] focus:text-[var(--danger)]"
      onSelect={(event) => {
        event.preventDefault();
        void signOut();
      }}
    >
      <SignOut size={17} />
      {pending ? "Cerrando sesión…" : "Cerrar sesión"}
    </DropdownMenuItem>
    {message ? <p role="alert" className="px-2.5 py-2 text-xs leading-5 text-[var(--danger)]">{message}</p> : null}
  </>;
}

export function LogoutButton() {
  const { pending, message, signOut } = useLocalLogout();

  return <div className="grid justify-items-end gap-1">
    <Button type="button" variant="ghost" size="sm" onClick={() => void signOut()} disabled={pending}>
      <SignOut size={17} />
      {pending ? "Cerrando sesión…" : "Cerrar sesión"}
    </Button>
    {message ? <p role="alert" className="max-w-64 text-right text-xs leading-5 text-[var(--danger)]">{message}</p> : null}
  </div>;
}
