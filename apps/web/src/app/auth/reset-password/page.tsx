import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return <AuthShell title="Crea una nueva contraseña" description="Elige una contraseña que no utilices en otros servicios."><ResetPasswordForm /></AuthShell>;
}
