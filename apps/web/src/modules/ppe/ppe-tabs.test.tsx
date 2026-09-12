// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { isPpeView, parsePpeSiteScope, parsePpeView, ppeHref } from "./ppe-navigation";
import { PpeTabs } from "./ppe-tabs";

describe("PpeTabs", () => {
  afterEach(cleanup);

  it("preserves the site in tab links and identifies the active view", () => {
    render(<PpeTabs organizationId="11111111-1111-4111-8111-111111111111" site="22222222-2222-4222-8222-222222222222" current="inventory" />);
    expect(screen.getByRole("link", { name: "Inventario" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Asignaciones" })).toHaveAttribute("href", "/org/11111111-1111-4111-8111-111111111111/ppe?view=assignments&site=22222222-2222-4222-8222-222222222222");
  });

  it("normalizes invalid views and site scopes", () => {
    expect(isPpeView("unknown")).toBe(false);
    expect(parsePpeView("unknown")).toBe("summary");
    expect(parsePpeSiteScope("general", [])).toBe("general");
    expect(parsePpeSiteScope("unknown", [])).toBeUndefined();
    expect(ppeHref("org", undefined, "summary")).toBe("/org/org/ppe?view=summary");
  });
});
