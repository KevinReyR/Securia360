"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email(),
  password: z.string().min(10).max(72),
});

export type SignupState = { error?: string };

export async function signup(_state: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { first_name: parsed.data.firstName, last_name: parsed.data.lastName },
      ...(siteUrl ? { emailRedirectTo: new URL("/auth/callback", siteUrl).toString() } : {}),
    },
  });
  if (error) return { error: "No fue posible crear la cuenta. Revisa el correo o inténtalo más tarde." };
  if (data.session) redirect("/organizations");
  redirect("/auth/login?status=confirm-email");
}
