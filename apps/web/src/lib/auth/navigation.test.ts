import { describe, expect, it } from "vitest";
import { isPublicAuthPath, safeNextPath } from "./navigation";

describe("safeNextPath", () => {
  it("accepts local application paths", () => {
    expect(safeNextPath("/dashboard?tab=tasks")).toBe("/dashboard?tab=tasks");
  });

  it.each([null, undefined, "", "https://evil.example", "//evil.example"])(
    "rejects unsafe redirect value %s",
    (value) => {
      expect(safeNextPath(value)).toBe("/dashboard");
    },
  );
});

describe("isPublicAuthPath", () => {
  it.each(["/auth/login", "/auth/signup", "/auth/callback"])("allows %s without a session", (path) => {
    expect(isPublicAuthPath(path)).toBe(true);
  });

  it.each(["/dashboard", "/auth/admin", "/"])("keeps %s protected", (path) => {
    expect(isPublicAuthPath(path)).toBe(false);
  });
});
