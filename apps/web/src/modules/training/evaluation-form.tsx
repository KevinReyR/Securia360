"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { grade } from "./actions";

type Option = { id: string; question_id: string; label: string };
type Question = { id: string; template_id: string; prompt: string; options: Option[] };
type Template = { id: string; title: string; questions: Question[] };

export function TrainingEvaluationForm({ organizationId, enrollmentId, participantName, templates }: {
  organizationId: string;
  enrollmentId: string;
  participantName: string;
  templates: Template[];
}) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const template = useMemo(() => templates.find((item) => item.id === templateId), [templateId, templates]);
  const payload = template?.questions.map((question) => ({ question_id: question.id, option_id: answers[question.id] })).filter((answer) => answer.option_id) ?? [];
  const complete = Boolean(template?.questions.length && payload.length === template.questions.length);

  return (
    <form action={grade} className="grid gap-4 rounded-[12px] border border-[var(--border)] p-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="enrollment_id" value={enrollmentId} />
      <input type="hidden" name="answers" value={JSON.stringify(payload)} />
      <div><p className="font-semibold">{participantName}</p><p className="text-xs text-[var(--muted)]">La puntuación se calcula en el servidor y queda trazable.</p></div>
      <label className="grid gap-1.5 text-sm font-medium">Evaluación<Select name="template_id" value={templateId} onChange={(event) => { setTemplateId(event.target.value); setAnswers({}); }} required>{templates.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></label>
      {template?.questions.map((question, questionIndex) => <fieldset key={question.id} className="grid gap-2"><legend className="text-sm font-medium">{questionIndex + 1}. {question.prompt}</legend>{question.options.map((option) => <label key={option.id} className="flex items-start gap-2 rounded-[9px] border border-[var(--border)] px-3 py-2 text-sm"><input className="mt-1" type="radio" name={`question-${question.id}`} value={option.id} checked={answers[question.id] === option.id} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))} /><span>{option.label}</span></label>)}</fieldset>)}
      {!template?.questions.length ? <p className="text-sm text-[var(--warning)]">Esta plantilla aún no tiene preguntas publicadas.</p> : null}
      <Button disabled={!complete}>Calificar evaluación</Button>
    </form>
  );
}
