import { describe, expect, it } from "vitest";
import { isSafeNotificationLink, nextQuietHoursEnd, notificationPreferencesSchema, notificationTemplateSchema } from "./schemas";

describe("notification schemas", () => {
  it("accepts paired quiet hours, including an overnight period", () => {
    expect(notificationPreferencesSchema.safeParse({ in_app_enabled: true, email_enabled: false, timezone: "America/Bogota", quiet_hours_start: "22:00", quiet_hours_end: "07:00" }).success).toBe(true);
    expect(nextQuietHoursEnd(new Date("2026-08-28T05:00:00Z"), "America/Bogota", "22:00", "07:00")).toBe("07:00");
  });

  it("rejects incomplete quiet hours and unsafe templates", () => {
    expect(notificationPreferencesSchema.safeParse({ in_app_enabled: true, email_enabled: false, timezone: "America/Bogota", quiet_hours_start: "22:00", quiet_hours_end: "" }).success).toBe(false);
    expect(notificationTemplateSchema.safeParse({ event_type: "bad event", channel: "in_app", version_number: 1, title_template: "Aviso", body_template: "Contenido seguro" }).success).toBe(false);
  });

  it("only accepts internal links for the active organization", () => {
    const org = "00000000-0000-4000-8000-000000000001";
    expect(isSafeNotificationLink(`/org/${org}/dashboard`, org)).toBe(true);
    expect(isSafeNotificationLink("https://attacker.example", org)).toBe(false);
    expect(isSafeNotificationLink("/org/00000000-0000-4000-8000-000000000002/dashboard", org)).toBe(false);
  });
});
