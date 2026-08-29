/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { can } from "@/modules/auth/permissions";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";

export async function GET(_: Request, { params }: { params: Promise<{ organizationId: string; importId: string }> }) {
  const { organizationId, importId } = await params;
  if (!(await can(organizationId, "imports.read"))) return new NextResponse("No autorizado", { status: 403 });
  const { supabase } = await requireAuthenticatedUser();
  const { data } = await (supabase as any).from("import_rows").select("row_number,validation_errors,raw_data").eq("organization_id", organizationId).eq("import_job_id", importId).neq("status", "valid").order("row_number");
  const csv = ["row_number,errors,raw_data", ...(data ?? []).map((row: any) => `${row.row_number},"${JSON.stringify(row.validation_errors).replaceAll('"','""')}","${JSON.stringify(row.raw_data).replaceAll('"','""')}"`)].join("\n");
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="securia360-import-errors-${importId}.csv"` } });
}
