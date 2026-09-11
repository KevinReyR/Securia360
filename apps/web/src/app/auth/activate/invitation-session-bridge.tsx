"use client";

import { useEffect, useRef, useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ActivateAccountForm } from "./activate-account-form";

type InvitationSessionBridgeProps = {
  organizationId: string;
  hasServerSession: boolean;
};

export function InvitationSessionBridge({ organizationId, hasServerSession }: InvitationSessionBridgeProps) {
  const [message, setMessage] = useState("Validando el enlace seguro...");
  const [status, setStatus] = useState<"checking" | "ready" | "wrong-account">("checking");
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
      const hasInviteSession = Boolean(accessToken && refreshToken && type === "invite");
      const hasAuthFragment = Boolean(accessToken || refreshToken || type);

      if (hasAuthFragment && !hasInviteSession) {
        window.location.replace("/auth/activate?status=invalid");
        return;
      }

      const supabase = createClient();
      if (hasInviteSession) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken!,
          refresh_token: refreshToken!,
        });
        if (sessionError) {
          window.location.replace("/auth/activate?status=invalid");
          return;
        }
      } else if (!hasServerSession) {
        window.location.replace("/auth/activate?status=invalid");
        return;
      }

      if (active) setMessage("Activando tu acceso a la empresa...");
      const { error: membershipError } = await supabase.rpc("accept_my_organization_invitation", {
        p_organization_id: organizationId,
      });
      if (membershipError) {
        if (hasInviteSession) {
          await supabase.auth.signOut({ scope: "local" });
          window.location.replace("/auth/activate?status=invalid");
          return;
        }
        if (active) setStatus("wrong-account");
        return;
      }

      if (hasInviteSession) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        window.location.reload();
        return;
      }

      if (active) setStatus("ready");
    }

    void establishSession();
    return () => { active = false; };
  }, [hasServerSession, organizationId]);

  async function clearCurrentSession() {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("/auth/login");
  }

  if (status === "ready") return <ActivateAccountForm organizationId={organizationId} />;

  if (status === "wrong-account") {
    return (
      <div className="mt-8 grid gap-4">
        <Alert variant="danger">
          Este enlace pertenece a otra cuenta. Cierra la sesión actual y vuelve a abrir el enlace original del correo de invitación.
        </Alert>
        <Button type="button" variant="secondary" onClick={clearCurrentSession}>
          Cerrar la sesión actual
        </Button>
      </div>
    );
  }

  return (
    <Alert className="mt-8 flex items-center gap-3">
      <SpinnerGap size={20} className="shrink-0 animate-spin" aria-hidden />
      {message}
    </Alert>
  );
}
