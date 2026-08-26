import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return <main className="grid min-h-[100dvh] place-items-center px-5 py-10"><section className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-white p-8"><p className="text-sm font-bold tracking-wide text-[var(--brand)]">SECURIA360</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Crea tu cuenta</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Usaremos Supabase Auth para proteger tu identidad y tus organizaciones.</p><SignupForm /><p className="mt-5 text-center text-sm text-[var(--muted)]">¿Ya tienes cuenta? <Link href="/auth/login" className="font-semibold text-[var(--brand)] hover:underline">Iniciar sesión</Link></p></section></main>;
}
