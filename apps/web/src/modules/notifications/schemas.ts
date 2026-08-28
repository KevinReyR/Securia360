import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa el formato HH:mm.");

export const notificationPreferencesSchema = z.object({
  in_app_enabled: z.boolean(),
  email_enabled: z.boolean(),
  timezone: z.string().trim().min(1).max(64),
  quiet_hours_start: z.string().optional(),
  quiet_hours_end: z.string().optional(),
}).superRefine((value, context) => {
  const hasStart = Boolean(value.quiet_hours_start);
  const hasEnd = Boolean(value.quiet_hours_end);
  if (hasStart !== hasEnd) context.addIssue({ code: "custom", path: [hasStart ? "quiet_hours_end" : "quiet_hours_start"], message: "Indica ambos límites de horas silenciosas." });
  if (hasStart && !time.safeParse(value.quiet_hours_start).success) context.addIssue({ code: "custom", path: ["quiet_hours_start"], message: "Hora inicial inválida." });
  if (hasEnd && !time.safeParse(value.quiet_hours_end).success) context.addIssue({ code: "custom", path: ["quiet_hours_end"], message: "Hora final inválida." });
});

export const notificationTemplateSchema = z.object({
  event_type: z.string().trim().regex(/^[a-z][a-z0-9_.-]{2,119}$/),
  channel: z.enum(["in_app", "email"]),
  version_number: z.coerce.number().int().positive(),
  title_template: z.string().trim().min(1).max(160),
  body_template: z.string().trim().min(1).max(500),
});

export const notificationTemplateStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["approved", "archived"]),
});

export function isSafeNotificationLink(link: string | null | undefined, organizationId: string) {
  return Boolean(link && new RegExp(`^/org/${organizationId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:/|$)`).test(link));
}

export function nextQuietHoursEnd(now: Date, timezone: string, start?: string | null, end?: string | null) {
  if (!start || !end || start === end) return null;
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => local.find((entry) => entry.type === type)?.value ?? "";
  const current = `${part("hour")}:${part("minute")}`;
  const overnight = start > end;
  const quiet = overnight ? current >= start || current < end : current >= start && current < end;
  if (!quiet) return null;
  // The database is authoritative; this helper only explains the expected client-side behavior.
  return end;
}
