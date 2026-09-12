// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { emergencyHref, isEmergencyView, parseEmergencyView } from "./emergency-navigation";
import { EmergencyTabs } from "./emergency-tabs";

describe("EmergencyTabs", () => {
  afterEach(cleanup);

  it("keeps the active site in every tab URL", () => {
    render(<EmergencyTabs organizationId="11111111-1111-4111-8111-111111111111" siteId="22222222-2222-4222-8222-222222222222" current="plans" showDirectory />);
    expect(screen.getByRole("link", { name: "Planes" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Simulacros" })).toHaveAttribute("href", "/org/11111111-1111-4111-8111-111111111111/emergencies?view=drills&site=22222222-2222-4222-8222-222222222222");
  });

  it("hides the directory without permission and normalizes invalid views", () => {
    render(<EmergencyTabs organizationId="11111111-1111-4111-8111-111111111111" current="summary" showDirectory={false} />);
    expect(screen.queryByRole("link", { name: "Directorio" })).not.toBeInTheDocument();
    expect(isEmergencyView("unknown")).toBe(false);
    expect(parseEmergencyView("unknown")).toBe("summary");
    expect(emergencyHref("org", undefined, "summary")).toBe("/org/org/emergencies?view=summary");
  });
});
