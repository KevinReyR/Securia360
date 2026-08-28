import { z } from "zod";

const id = z.uuid();
const optionalId = z.preprocess((value) => value === "" ? null : value, z.uuid().nullable());
const optionalDate = z.preprocess((value) => value === "" ? null : value, z.string().date().nullable());
const optionalText = z.preprocess((value) => value === "" ? null : value, z.string().trim().max(2_000).nullable());

export const incidentSchema = z.object({ reference_code: z.string().trim().min(3).max(80), classification: z.enum(["incident", "work_accident", "occupational_disease_report", "near_miss"]), summary: z.string().trim().min(5).max(2_000), occurred_at: z.preprocess((value) => value === "" ? null : value, z.string().datetime({ offset: true }).nullable()), site_id: optionalId });
export const incidentPersonSchema = z.object({ incident_id: id, organization_member_id: optionalId, role: z.enum(["affected_person", "witness", "reporter", "investigator"]), display_reference: optionalText });
export const investigationSchema = z.object({ incident_id: id, methodology_note: optionalText });
export const incidentCauseSchema = z.object({ investigation_id: id, cause_type: z.enum(["immediate", "basic", "contributing"]), description: z.string().trim().min(3).max(2_000) });
export const incidentActionSchema = z.object({ incident_id: id, title: z.string().trim().min(3).max(240), responsible_user_id: optionalId, due_at: optionalDate, improvement_action_id: optionalId });
export const incidentStateSchema = z.object({ id, status: z.enum(["under_investigation", "actions_open", "closed", "cancelled"]) });
export const investigationStateSchema = z.object({ id, status: z.enum(["reviewed", "closed"]) });
export const incidentActionStateSchema = z.object({ id, status: z.enum(["in_progress", "verified", "cancelled"]) });
export const communicationSchema = z.object({ incident_id: id, communication_type: z.enum(["internal", "authority_preparation", "insurer_preparation", "other"]), status: z.enum(["draft", "prepared", "sent", "cancelled"]) });
