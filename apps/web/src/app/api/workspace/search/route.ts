import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { searchAuthorizedWorkspace } from "@/modules/workspace/search";

const querySchema = z.object({
  organizationId: z.uuid(),
  q: z.string().trim().min(2).max(64),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ results: [] }, { status: 400 });

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ results: [] }, { status: 401 });

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", parsed.data.organizationId)
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return NextResponse.json({ results: [] }, { status: 403 });

  const results = await searchAuthorizedWorkspace(parsed.data.organizationId, authData.user.id, parsed.data.q);
  return NextResponse.json({ results }, { headers: { "Cache-Control": "private, no-store" } });
}
