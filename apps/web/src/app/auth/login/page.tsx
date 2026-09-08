import { safeNextPath } from "@/lib/auth/navigation";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { AuthShell } from "@/components/auth-shell";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; status?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell title="Bienvenido de nuevo" description="Ingresa para continuar con el trabajo de tu organización." footer={<>¿Aún no tienes cuenta? <Link href="/#contacto" className="font-semibold text-[var(--brand)] hover:underline">Contáctanos</Link></>}>
        {params.status === "confirm-email" ? <p role="status" className="mt-4 rounded-lg bg-[var(--brand-soft)] px-3 py-2 text-sm text-[var(--brand)]">Revisa tu correo para confirmar la cuenta.</p> : null}
        {params.status === "password-updated" ? <p role="status" className="mt-4 rounded-lg bg-[var(--success-soft)] px-3 py-2 text-sm text-[var(--success)]">Tu contraseña fue actualizada. Ya puedes ingresar.</p> : null}
        {params.status === "account-by-invitation" ? <p role="status" className="mt-4 rounded-lg bg-[var(--brand-soft)] px-3 py-2 text-sm text-[var(--brand)]">El acceso se habilita mediante invitación. Contáctanos para adquirir el servicio.</p> : null}
        <LoginForm next={safeNextPath(params.next)} />
    </AuthShell>
  );
}
