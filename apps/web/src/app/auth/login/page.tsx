import { safeNextPath } from "@/lib/auth/navigation";
import Link from "next/link";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; status?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-[var(--brand)]">SECURIA360</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Bienvenido</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Accede a la gestión segura de tu organización.
        </p>
        {params.status === "confirm-email" ? <p role="status" className="mt-4 rounded-lg bg-[var(--brand-soft)] px-3 py-2 text-sm text-[var(--brand)]">Revisa tu correo para confirmar la cuenta.</p> : null}
        <LoginForm next={safeNextPath(params.next)} />
        <p className="mt-5 text-center text-sm text-[var(--muted)]">¿Aún no tienes cuenta? <Link href="/auth/signup" className="font-semibold text-[var(--brand)] hover:underline">Crear cuenta</Link></p>
      </section>
    </main>
  );
}
