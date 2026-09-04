"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.email("Ingresa un correo válido.") });
export type ForgotPasswordState = { status?: "sent"; error?: string };

export async function requestPasswordReset(_state: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return { error: "La recuperación no está disponible en este momento. Contacta a soporte." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: new URL("/auth/callback?next=/auth/reset-password", siteUrl).toString() });
  return { status: "sent" };
}
