// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RiskAssessmentForm } from "./risk-assessment-form";

vi.mock("./risk-actions", () => ({ createRiskAssessment: vi.fn() }));

afterEach(cleanup);

const identification = [{ id: "10000000-0000-4000-8000-000000000001", label: "Exposición a ruido" }];

describe("RiskAssessmentForm", () => {
  it("renders reviewed methodology variables as guided fields", () => {
    render(<RiskAssessmentForm organizationId="10000000-0000-4000-8000-000000000001" identifications={identification} previousAssessments={[]} versions={[{
      id: "10000000-0000-4000-8000-000000000002",
      version_code: "GTC45-REV-1",
      variables: [
        { code: "ND", label: "Nivel de deficiencia", data_type: "number", required: true, definition: {} },
        { code: "NE", label: "Nivel de exposición", data_type: "select", required: true, definition: { options: [{ value: 1, label: "Esporádica" }, { value: 4, label: "Continua" }] } },
      ],
      catalogs: [],
    }]} />);
    expect(screen.getByLabelText("Nivel de deficiencia")).toHaveAttribute("type", "number");
    expect(screen.getByLabelText("Nivel de exposición")).toHaveTextContent("Esporádica");
    expect(screen.queryByLabelText(/JSON/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calcular con metodología aprobada" })).toBeEnabled();
  });

  it("blocks calculation when the approved version has no published variables", () => {
    render(<RiskAssessmentForm organizationId="10000000-0000-4000-8000-000000000001" identifications={identification} previousAssessments={[]} versions={[{
      id: "10000000-0000-4000-8000-000000000002",
      version_code: "PENDIENTE",
      variables: [],
      catalogs: [],
    }]} />);
    expect(screen.getByText(/no tiene variables publicadas/i)).toBeVisible();
    expect(screen.getByRole("button", { name: "Calcular con metodología aprobada" })).toBeDisabled();
  });
});
