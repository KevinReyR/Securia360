import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Alert } from "@/components/ui/alert";
import { activationPath } from "@/lib/auth/invitation";
import { createClient } from "@/lib/supabase/server";
import { ActivateAccountForm } from "./activate-account-form";

type ActivatePageProps = { searchParams: Promise<{ organizationId?: string; status?: string }> };

export default async function ActivatePage({ searchParams }: ActivatePageProps) {
  const params = await searchParams;
  const validPath = params.organizationId ? activationPath(params.organizationId) : null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const invalid = params.status === "invalid" || !validPath || !data.user;

  if (invalid) {
    return (
      <AuthShell title="La invitación no está disponible" description="El enlace venció, ya fue utilizado o no corresponde a una invitación válida." footer={<Link href="/auth/login" className="font-semibold text-[var(--brand)] hover:underline">Volver al inicio de sesión</Link>}>
        <Alert variant="danger" className="mt-8">Solicita una nueva invitación al administrador. Si ya habías creado una contraseña, también puedes recuperar tu acceso.</Alert>
        <Link href="/auth/forgot-password" className="mt-5 inline-flex text-sm font-semibold text-[var(--brand)] hover:underline">Recuperar contraseña</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Activa tu cuenta" description="Crea tu contraseña y completa los datos con los que te identificarás en Securia360.">
      <ActivateAccountForm organizationId={params.organizationId!} />
    </AuthShell>
  );
}
