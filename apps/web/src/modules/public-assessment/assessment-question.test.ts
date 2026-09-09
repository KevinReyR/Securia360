import { describe, expect, it } from "vitest";
import { buildStandardQuestion } from "../compliance/standard-question";

describe("preguntas de estándares", () => {
  it("convierte un criterio en una pregunta binaria clara", () => {
    expect(buildStandardQuestion({
      code: "1.1.1",
      criterion: "Asignar una persona competente para diseñar e implementar el SG-SST, con el perfil exigible.",
    })).toBe("¿La empresa ha asignado una persona competente para diseñar e implementar el SG-SST, con el perfil exigible?");
  });

  it("mantiene una pregunta útil cuando falta el criterio", () => {
    expect(buildStandardQuestion({ code: "1.1.2", criterion: null })).toBe(
      "¿La empresa cumple con el estándar 1.1.2 y puede demostrarlo con evidencia verificable?",
    );
  });
});
