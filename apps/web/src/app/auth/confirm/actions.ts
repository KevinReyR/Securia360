"use server";

import { redirect } from "next/navigation";
import { resolveInviteRedirect } from "@/lib/auth/invitation";
import { createClient } from "@/lib/supabase/server";

const internalOrigin = "https://securia360.invalid";

export async function confirmInvitation(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "");
  const destination = resolveInviteRedirect(String(formData.get("next") ?? ""), internalOrigin);
  const organizationId = destination
    ? new URL(destination, internalOrigin).searchParams.get("organizationId")
    : null;

  if (!tokenHash || type !== "invite" || !destination || !organizationId) {
    redirect("/auth/activate?status=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "invite" });
  if (error) redirect("/auth/activate?status=invalid");

  const { error: membershipError } = await supabase.rpc("accept_my_organization_invitation", {
    p_organization_id: organizationId,
  });
  if (membershipError) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/auth/activate?status=invalid");
  }

  redirect(destination);
}
