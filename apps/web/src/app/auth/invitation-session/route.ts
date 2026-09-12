import { NextResponse, type NextRequest } from "next/server";
import { invitationSessionSchema, isSameOriginRequest } from "@/lib/auth/invitation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "private, no-store" };

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request.headers.get("origin"), request.url)) {
    return NextResponse.json(
      { ok: false, reason: "invalid_origin" },
      { status: 403, headers: responseHeaders },
    );
  }

  const payload = invitationSessionSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { ok: false, reason: "invalid_request" },
      { status: 400, headers: responseHeaders },
    );
  }

  const supabase = await createClient();
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: payload.data.accessToken,
    refresh_token: payload.data.refreshToken,
  });
  if (sessionError) {
    return NextResponse.json(
      { ok: false, reason: "invalid_invitation" },
      { status: 401, headers: responseHeaders },
    );
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.json(
      { ok: false, reason: "invalid_invitation" },
      { status: 401, headers: responseHeaders },
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .rpc("accept_my_organization_invitation", {
      p_organization_id: payload.data.organizationId,
    })
    .single();

  if (membershipError || !membership) {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.json(
      { ok: false, reason: "organization_access_denied" },
      { status: 403, headers: responseHeaders },
    );
  }

  return NextResponse.json({ ok: true }, { headers: responseHeaders });
}
