// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingForm } from "./onboarding-form";
import { saveOnboardingStep } from "./core-actions";

vi.mock("./core-actions", () => ({
  saveOnboardingStep: vi.fn(),
  completeOnboarding: vi.fn(),
}));

const initialValues = {
  organization: { name: "Empresa Colombia", nit: "900123456-1" },
  legal_entity: { legal_name: "Empresa Colombia SAS", trade_name: "Empresa", tax_id: "900123456-1" },
  classification: { entry_id: "30000000-0000-4000-8000-000000000001", ciiu_code: "6201-01", risk_class: 2, activity: "Desarrollo de sistemas informáticos", catalog_version: "DECRETO_768_2022_V1", source_reference: "Decreto 768 de 2022", source_review_status: "reviewed" as const },
  workforce: { employee_count: 42 },
  sites: [{ name: "Principal", code: "BOG", address: "", city: "Bogotá", department: "Bogotá D.C." }],
  responsible: { member_id: "10000000-0000-4000-8000-000000000001" },
  characteristics: { work_at_height: true, confined_spaces: false, chemical_exposure: false, electrical_work: true, transport_operations: false, heavy_machinery: false, night_work: false, remote_work: true, manual_load_handling: false },
};

describe("OnboardingForm", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.mocked(saveOnboardingStep).mockResolvedValue({ ok: true, currentStep: 5 });
  });

  it("resumes at the persisted step and saves before advancing", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm organizationId="20000000-0000-4000-8000-000000000001" initialStep={4} initialValues={initialValues} members={[{ id: initialValues.responsible.member_id, label: "Usuario creador" }]} />);

    expect(screen.getByRole("heading", { name: "Trabajadores" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sedes/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Guardar y continuar" }));

    await waitFor(() => expect(saveOnboardingStep).toHaveBeenCalledWith({
      organizationId: "20000000-0000-4000-8000-000000000001",
      step: 4,
      data: { employee_count: 42 },
    }));
    expect(await screen.findByRole("heading", { name: "Sedes" })).toBeInTheDocument();
  });

  it("shows the catalog-derived CIIU and risk as read-only classification data", async () => {
    const user = userEvent.setup();
    vi.mocked(saveOnboardingStep).mockResolvedValue({ ok: true, currentStep: 4 });
    render(<OnboardingForm organizationId="20000000-0000-4000-8000-000000000001" initialStep={3} initialValues={initialValues} members={[{ id: initialValues.responsible.member_id, label: "Usuario creador" }]} />);

    expect(screen.getByRole("combobox", { name: "Código CIIU y actividad económica, obligatorio" })).toHaveTextContent("6201-01");
    expect(screen.getByText("II · Riesgo 2")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Clase de riesgo" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar y continuar" }));

    await waitFor(() => expect(saveOnboardingStep).toHaveBeenCalledWith({
      organizationId: "20000000-0000-4000-8000-000000000001",
      step: 3,
      data: initialValues.classification,
    }));
  });
});
