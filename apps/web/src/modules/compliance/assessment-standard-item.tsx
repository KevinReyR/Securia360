import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AssessmentItemPresentation } from "./assessment-presentation";

const responseLabels: Record<string, string> = {
  pending: "Pendiente",
  met: "Cumple",
  not_met: "No cumple",
  not_applicable: "No aplica",
  review_required: "Requiere revisión",
};

const phvaLabels: Record<string, string> = {
  PLAN: "Planear",
  DO: "Hacer",
  CHECK: "Verificar",
  ACT: "Actuar",
};

type AssessmentStandardItemProps = {
  organizationId: string;
  assessmentId: string;
  assessmentStatus: string;
  item: AssessmentItemPresentation;
  members: Array<{ id: string; name: string }>;
  canManage: boolean;
  highlighted: boolean;
  feedbackStatus?: string;
  formAction: NonNullable<ComponentProps<"form">["action"]>;
};

function InlineFeedback({ status }: { status?: string }) {
  if (!status) return null;
  const saved = status === "saved";
  return (
    <p className={`text-sm font-medium ${saved ? "text-[var(--success)]" : "text-[var(--danger)]"}`} role={saved ? "status" : "alert"}>
      {saved ? "Respuesta guardada." : "No pudimos guardar esta respuesta. Revisa los datos y vuelve a intentarlo."}
    </p>
  );
}

export function AssessmentStandardItem({ organizationId, assessmentId, assessmentStatus, item, members, canManage, highlighted, feedbackStatus, formAction }: AssessmentStandardItemProps) {
  const locked = assessmentStatus === "validated";
  const editable = canManage && !locked;
  const detailsId = `assessment-item-details-${item.id}`;

  return (
    <article id={`assessment-item-${item.id}`} className="scroll-mt-24 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <header className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--brand)]">{item.code}</p>
          <h3 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">{item.title}</h3>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {item.phvaCycle ? <Badge variant="outline">{phvaLabels[item.phvaCycle] ?? item.phvaCycle}</Badge> : null}
          <Badge variant="neutral">Peso: {item.weight == null ? "No disponible" : `${item.weight.toFixed(2)}%`}</Badge>
          <Badge variant={item.response === "pending" ? "warning" : item.response === "met" ? "success" : "neutral"}>{responseLabels[item.response] ?? "Sin respuesta"}</Badge>
        </div>
      </header>

      <details className="mt-4 rounded-[10px] bg-[var(--muted-surface)] p-3" open={highlighted}>
        <summary id={detailsId} className="cursor-pointer text-sm font-semibold text-[var(--foreground)]">Ver criterio y evidencia esperada</summary>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><p className="font-medium">Criterio de evaluación</p><p className="mt-1 leading-6 text-[var(--muted)]">{item.criterion ?? "No quedó registrado para este corte histórico."}</p></div>
          <div><p className="font-medium">Evidencia esperada</p><p className="mt-1 leading-6 text-[var(--muted)]">{item.expectedEvidence ?? "No quedó registrada para este corte histórico."}</p></div>
        </div>
        {!item.metadataAvailable ? <p className="mt-3 text-xs text-[var(--warning)]">Se muestra la referencia conservada en el corte porque la metadata relacionada no está disponible.</p> : null}
      </details>

      <form action={formAction} className="mt-4 grid gap-4">
        <input type="hidden" name="organizationId" value={organizationId} />
        <input type="hidden" name="assessmentId" value={assessmentId} />
        <input type="hidden" name="itemId" value={item.id} />
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">Respuesta
            <Select name="response" defaultValue={item.response} disabled={!editable} aria-describedby={detailsId}>
              <option value="pending">Pendiente</option><option value="met">Cumple</option><option value="not_met">No cumple</option><option value="not_applicable">No aplica</option><option value="review_required">Requiere revisión</option>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-medium">Responsable
            <Select name="responsibleUserId" defaultValue={item.responsible_user_id ?? ""} disabled={!editable}>
              <option value="">Sin responsable</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-medium">Observación
            <Input name="observation" defaultValue={item.observation ?? ""} disabled={!editable} maxLength={2000} />
          </label>
          <label className="grid gap-2 text-sm font-medium">Justificación
            <Input name="justification" defaultValue={item.justification ?? ""} disabled={!editable} maxLength={2000} />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <InlineFeedback status={highlighted ? feedbackStatus : undefined} />
          {editable ? <Button size="sm" className="ml-auto">Guardar respuesta</Button> : locked ? <p className="text-sm text-[var(--muted)]">La evaluación validada es de solo lectura.</p> : null}
        </div>
      </form>
    </article>
  );
}
