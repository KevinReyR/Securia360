// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OrganizationSettingsNav } from "./organization-settings-nav";

afterEach(cleanup);

describe("OrganizationSettingsNav", () => {
  it("keeps the organization routes readable and marks the current section", () => {
    render(<OrganizationSettingsNav organizationId="11111111-1111-4111-8111-111111111111" current="members" />);

    expect(screen.getByRole("navigation", { name: "Configuración de la organización" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Personas" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Estructura" })).toHaveAttribute(
      "href",
      "/org/11111111-1111-4111-8111-111111111111/settings/structure",
    );
  });
});
