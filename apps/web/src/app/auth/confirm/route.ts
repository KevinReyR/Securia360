import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveInviteRedirect } from "@/lib/auth/invitation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

function invalidInvitation(request: NextRequest) {
  return NextResponse.redirect(new URL("/auth/activate?status=invalid", request.url));
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const destination = resolveInviteRedirect(
    request.nextUrl.searchParams.get("next"),
    request.nextUrl.origin,
  );

  if (!tokenHash || type !== "invite" || !destination) return invalidInvitation(request);

  const response = NextResponse.redirect(new URL(destination, request.url));
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "invite" });
  if (error) return invalidInvitation(request);

  const { error: membershipError } = await supabase.rpc("accept_my_invitations");
  if (membershipError) {
    const failure = invalidInvitation(request);
    response.cookies.getAll().forEach((cookie) => failure.cookies.set(cookie));
    return failure;
  }

  return response;
}
