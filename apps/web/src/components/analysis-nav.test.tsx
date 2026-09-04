// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AnalysisNav } from "./analysis-nav";

afterEach(cleanup);

describe("AnalysisNav", () => {
  it("marks the selected area and preserves the organization", () => {
    render(<AnalysisNav organizationId="11111111-1111-4111-8111-111111111111" current="automations" />);
    expect(screen.getByRole("link", { name: /Automatizaciones/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Importaciones/ })).toHaveAttribute("href", "/org/11111111-1111-4111-8111-111111111111/imports");
  });
});
