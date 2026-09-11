import { describe, expect, it } from "vitest";
import { accountActivationSchema, activationPath, resolveInviteRedirect } from "./invitation";

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
  const valid = {
    organizationId,
    password: "Securia360-segura",
    confirmation: "Securia360-segura",
    first_name: "Ana",
    middle_name: "",
    last_name: "Pérez",
    second_last_name: "",
    phone: "+57 300 123 4567",
  };

  it("requires identity, phone and matching password", () => {
    expect(accountActivationSchema.safeParse(valid).success).toBe(true);
    expect(accountActivationSchema.safeParse({ ...valid, phone: "" }).success).toBe(false);
    expect(accountActivationSchema.safeParse({ ...valid, confirmation: "otra-clave-segura" }).success).toBe(false);
  });
});
