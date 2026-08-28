import { z } from "zod";
export const id = z.uuid(); const text=z.string().trim().min(2).max(2000); const opt=z.preprocess(v=>v===""?null:v,z.uuid().nullable());
export const contractorSchema=z.object({legal_name:text,tax_id:z.preprocess(v=>v===""?null:v,z.string().trim().max(80).nullable()),kind:z.enum(["contractor","supplier"])});
export const contactSchema=z.object({contractor_organization_id:id,email:z.string().trim().email(),name:text});
export const contractSchema=z.object({contractor_organization_id:id,code:z.string().trim().min(2).max(120),title:text,starts_at:z.string().date(),ends_at:z.preprocess(v=>v===""?null:v,z.string().date().nullable()),requirement_id:opt}).refine(v=>!v.ends_at||v.ends_at>=v.starts_at,"La fecha final debe ser posterior.");
export const requirementSchema=z.object({contract_id:id,title:text,due_at:z.preprocess(v=>v===""?null:v,z.string().date().nullable()),required:z.coerce.boolean().default(true),requirement_id:opt});
export const portalAccessSchema=z.object({contact_id:id,contract_id:id,site_id:opt,activate:z.coerce.boolean()});
export const approvalSchema=z.object({id, status:z.enum(["approved","rejected"]),note:z.string().trim().max(2000).optional()});
