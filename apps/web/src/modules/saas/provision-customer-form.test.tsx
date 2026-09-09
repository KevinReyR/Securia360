// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProvisionCustomerForm } from "./provision-customer-form";

vi.mock("./actions", () => ({
  provisionCustomer: async () => ({
    status: "error",
    message: "Corrige los campos señalados para continuar.",
    fieldErrors: { trialEndsAt: ["La fecha de finalización de la prueba es obligatoria."] },
  }),
}));

afterEach(cleanup);

const plans = [{ id: "00000000-0000-4000-8000-000000000001", label: "Plan demostración · v1" }];

describe("ProvisionCustomerForm", () => {
  it("keeps commercial dates in one responsive column and requires the trial deadline only for trials", async () => {
    const user = userEvent.setup();
    render(<ProvisionCustomerForm planVersions={plans} />);

    const dates = screen.getByRole("group", { name: "Fechas comerciales" });
    expect(dates.className).not.toContain("grid-cols-");
    expect(screen.getByLabelText(/Prueba hasta/)).toBeRequired();

    await user.selectOptions(screen.getByRole("combobox", { name: /^Estado/ }), "active");
    expect(screen.getByLabelText("Prueba hasta")).not.toBeRequired();
  });

  it("shows server validation next to its field without navigating away", async () => {
    const user = userEvent.setup();
    render(<ProvisionCustomerForm planVersions={plans} />);

    await user.type(screen.getByLabelText("Código de empresa"), "EMPRESA_DEMO");
    await user.type(screen.getByLabelText("Nombre de empresa"), "Empresa Demo Colombia SAS");
    await user.type(screen.getByLabelText("Correo del administrador"), "admin@example.com");
    fireEvent.change(screen.getByLabelText(/Prueba hasta/), { target: { value: "2026-10-01T08:00" } });
    await user.click(screen.getByRole("button", { name: "Crear empresa e invitar administrador" }));

    await waitFor(() => expect(screen.getByText("La fecha de finalización de la prueba es obligatoria.")).toBeVisible());
    expect(screen.getByLabelText(/Prueba hasta/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Corrige los campos señalados para continuar.");
  });
});
