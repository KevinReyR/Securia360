import { describe, expect, it } from "vitest";
import { areaSchema, onboardingSchema, onboardingSitesSchema, organizationSchema } from "./schemas";

describe("organizationSchema", () => {
  it("accepts a normalized tenant identifier", () => {
    expect(organizationSchema.parse({ name: "Empresa Colombia", slug: "empresa-colombia", nit: "900123456-1" }).slug).toBe("empresa-colombia");
  });

  it("rejects identifiers that cannot be used in routes", () => {
    expect(organizationSchema.safeParse({ name: "Empresa", slug: "Empresa Colombia", nit: "" }).success).toBe(false);
  });
});

describe("areaSchema", () => {
  it("normalizes codes and optional parents", () => {
    const value = areaSchema.parse({ site_id: "10000000-0000-4000-8000-000000000001", parent_area_id: "", name: "Operaciones", code: "ops" });
    expect(value).toMatchObject({ code: "OPS", parent_area_id: null });
  });
});

describe("onboardingSchema", () => {
  const validOnboarding = {
    organization: { name: "Empresa Colombia", nit: "900123456-1" },
    legal_entity: { legal_name: "Empresa Colombia SAS", trade_name: "Empresa", tax_id: "900123456-1" },
    economic_activity: { economic_activity: "Desarrollo de software" },
    ciiu: { ciiu_code: "6201" },
    workforce: { employee_count: 42 },
    risk: { risk_class: 2 },
    sites: [{ name: "Principal", code: "bog", address: "", city: "Bogotá", department: "Bogotá D.C." }],
    responsible: { member_id: "10000000-0000-4000-8000-000000000001" },
    characteristics: { work_at_height: true, confined_spaces: false, chemical_exposure: false, electrical_work: true, transport_operations: false, heavy_machinery: false, night_work: false, remote_work: true, manual_load_handling: false },
  };

  it("validates and normalizes all nine onboarding sections", () => {
    const result = onboardingSchema.parse(validOnboarding);
    expect(result.sites[0].code).toBe("BOG");
    expect(result.ciiu.ciiu_code).toBe("6201");
  });

  it("rejects duplicate site codes regardless of casing", () => {
    const result = onboardingSitesSchema.safeParse([
      validOnboarding.sites[0],
      { ...validOnboarding.sites[0], name: "Secundaria", code: "BOG" },
    ]);
    expect(result.success).toBe(false);
  });
});
