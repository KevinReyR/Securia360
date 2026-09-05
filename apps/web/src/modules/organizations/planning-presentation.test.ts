import { describe, expect, it } from "vitest";
import { formatUtcDateTime } from "./planning-presentation";

describe("planning presentation", () => {
  it("formats task deadlines in UTC without incompatible Intl options", () => {
    const result = formatUtcDateTime("2026-09-04T15:30:00Z");
    expect(result).toContain("UTC");
    expect(result).toContain("2026");
  });

  it("handles missing and invalid dates safely", () => {
    expect(formatUtcDateTime(null)).toBe("Sin vencimiento");
    expect(formatUtcDateTime("not-a-date")).toBe("Fecha no disponible");
  });
});
