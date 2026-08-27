import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, supabase } = await requireAuthenticatedUser();
  const { data, error } = await supabase.rpc("get_request_auth_context");

  if (error || !data?.[0]) {
    return NextResponse.json(
      { ok: false, reason: "database_context_unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  const context = data[0];
  return NextResponse.json(
    {
      ok: true,
      applicationUserId: userId,
      databaseUserId: context.user_id,
      databaseRole: context.role,
      identityMatches: context.user_id === userId && context.role === "authenticated",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
