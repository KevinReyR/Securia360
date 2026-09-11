"use server";

import { redirect } from "next/navigation";
import { accountActivationSchema } from "@/lib/auth/invitation";
import { createClient } from "@/lib/supabase/server";

export type ActivateAccountState = { error?: string };

export async function activateAccount(_state: ActivateAccountState, formData: FormData): Promise<ActivateAccountState> {
  const parsed = accountActivationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos ingresados." };

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: "La invitación venció o ya fue utilizada. Solicita una nueva." };

  const { data: invitation, error: membershipError } = await supabase
    .rpc("accept_my_organization_invitation", { p_organization_id: parsed.data.organizationId })
    .single();
  if (membershipError || !invitation) return { error: "Esta invitación no concede acceso a la organización indicada." };

  const { error: passwordError } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (passwordError) return { error: "No fue posible guardar la contraseña. Solicita una nueva invitación." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.first_name,
      middle_name: parsed.data.middle_name,
      last_name: parsed.data.last_name,
      second_last_name: parsed.data.second_last_name,
      phone: parsed.data.phone,
    })
    .eq("id", userData.user.id)
    .select("id")
    .single();
  if (profileError || !profile) return { error: "La contraseña se guardó, pero no pudimos completar tus datos. Intenta enviarlos nuevamente." };

  const destination = invitation.is_organization_admin ? "onboarding" : "dashboard";
  redirect(`/org/${parsed.data.organizationId}/${destination}`);
}
