import { describe, expect, it } from "vitest";
import { mappingHash } from "./parser";

describe("import mapping idempotency", () => {
  it("is stable regardless of mapping key order", () => {
    expect(mappingHash({ first_name: "Nombre", employee_code: "Código" })).toBe(mappingHash({ employee_code: "Código", first_name: "Nombre" }));
  });
});
