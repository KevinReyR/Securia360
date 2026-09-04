"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ password: z.string().min(10, "Usa al menos 10 caracteres.").max(72), confirmation: z.string() }).refine((value) => value.password === value.confirmation, { message: "Las contraseñas no coinciden.", path: ["confirmation"] });
export type ResetPasswordState = { error?: string };

export async function updatePassword(_state: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "El enlace venció o ya fue utilizado. Solicita uno nuevo." };
  redirect("/auth/login?status=password-updated");
}
