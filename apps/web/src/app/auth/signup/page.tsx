import Link from "next/link";
import { SignupForm } from "./signup-form";
import { AuthShell } from "@/components/auth-shell";

export default function SignupPage() {
  return <AuthShell title="Crea tu espacio de trabajo" description="Organiza tu gestión preventiva con un historial claro desde el primer día." footer={<>¿Ya tienes cuenta? <Link href="/auth/login" className="font-semibold text-[var(--brand)] hover:underline">Iniciar sesión</Link></>}><SignupForm /></AuthShell>;
}
