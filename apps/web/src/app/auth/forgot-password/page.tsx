import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return <AuthShell title="Recupera tu acceso" description="Te enviaremos un enlace seguro para crear una nueva contraseña." footer={<Link href="/auth/login" className="font-semibold text-[var(--brand)] hover:underline">Volver al inicio de sesión</Link>}><ForgotPasswordForm /></AuthShell>;
}
