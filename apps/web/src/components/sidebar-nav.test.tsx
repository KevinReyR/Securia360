// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarNav } from "./sidebar-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/org/11111111-1111-4111-8111-111111111111/dashboard" }));

describe("SidebarNav", () => {
  it("marks the current destination and identifies future modules", () => {
    render(<SidebarNav organizationId="11111111-1111-4111-8111-111111111111" />);
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Planificación" })).toHaveAttribute("href", "/org/11111111-1111-4111-8111-111111111111/planning");
    expect(screen.getByRole("link", { name: "Riesgos" })).toHaveAttribute("href", "/org/11111111-1111-4111-8111-111111111111/risks");
    expect(screen.getByRole("link", { name: "EPP" })).toHaveAttribute("href", "/org/11111111-1111-4111-8111-111111111111/ppe");
    expect(screen.getByRole("link", { name: "Documentos" })).toHaveAttribute("href", "/org/11111111-1111-4111-8111-111111111111/documents");
    expect(screen.getAllByText("Próximamente")).toHaveLength(3);
  });
});
