import { describe, expect, it } from "vitest";
import {
  accountActivationSchema,
  activationPath,
  invitationSessionSchema,
  isSameOriginRequest,
  resolveInviteRedirect,
} from "./invitation";

const organizationId = "20000000-0000-4000-8000-000000000001";

describe("invitation navigation", () => {
  it("accepts only an activation URL on the application origin", () => {
    expect(resolveInviteRedirect(`https://app.example/auth/activate?organizationId=${organizationId}`, "https://app.example"))
      .toBe(activationPath(organizationId));
  });

  it.each([
    "https://evil.example/auth/activate?organizationId=20000000-0000-4000-8000-000000000001",
    "https://app.example/dashboard",
    "https://app.example/auth/activate?organizationId=invalid&destination=onboarding",
    "https://app.example/auth/activate?organizationId=20000000-0000-4000-8000-000000000001&next=/admin",
  ])("rejects an unsafe invitation destination: %s", (value) => {
    expect(resolveInviteRedirect(value, "https://app.example")).toBeNull();
  });
});

describe("accountActivationSchema", () => {
  const validPassword = "a".repeat(10);
  const valid = {
    organizationId,
    password: validPassword,
    confirmation: validPassword,
    first_name: "Ana",
    middle_name: "",
    last_name: "Pérez",
    second_last_name: "",
    phone: "+57 300 123 4567",
  };

  it("requires identity, phone and matching password", () => {
    expect(accountActivationSchema.safeParse(valid).success).toBe(true);
    expect(accountActivationSchema.safeParse({ ...valid, phone: "" }).success).toBe(false);
    expect(accountActivationSchema.safeParse({ ...valid, confirmation: "b".repeat(10) }).success).toBe(false);
  });
});

describe("invitation session handoff", () => {
  it("accepts only a complete, scoped token payload", () => {
    expect(invitationSessionSchema.safeParse({
      accessToken: "x",
      refreshToken: "y",
      organizationId,
    }).success).toBe(true);
    expect(invitationSessionSchema.safeParse({
      accessToken: "x",
      organizationId,
    }).success).toBe(false);
  });

  it("requires the request to come from the application origin", () => {
    expect(isSameOriginRequest("https://app.example", "https://app.example/auth/invitation-session")).toBe(true);
    expect(isSameOriginRequest("https://evil.example", "https://app.example/auth/invitation-session")).toBe(false);
    expect(isSameOriginRequest(null, "https://app.example/auth/invitation-session")).toBe(false);
  });
});
