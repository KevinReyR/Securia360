import { describe, expect, it } from "vitest";
import { deriveExperienceProfile } from "./types";

describe("deriveExperienceProfile", () => {
  it("derives presentation from capabilities without role names", () => {
    expect(deriveExperienceProfile(["organization.read", "tasks.update_status"])).toBe("worker");
    expect(deriveExperienceProfile(["organization.read", "organization.update", "members.roles_manage"])).toBe("administrator");
    expect(deriveExperienceProfile(["organization.read", "audits.read"])).toBe("auditor");
  });
});
