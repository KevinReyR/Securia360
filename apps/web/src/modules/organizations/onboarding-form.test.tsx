// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingForm } from "./onboarding-form";
import { saveOnboardingStep } from "./core-actions";

vi.mock("./core-actions", () => ({
  saveOnboardingStep: vi.fn(),
  completeOnboarding: vi.fn(),
}));

const initialValues = {
  organization: { name: "Empresa Colombia", nit: "900123456-1" },
  legal_entity: { legal_name: "Empresa Colombia SAS", trade_name: "Empresa", tax_id: "900123456-1" },
  economic_activity: { economic_activity: "Desarrollo de software" },
  ciiu: { ciiu_code: "6201" },
  workforce: { employee_count: 42 },
  risk: { risk_class: 2 },
  sites: [{ name: "Principal", code: "BOG", address: "", city: "Bogotá", department: "Bogotá D.C." }],
  responsible: { member_id: "10000000-0000-4000-8000-000000000001" },
  characteristics: { work_at_height: true, confined_spaces: false, chemical_exposure: false, electrical_work: true, transport_operations: false, heavy_machinery: false, night_work: false, remote_work: true, manual_load_handling: false },
};

describe("OnboardingForm", () => {
  beforeEach(() => {
    vi.mocked(saveOnboardingStep).mockResolvedValue({ ok: true, currentStep: 6 });
  });

  it("resumes at the persisted step and saves before advancing", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm organizationId="20000000-0000-4000-8000-000000000001" initialStep={5} initialValues={initialValues} members={[{ id: initialValues.responsible.member_id, label: "Usuario creador" }]} />);

    expect(screen.getByRole("heading", { name: "Trabajadores" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clase de riesgo/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Guardar y continuar" }));

    await waitFor(() => expect(saveOnboardingStep).toHaveBeenCalledWith({
      organizationId: "20000000-0000-4000-8000-000000000001",
      step: 5,
      data: { employee_count: 42 },
    }));
    expect(await screen.findByRole("heading", { name: "Clase de riesgo" })).toBeInTheDocument();
  });
});
