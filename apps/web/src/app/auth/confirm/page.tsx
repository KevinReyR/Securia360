import Link from "next/link";
import { headers } from "next/headers";
import { AuthShell } from "@/components/auth-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { resolveInviteRedirect } from "@/lib/auth/invitation";
import { confirmInvitation } from "./actions";

type ConfirmPageProps = {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
};

async function requestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) return null;
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return null;
  }
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const params = await searchParams;
  const origin = await requestOrigin();
  const destination = origin ? resolveInviteRedirect(params.next ?? null, origin) : null;
  const valid = Boolean(params.token_hash && params.type === "invite" && destination);

  if (!valid) {
    return (
      <AuthShell title="La invitación no está disponible" description="El enlace está incompleto o no corresponde a una invitación válida." footer={<Link href="/auth/login" className="font-semibold text-[var(--brand)] hover:underline">Volver al inicio de sesión</Link>}>
        <Alert variant="danger" className="mt-8">Solicita una nueva invitación al administrador.</Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Confirma tu invitación" description="Por seguridad, confirma que deseas activar tu acceso a Securia360.">
      <form action={confirmInvitation} className="mt-8 grid gap-4">
        <input type="hidden" name="token_hash" value={params.token_hash} />
        <input type="hidden" name="type" value="invite" />
        <input type="hidden" name="next" value={destination!} />
        <Button type="submit" size="lg" className="w-full">Continuar con la activación</Button>
      </form>
      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">El enlace solo se utilizará cuando pulses el botón. Así evitamos que una vista previa del correo lo consuma antes que tú.</p>
    </AuthShell>
  );
}
