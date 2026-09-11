"use client";

import { useEffect, useRef, useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";

export function InvitationSessionBridge() {
  const [message, setMessage] = useState("Validando el enlace seguro...");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let active = true;

    async function establishSession() {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      const type = fragment.get("type");

      if (!accessToken || !refreshToken || type !== "invite") {
        window.location.replace("/auth/activate?status=invalid");
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) {
        window.location.replace("/auth/activate?status=invalid");
        return;
      }

      if (active) setMessage("Activando tu acceso a la empresa...");
      const { error: membershipError } = await supabase.rpc("accept_my_invitations");
      if (membershipError) {
        await supabase.auth.signOut({ scope: "local" });
        window.location.replace("/auth/activate?status=invalid");
        return;
      }

      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      window.location.reload();
    }

    void establishSession();
    return () => { active = false; };
  }, []);

  return (
    <Alert className="mt-8 flex items-center gap-3">
      <SpinnerGap size={20} className="shrink-0 animate-spin" aria-hidden />
      {message}
    </Alert>
  );
}
