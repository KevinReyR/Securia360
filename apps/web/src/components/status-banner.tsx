import { Alert } from "@/components/ui/alert";

export function StatusBanner({ status }: { status?: string }) {
  if (!status) return null;
  const messages: Record<string, { variant: "success" | "danger" | "warning"; text: string }> = {
    saved: { variant: "success", text: "Cambios guardados correctamente." },
    "calculation-requested": { variant: "success", text: "El cálculo fue solicitado. El resultado histórico se generará en el servidor." },
    "import-completed": { variant: "success", text: "La importación terminó sin duplicar registros ni eventos." },
    "import-rolled-back": { variant: "success", text: "La importación fue revertida de forma controlada. Revisa el reporte si existieron conflictos." },
    versioned: { variant: "success", text: "La nueva versión privada quedó registrada." },
    "proposal-created": { variant: "success", text: "La propuesta quedó pendiente de revisión humana." },
    approved: { variant: "success", text: "La propuesta fue aprobada y la clasificación histórica quedó preservada." },
    rejected: { variant: "warning", text: "La propuesta fue rechazada y se conservó su trazabilidad." },
    evaluated: { variant: "success", text: "La aplicabilidad se evaluó con reglas revisadas; los casos ambiguos requieren decisión humana." },
    "snapshot-created": { variant: "success", text: "El snapshot manual quedó congelado e inmutable." },
    "assessment-created": { variant: "success", text: "La evaluación se creó a partir del snapshot seleccionado." },
    completed: { variant: "success", text: "La evaluación fue completada con la regla de puntuación aprobada." },
    validated: { variant: "success", text: "La evaluación fue validada y ya no admite cambios." },
    forbidden: { variant: "danger", text: "No tienes permiso para realizar esta operación." },
    "expert-pending": { variant: "warning", text: "Esta operación requiere un perfil, regla o contenido revisado y aprobado por un experto." },
    transition: { variant: "warning", text: "La transición no está permitida para el estado actual del recurso." },
    "transition-error": { variant: "warning", text: "El cambio solicitado no está permitido para el estado actual." },
    "file-required": { variant: "warning", text: "Selecciona un archivo CSV o XLSX para continuar." },
    "mapping-invalid": { variant: "warning", text: "Revisa el mapeo de columnas antes de generar la vista previa." },
    archived: { variant: "success", text: "El documento quedó archivado y su historial se conserva." },
    deleted: { variant: "success", text: "El registro se eliminó correctamente." },
    cascade: { variant: "warning", text: "La sede se eliminó junto con sus áreas y asignaciones con alcance de sede." },
    unlinked: { variant: "warning", text: "El área se eliminó; las áreas hijas quedaron sin área superior." },
    restricted: { variant: "danger", text: "No se puede eliminar la razón social porque todavía tiene sedes asociadas." },
    confirmation: { variant: "danger", text: "La confirmación no coincide con el nombre actual del registro." },
    notfound: { variant: "danger", text: "El recurso no existe o no tienes acceso a él." },
    error: { variant: "danger", text: "No fue posible guardar. Revisa los datos y tus permisos." },
    invalid: { variant: "danger", text: "Hay datos incompletos o inválidos. Revisa los campos señalados." },
    "calculation-error": { variant: "danger", text: "No fue posible solicitar el cálculo. Revisa la versión, el período y tus permisos." },
    "commit-error": { variant: "danger", text: "No fue posible confirmar la importación. Revisa sus validaciones y vuelve a intentarlo." },
    "rollback-error": { variant: "danger", text: "No fue posible revertir todos los efectos. Consulta el reporte de conflictos." },
  };
  const message = messages[status] ?? messages.error;
  return <Alert variant={message.variant} className="mb-5">{message.text}</Alert>;
}
