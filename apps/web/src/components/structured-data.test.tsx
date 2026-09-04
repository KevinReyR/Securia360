// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { humanizeField, StructuredData } from "./structured-data";

afterEach(cleanup);

describe("StructuredData", () => {
  it("presents technical fields and states in plain language", () => {
    expect(humanizeField("expected_result")).toBe("Resultado esperado");
    render(<StructuredData value={{ title: "Prueba", status: "pending_review" }} />);
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Pendiente de revisión")).toBeInTheDocument();
  });

  it("does not expose UUID references", () => {
    render(<StructuredData value={{ actor_user_id: "8cd058fb-6a76-4af6-8e16-9260442b6b9f" }} />);
    expect(screen.getByText("Referencia protegida")).toBeInTheDocument();
    expect(screen.queryByText("8cd058fb-6a76-4af6-8e16-9260442b6b9f")).not.toBeInTheDocument();
  });
});
