"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "./tenant";

const switchSchema = z.object({
  organizationId: z.uuid(),
  next: z.string().optional(),
});

export async function switchOrganization(formData: FormData) {
  const parsed = switchSchema.safeParse({
    organizationId: formData.get("organizationId"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) redirect("/organizations");

  const supabase = await createClient();
  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", parsed.data.organizationId)
    .eq("status", "active")
    .maybeSingle();
  if (!data) redirect("/organizations?error=access");

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORGANIZATION_COOKIE, data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  const requested = safeNextPath(parsed.data.next);
  const target = requested.startsWith("/org/")
    ? `/org/${data.id}/${requested.split("/").slice(3).join("/") || "dashboard"}`
    : `/org/${data.id}/dashboard`;
  redirect(target);
}
