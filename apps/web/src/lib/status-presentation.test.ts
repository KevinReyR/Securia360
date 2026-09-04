import { describe, expect, it } from "vitest";
import { presentStatus } from "./status-presentation";

describe("presentStatus", () => {
  it("translates known technical states", () => {
    expect(presentStatus("evidence_submitted")).toMatchObject({ label: "Evidencia enviada", tone: "info" });
    expect(presentStatus("pending_review").label).toBe("Pendiente de revisión");
  });

  it("formats unknown values without exposing snake case", () => {
    expect(presentStatus("waiting_for_owner").label).toBe("Waiting for owner");
  });
});
