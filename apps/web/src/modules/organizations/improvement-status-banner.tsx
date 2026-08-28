import { Alert } from "@/components/ui/alert";

const messages: Record<string, { variant: "success" | "danger" | "warning"; text: string }> = {
  created: { variant: "success", text: "La acción de mejoramiento quedó creada." },
  "evidence-attached": { variant: "success", text: "La evidencia privada quedó vinculada a la acción." },
  validated: { variant: "success", text: "La acción fue validada y ahora es inmutable." },
  "gap-closed": { variant: "success", text: "La brecha se cerró con validación y trazabilidad." },
  transition: { variant: "danger", text: "El cambio de estado no está permitido en la situación actual." },
  "evidence-required": { variant: "danger", text: "Debes vincular una evidencia antes de enviar la acción a validación." },
  "foreign-evidence": { variant: "danger", text: "La evidencia no pertenece a esta organización." },
  "verification-required": { variant: "danger", text: "Debes validar al menos una acción antes de cerrar la brecha." },
  "gap-already-closed": { variant: "warning", text: "La brecha ya se encuentra cerrada." },
  notfound: { variant: "danger", text: "El recurso no existe o no tienes acceso a él." },
};

export function ImprovementStatusBanner({ status }: { status?: string }) {
  const message = status ? messages[status] : undefined;
  return message ? <Alert variant={message.variant}>{message.text}</Alert> : null;
}
