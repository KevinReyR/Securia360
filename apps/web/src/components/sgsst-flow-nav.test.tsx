// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SgsstFlowNav } from "./sgsst-flow-nav";

afterEach(cleanup);

describe("SgsstFlowNav", () => {
  it("connects the central workflow and identifies the current stage", () => {
    render(<SgsstFlowNav organizationId="11111111-1111-4111-8111-111111111111" current="planning" />);

    expect(screen.getByRole("link", { name: /Planificar/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Evidenciar/ })).toHaveAttribute(
      "href",
      "/org/11111111-1111-4111-8111-111111111111/documents",
    );
  });
});
