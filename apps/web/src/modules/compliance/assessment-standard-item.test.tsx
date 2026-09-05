// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AssessmentStandardItem } from "./assessment-standard-item";

afterEach(cleanup);

describe("AssessmentStandardItem", () => {
  it("shows the standard context and keeps saved feedback beside its response", () => {
    render(<AssessmentStandardItem
      organizationId="10000000-0000-4000-8000-000000000001"
      assessmentId="20000000-0000-4000-8000-000000000001"
      assessmentStatus="draft"
      item={{ id: "30000000-0000-4000-8000-000000000001", snapshot_item_id: "40000000-0000-4000-8000-000000000001", response: "met", observation: "Acta vigente", justification: "Documento verificado", responsible_user_id: "50000000-0000-4000-8000-000000000001", code: "1.1.1", title: "Asignación de una persona responsable", phvaCycle: "PLAN", criterion: "Verificar la designación", expectedEvidence: "Acta o comunicación", weight: 0.5, metadataAvailable: true }}
      members={[{ id: "50000000-0000-4000-8000-000000000001", name: "Laura Martínez" }]}
      canManage
      highlighted
      feedbackStatus="saved"
      formAction="#"
    />);

    expect(screen.getByRole("heading", { name: "Asignación de una persona responsable" })).toBeVisible();
    expect(screen.getByText("1.1.1")).toBeVisible();
    expect(screen.getByText("Planear")).toBeVisible();
    expect(screen.getByText("Peso: 0.50%")).toBeVisible();
    expect(screen.getByText("Verificar la designación")).toBeVisible();
    expect(screen.getByText("Acta o comunicación")).toBeVisible();
    expect(screen.getByRole("option", { name: "Laura Martínez" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Respuesta guardada.");
    expect(screen.getByRole("button", { name: "Guardar respuesta" })).toBeEnabled();
  });

  it("renders a readable historical fallback and locks validated responses", () => {
    render(<AssessmentStandardItem
      organizationId="10000000-0000-4000-8000-000000000001"
      assessmentId="20000000-0000-4000-8000-000000000001"
      assessmentStatus="validated"
      item={{ id: "30000000-0000-4000-8000-000000000001", snapshot_item_id: "40000000-0000-4000-8000-000000000001", response: "pending", observation: null, justification: null, responsible_user_id: null, code: "2.1.1", title: "Contenido conservado en el corte histórico", phvaCycle: null, criterion: null, expectedEvidence: null, weight: null, metadataAvailable: false }}
      members={[]}
      canManage
      highlighted={false}
      formAction="#"
    />);

    expect(screen.getByText("Contenido conservado en el corte histórico")).toBeVisible();
    expect(screen.getByText("Peso: No disponible")).toBeVisible();
    expect(screen.getByText("La evaluación validada es de solo lectura.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Guardar respuesta" })).not.toBeInTheDocument();
  });
});
