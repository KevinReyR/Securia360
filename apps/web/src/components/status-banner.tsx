import { Alert } from "@/components/ui/alert";

export function StatusBanner({ status }: { status?: string }) {
  if (!status) return null;
  const messages: Record<string, { variant: "success" | "danger" | "warning"; text: string }> = {
    saved: { variant: "success", text: "Cambios guardados correctamente." },
    deleted: { variant: "success", text: "El registro se eliminó correctamente." },
    cascade: { variant: "warning", text: "La sede se eliminó junto con sus áreas y asignaciones con alcance de sede." },
    unlinked: { variant: "warning", text: "El área se eliminó; las áreas hijas quedaron sin área superior." },
    restricted: { variant: "danger", text: "No se puede eliminar la razón social porque todavía tiene sedes asociadas." },
    confirmation: { variant: "danger", text: "La confirmación no coincide con el nombre actual del registro." },
    error: { variant: "danger", text: "No fue posible guardar. Revisa los datos y tus permisos." },
  };
  const message = messages[status] ?? messages.error;
  return <Alert variant={message.variant} className="mb-5">{message.text}</Alert>;
}
