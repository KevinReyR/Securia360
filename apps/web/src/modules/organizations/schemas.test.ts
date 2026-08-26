import { describe, expect, it } from "vitest";
import { areaSchema, organizationSchema } from "./schemas";

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
