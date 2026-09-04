// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TrainingEvaluationForm } from "./evaluation-form";

vi.mock("./actions", () => ({ grade: vi.fn() }));

afterEach(cleanup);

describe("TrainingEvaluationForm", () => {
  it("builds the server payload from guided answers", () => {
    const { container } = render(
      <TrainingEvaluationForm
        organizationId="11111111-1111-4111-8111-111111111111"
        enrollmentId="22222222-2222-4222-8222-222222222222"
        participantName="Ana Torres"
        templates={[{
          id: "33333333-3333-4333-8333-333333333333",
          title: "Evaluación de evacuación",
          questions: [
            {
              id: "44444444-4444-4444-8444-444444444444",
              template_id: "33333333-3333-4333-8333-333333333333",
              prompt: "¿Cuál es la ruta segura?",
              options: [
                { id: "55555555-5555-4555-8555-555555555555", question_id: "44444444-4444-4444-8444-444444444444", label: "La ruta señalizada" },
                { id: "66666666-6666-4666-8666-666666666666", question_id: "44444444-4444-4444-8444-444444444444", label: "El ascensor" },
              ],
            },
          ],
        }]}
      />,
    );

    const submit = screen.getByRole("button", { name: "Calificar evaluación" });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "La ruta señalizada" }));
    expect(submit).toBeEnabled();
    expect(container.querySelector<HTMLInputElement>('input[name="answers"]')?.value).toBe(
      '[{"question_id":"44444444-4444-4444-8444-444444444444","option_id":"55555555-5555-4555-8555-555555555555"}]',
    );
  });
});
