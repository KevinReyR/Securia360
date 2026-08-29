import { NextResponse } from "next/server";
import { can } from "@/modules/auth/permissions";
import { templateColumns, importTargetSchema } from "@/modules/imports/schemas";
export async function GET(_:Request,{params}:{params:Promise<{organizationId:string;target:string}>}) { const {organizationId,target}=await params; const parsed=importTargetSchema.safeParse(target); if(!parsed.success||!(await can(organizationId,"imports.read"))) return new NextResponse("No autorizado",{status:403}); const content=`${templateColumns[parsed.data].join(",")}\n`; return new NextResponse(content,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="securia360-${parsed.data}-template.csv"`}}); }
