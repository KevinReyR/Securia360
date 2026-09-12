// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImprovementActionCreateForm } from "./improvement-action-create-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("./improvement-actions", () => ({
  createImprovementAction: vi.fn(async () => ({ status: "success" })),
}));

describe("ImprovementActionCreateForm", () => {
  afterEach(cleanup);
  const props = {
    organizationId: "10000000-0000-4000-8000-000000000001",
    gapId: "10000000-0000-4000-8000-000000000002",
    defaultPriority: "high",
    members: [{ id: "10000000-0000-4000-8000-000000000003", label: "Laura Gómez" }],
  };

  it("opens in context, focuses the required title and can be cancelled", async () => {
    const user = userEvent.setup();
    render(<ImprovementActionCreateForm {...props} />);

    await user.click(screen.getByRole("button", { name: "Agregar acción" }));
    expect(screen.getByRole("form", { name: "Agregar acción" })).toBeInTheDocument();
    expect(screen.getByLabelText("Acción")).toHaveFocus();
    expect(screen.getByLabelText("Acción")).toBeRequired();
    expect(screen.getByLabelText(/Responsable/)).not.toBeRequired();
    expect(screen.getByLabelText(/Fecha objetivo/)).not.toBeRequired();

    await user.click(screen.getByRole("button", { name: "Cancelar nueva acción" }));
    expect(screen.queryByRole("form", { name: "Agregar acción" })).not.toBeInTheDocument();
  });

  it("keeps description and priority behind progressive disclosure", async () => {
    const user = userEvent.setup();
    render(<ImprovementActionCreateForm {...props} />);
    await user.click(screen.getByRole("button", { name: "Agregar acción" }));

    expect(screen.getByText("Más detalles")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Heredar: Alta" })).toBeInTheDocument();
  });
});
