import { describe, expect, it } from "vitest";
import { organizationCreationMessage } from "./creation-feedback";

describe("organizationCreationMessage", () => {
  it("explains a duplicate organization without exposing database details", () => {
    expect(organizationCreationMessage("conflict")).toContain("identificador URL o NIT");
  });

  it("uses a safe fallback for unknown failures", () => {
    expect(organizationCreationMessage("database_error")).toBe("No fue posible crear la organización. Intenta nuevamente.");
  });
});
