// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarNav } from "./sidebar-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/org/11111111-1111-4111-8111-111111111111/dashboard" }));
afterEach(cleanup);

describe("SidebarNav", () => {
  it("groups destinations and marks the current page", () => {
    render(<SidebarNav organizationId="11111111-1111-4111-8111-111111111111" />);
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Trabajo")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Trabajo"));
    expect(screen.getByRole("link", { name: "Plan anual y tareas" })).toHaveAttribute("href", "/org/11111111-1111-4111-8111-111111111111/planning");
  });

  it("does not render destinations without capability", () => {
    render(<SidebarNav organizationId="11111111-1111-4111-8111-111111111111" allowedPermissions={["organization.read"]} />);
    expect(screen.getByRole("link", { name: "Inicio" })).toBeInTheDocument();
    expect(screen.queryByText("Riesgos y controles")).not.toBeInTheDocument();
  });
});
