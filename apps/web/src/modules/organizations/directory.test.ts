import { describe, expect, it } from "vitest";
import { displayPersonName, matchesDirectorySearch, safePage } from "./directory";

describe("organization directory", () => {
  it("builds a readable full name without exposing an identifier", () => {
    expect(displayPersonName({ first_name: "María", middle_name: null, last_name: "Pérez", second_last_name: "Rojas" })).toBe("María Pérez Rojas");
    expect(displayPersonName(null)).toBe("Persona sin nombre");
  });

  it("matches names and emails without accent sensitivity", () => {
    expect(matchesDirectorySearch(["María Pérez", "maria@empresa.co"], "maria")).toBe(true);
    expect(matchesDirectorySearch(["José Ramírez"], "ramirez")).toBe(true);
    expect(matchesDirectorySearch(["José Ramírez"], "carolina")).toBe(false);
  });

  it("keeps pagination within the available range", () => {
    expect(safePage("9", 12, 10)).toBe(2);
    expect(safePage("invalid", 0, 10)).toBe(1);
  });
});
