import { describe, expect, it } from "vitest";
import { tenantQueryKeys } from "./query-keys";

describe("tenantQueryKeys", () => {
  it("always scopes cache entries by organization", () => {
    expect(tenantQueryKeys.members("org-a")).not.toEqual(tenantQueryKeys.members("org-b"));
    expect(tenantQueryKeys.structure("org-a")[1]).toBe("org-a");
  });
});
