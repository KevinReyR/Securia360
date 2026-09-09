// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KpiCard } from "./kpi-card";

describe("KpiCard", () => {
  it("permanece estática cuando no tiene destino", () => {
    render(<KpiCard label="Tareas abiertas" value={4}/>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("es accionable por teclado y tiene nombre accesible", () => {
    render(<KpiCard label="Tareas abiertas" value={4} href="/planning?taskStatus=open" actionLabel="Ver tareas abiertas"/>);
    expect(screen.getByRole("link", { name: "Tareas abiertas: Ver tareas abiertas" })).toHaveAttribute("href", "/planning?taskStatus=open");
  });
});
