// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OperationsNav } from "./operations-nav";

afterEach(cleanup);

describe("OperationsNav", () => {
  it("marks the active operational area and keeps tenant context", () => {
    render(<OperationsNav organizationId="11111111-1111-4111-8111-111111111111" current="ppe" />);
    expect(screen.getByRole("link", { name: "EPP" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Emergencias" })).toHaveAttribute("href", "/org/11111111-1111-4111-8111-111111111111/emergencies");
  });
});
