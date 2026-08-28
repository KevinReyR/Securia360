import { z } from "zod";

const id = z.uuid();
const optionalId = z.preprocess((value) => value === "" ? null : value, z.uuid().nullable());
const optionalText = z.preprocess((value) => value === "" ? null : value, z.string().trim().max(4000).nullable());
const optionalDate = z.preprocess((value) => value === "" ? null : value, z.string().date().nullable());
const optionalTimestamp = z.preprocess((value) => value === "" ? null : value, z.string().trim().min(16).max(40).nullable());
const formBoolean = z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean());

export const committeeSchema = z.object({ site_id: optionalId, committee_type_id: id, name: z.string().trim().min(3).max(180) });
export const periodSchema = z.object({ committee_id: id, starts_on: z.string().date(), ends_on: optionalDate });
export const committeeMemberSchema = z.object({ committee_period_id: id, organization_member_id: id, internal_role: z.enum(["chair", "secretary", "principal", "alternate", "advisor"]) });
export const meetingSchema = z.object({ committee_period_id: id, meeting_template_id: optionalId, scheduled_at: z.string().min(10) });
export const agendaSchema = z.object({ committee_meeting_id: id, position: z.coerce.number().int().positive(), title: z.string().trim().min(3).max(220), notes: optionalText });
export const attendanceSchema = z.object({ committee_meeting_id: id, organization_member_id: id, present: formBoolean, attendance_note: optionalText });
export const minutesSchema = z.object({ committee_meeting_id: id, content: z.string().trim().min(5).max(12000) });
export const commitmentSchema = z.object({ meeting_minutes_id: id, task_id: optionalId, title: z.string().trim().min(3).max(220), due_at: optionalTimestamp });
export const statusSchema = z.object({ id, status: z.string().trim().min(3).max(40) });

export const auditProgramSchema = z.object({ name: z.string().trim().min(3).max(220), year: z.coerce.number().int().min(2000).max(2200), scope_summary: optionalText, criteria: optionalText });
export const auditEngagementSchema = z.object({ audit_program_id: id, site_id: optionalId, title: z.string().trim().min(3).max(220), scope_summary: optionalText, criteria: optionalText, require_independent_approval: formBoolean, scheduled_at: optionalTimestamp });
export const auditTeamSchema = z.object({ audit_engagement_id: id, organization_member_id: id, team_role: z.enum(["lead_auditor", "auditor", "technical_expert", "observer"]), independence_declared: formBoolean });
export const auditAgendaSchema = z.object({ audit_engagement_id: id, scheduled_at: optionalTimestamp, title: z.string().trim().min(3).max(220), assigned_to: optionalId });
export const auditChecklistSchema = z.object({ audit_engagement_id: id, code: z.string().trim().min(2).max(80), title: z.string().trim().min(3).max(220), criteria_reference: optionalText, response: z.preprocess((value) => value === "" ? null : value, z.enum(["conforming", "nonconforming", "observation", "not_applicable"]).nullable()), notes: optionalText });
export const auditEvidenceSchema = z.object({ audit_engagement_id: id, document_version_id: id });
export const auditFindingSchema = z.object({ audit_engagement_id: id, classification: z.enum(["nonconformity", "observation", "opportunity"]), title: z.string().trim().min(3).max(220), description: optionalText, criteria_reference: optionalText });
export const auditActionSchema = z.object({ audit_finding_id: id, title: z.string().trim().min(3).max(220), task_id: optionalId, improvement_action_id: optionalId, due_at: optionalTimestamp });
export const auditReportSchema = z.object({ audit_engagement_id: id, summary: z.string().trim().min(5).max(12000) });

export const managementReviewSchema = z.object({ period_start: z.string().date(), period_end: z.string().date(), chair_user_id: optionalId, minutes_content: z.string().trim().min(5).max(12000) }).refine((value) => value.period_end >= value.period_start, { message: "El período final debe ser posterior al inicial.", path: ["period_end"] });
export const managementEntrySchema = z.object({ management_review_id: id, entry_type: z.enum(["audit", "indicator", "compliance", "risk", "incident", "resource", "change", "other"]), content: z.string().trim().min(3).max(6000) });
export const managementDecisionSchema = z.object({ management_review_id: id, decision: z.string().trim().min(3).max(6000) });
export const managementCommitmentSchema = z.object({ management_review_id: id, task_id: optionalId, title: z.string().trim().min(3).max(220), due_at: optionalTimestamp });
