"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can } from "@/modules/auth/permissions";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { importIdSchema, importMappingSchema, uploadImportSchema } from "./schemas";
import { mappingHash, parseImportFile } from "./parser";

const href = (org: string, status = "saved") => `/org/${org}/imports?status=${status}`;
async function guard(org: string, permission: "imports.read" | "imports.manage") { if (!(await can(org, permission))) redirect(href(org,"forbidden")); }
function values(form: FormData) { return Object.fromEntries(form); }

export async function stageImport(form: FormData) {
  const parsed = uploadImportSchema.safeParse(values(form)); if (!parsed.success) redirect("/organizations");
  const { organizationId, target } = parsed.data; await guard(organizationId,"imports.manage");
  const file = form.get("file"); if (!(file instanceof File)) redirect(href(organizationId,"file-required"));
  const mappingResult = importMappingSchema.safeParse(values(form)); if (!mappingResult.success) redirect(href(organizationId,"mapping-invalid"));
  try {
    const source = await parseImportFile(file,target,mappingResult.data); const mHash = mappingHash(source.mapping); const { supabase } = await requireAuthenticatedUser(); const db = supabase as any;
    const importType = `${target === "worker" ? "workforce" : "structure"}_${source.extension}`;
    const existing = await db.from("import_jobs").select("id").eq("organization_id",organizationId).eq("target_entity_type",target).eq("content_hash",source.contentHash).eq("mapping_hash",mHash).maybeSingle();
    if (existing.data?.id) redirect(href(organizationId,`reused-${existing.data.id}`));
    const jobId = randomUUID(); const storagePath = `${organizationId}/${jobId}/source.${source.extension}`;
    const uploaded = await db.storage.from("import-staging").upload(storagePath,file,{ contentType: source.mime, upsert: false }); if (uploaded.error) throw new Error("No fue posible guardar el archivo de importación.");
    const staged = await db.rpc("stage_import_job",{ p_job_id:jobId,p_organization_id:organizationId,p_target_entity_type:target,p_import_type:importType,p_file_name:file.name.slice(0,255),p_content_hash:source.contentHash,p_mapping_hash:mHash,p_storage_path:storagePath,p_mapping:source.mapping,p_rows:source.rows });
    if (staged.error) { await db.storage.from("import-staging").remove([storagePath]); throw new Error("No fue posible validar el archivo."); }
    revalidatePath(`/org/${organizationId}/imports`); redirect(href(organizationId,`preview-${staged.data}`));
  } catch (error) { redirect(href(organizationId,`error-${encodeURIComponent(error instanceof Error ? error.message.slice(0,80) : "unexpected")}`)); }
}

export async function commitImport(form: FormData) { const parsed=importIdSchema.safeParse(values(form)); if(!parsed.success) redirect("/organizations"); await guard(parsed.data.organizationId,"imports.manage"); const {supabase}=await requireAuthenticatedUser(); const result=await (supabase as any).rpc("commit_import_job",{p_import_job_id:parsed.data.id}); revalidatePath(`/org/${parsed.data.organizationId}/imports`); redirect(href(parsed.data.organizationId,result.error?"commit-error":"completed")); }
export async function rollbackImport(form: FormData) { const parsed=importIdSchema.safeParse(values(form)); if(!parsed.success) redirect("/organizations"); await guard(parsed.data.organizationId,"imports.manage"); const {supabase}=await requireAuthenticatedUser(); const result=await (supabase as any).rpc("rollback_import_job",{p_import_job_id:parsed.data.id}); revalidatePath(`/org/${parsed.data.organizationId}/imports`); redirect(href(parsed.data.organizationId,result.error?"rollback-error":"rolled-back")); }

export async function downloadImportErrors(form: FormData) { const parsed=importIdSchema.safeParse(values(form)); if(!parsed.success) redirect("/organizations"); await guard(parsed.data.organizationId,"imports.read"); const {supabase}=await requireAuthenticatedUser(); const {data}=await (supabase as any).from("import_rows").select("row_number,validation_errors,raw_data").eq("organization_id",parsed.data.organizationId).eq("import_job_id",parsed.data.id).neq("status","valid").order("row_number"); const rows=(data??[]).map((row:any)=>`${row.row_number},"${JSON.stringify(row.validation_errors).replaceAll('"','""')}","${JSON.stringify(row.raw_data).replaceAll('"','""')}"`).join("\n"); return `row_number,errors,raw_data\n${rows}`; }
