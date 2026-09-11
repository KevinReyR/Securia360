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
  it.each(["/", "/evaluacion-inicial", "/evaluacion-inicial/nueva", "/evaluacion-inicial/local-id", "/auth/login", "/auth/callback", "/auth/confirm", "/auth/activate", "/auth/forgot-password", "/auth/reset-password"])("allows %s without a session", (path) => {
    expect(isPublicAuthPath(path)).toBe(true);
  });

  it.each(["/dashboard", "/auth/admin", "/auth/signup", "/evaluacion-inicial-maliciosa"])("keeps %s protected", (path) => {
    expect(isPublicAuthPath(path)).toBe(false);
  });
});
