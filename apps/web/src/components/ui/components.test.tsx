// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { DataTable } from "./data-table";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog";

describe("critical design-system components", () => {
  it("exposes button state to assistive technology", () => {
    render(<Button disabled>Guardar</Button>);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("toggles a checkbox with the keyboard", async () => {
    const user = userEvent.setup();
    render(<label>Confirmar <Checkbox aria-label="Confirmar" /></label>);
    const checkbox = screen.getByRole("checkbox", { name: "Confirmar" });
    checkbox.focus();
    await user.keyboard(" ");
    expect(checkbox).toBeChecked();
  });

  it("opens and closes a dialog with Escape", async () => {
    const user = userEvent.setup();
    render(<Dialog><DialogTrigger asChild><Button>Abrir detalle</Button></DialogTrigger><DialogContent><DialogTitle>Detalle</DialogTitle><DialogDescription>Información contextual.</DialogDescription></DialogContent></Dialog>);
    await user.click(screen.getByRole("button", { name: "Abrir detalle" }));
    expect(screen.getByRole("dialog", { name: "Detalle" })).toBeVisible();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Detalle" })).not.toBeInTheDocument();
  });

  it("renders a semantic table and its accessible caption", () => {
    render(<DataTable caption="Miembros" rows={[{ id: "1", name: "Ana" }]} getRowId={(row) => row.id} columns={[{ key: "name", header: "Nombre", cell: (row) => row.name }]} />);
    expect(screen.getByRole("table", { name: "Miembros" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument();
  });
});
