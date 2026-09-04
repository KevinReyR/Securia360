export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export type StatusPresentation = { label: string; tone: StatusTone; explanation: string };

const statusCatalog: Record<string, StatusPresentation> = {
  active: { label: "Activa", tone: "success", explanation: "Disponible para el trabajo habitual." },
  approved: { label: "Aprobada", tone: "success", explanation: "La revisión requerida fue completada." },
  reviewed: { label: "Revisada por experto", tone: "success", explanation: "Una persona experta registró su revisión." },
  published: { label: "Publicada", tone: "success", explanation: "La versión está disponible para el flujo autorizado." },
  confirmed: { label: "Confirmada", tone: "success", explanation: "La decisión fue confirmada por una persona autorizada." },
  satisfactory: { label: "Satisfactorio", tone: "success", explanation: "El resultado cumplió el objetivo operativo previsto." },
  suitable: { label: "Apto para uso", tone: "success", explanation: "La inspección permite continuar usando el elemento." },
  fit: { label: "Apto", tone: "success", explanation: "El concepto funcional permite continuar sin restricciones registradas." },
  applicable: { label: "Aplica", tone: "success", explanation: "La regla revisada determinó aplicabilidad para los datos considerados." },
  met: { label: "Cumple", tone: "success", explanation: "La evidencia registrada satisface el criterio evaluado." },
  resolved: { label: "Resuelta", tone: "success", explanation: "La brecha fue cerrada mediante una decisión autorizada." },
  completed: { label: "Completada", tone: "success", explanation: "El trabajo previsto fue finalizado." },
  verified: { label: "Verificada", tone: "success", explanation: "La evidencia fue revisada y aceptada." },
  validated: { label: "Validada", tone: "success", explanation: "El resultado fue validado por una persona autorizada." },
  present: { label: "Asistió", tone: "success", explanation: "La asistencia fue confirmada." },
  effective: { label: "Eficaz", tone: "success", explanation: "La última verificación confirmó la eficacia del control." },
  draft: { label: "Borrador", tone: "neutral", explanation: "Puede editarse antes de enviarse a revisión." },
  todo: { label: "Por hacer", tone: "neutral", explanation: "La tarea está lista para comenzar." },
  inactive: { label: "Inactiva", tone: "neutral", explanation: "No está disponible para nuevas operaciones." },
  archived: { label: "Archivada", tone: "neutral", explanation: "Se conserva como parte del historial." },
  not_applicable: { label: "No aplica", tone: "neutral", explanation: "La regla revisada no determinó aplicabilidad para los datos considerados." },
  cancelled: { label: "Cancelada", tone: "neutral", explanation: "El proceso fue cancelado y conserva su trazabilidad." },
  closed: { label: "Cerrada", tone: "neutral", explanation: "El caso concluyó y conserva su historial." },
  not_issued: { label: "No emitido", tone: "neutral", explanation: "No existe un concepto emitido para este registro." },
  pending: { label: "Pendiente", tone: "warning", explanation: "Requiere una acción o revisión." },
  pending_review: { label: "Pendiente de revisión", tone: "warning", explanation: "Requiere revisión humana antes de continuar." },
  review_required: { label: "Requiere revisión", tone: "warning", explanation: "Una persona autorizada debe resolver este resultado." },
  partially_effective: { label: "Parcialmente eficaz", tone: "warning", explanation: "El control requiere ajustes o seguimiento adicional." },
  in_progress: { label: "En ejecución", tone: "info", explanation: "El trabajo se encuentra en curso." },
  evidence_submitted: { label: "Evidencia enviada", tone: "info", explanation: "La evidencia espera validación." },
  scheduled: { label: "Programada", tone: "info", explanation: "Tiene una fecha prevista de ejecución." },
  invited: { label: "Invitada", tone: "info", explanation: "La invitación está pendiente de aceptación." },
  submitted: { label: "Enviada", tone: "info", explanation: "La información fue enviada y espera revisión." },
  reported: { label: "Reportado", tone: "info", explanation: "El caso fue registrado y espera gestión." },
  under_investigation: { label: "En investigación", tone: "info", explanation: "El equipo autorizado está analizando el caso." },
  actions_open: { label: "Con acciones abiertas", tone: "info", explanation: "El caso conserva acciones pendientes de cierre." },
  prepared: { label: "Preparada", tone: "info", explanation: "La comunicación está preparada, pero no ha sido enviada automáticamente." },
  fit_with_restrictions: { label: "Apto con restricciones", tone: "info", explanation: "Existen restricciones funcionales que deben respetarse." },
  absent: { label: "No asistió", tone: "neutral", explanation: "La asistencia no fue registrada como presente." },
  excused: { label: "Ausencia justificada", tone: "neutral", explanation: "La ausencia quedó registrada como justificada." },
  blocked: { label: "Bloqueada", tone: "danger", explanation: "Existe un impedimento que debe resolverse." },
  rejected: { label: "Rechazada", tone: "danger", explanation: "La revisión no fue aprobada." },
  not_met: { label: "No cumple", tone: "danger", explanation: "El criterio evaluado presenta una brecha." },
  overdue: { label: "Vencida", tone: "danger", explanation: "La fecha prevista ya pasó." },
  ineffective: { label: "Ineficaz", tone: "danger", explanation: "La verificación determinó que el control no es suficiente." },
  suspended: { label: "Suspendida", tone: "danger", explanation: "El acceso u operación se encuentra suspendido." },
  pending_human_confirmation: { label: "Pendiente de confirmación humana", tone: "warning", explanation: "Otra persona autorizada debe revisar y confirmar la decisión." },
  needs_replacement: { label: "Requiere reposición", tone: "warning", explanation: "El elemento debe evaluarse para reemplazo." },
  needs_improvement: { label: "Requiere mejora", tone: "warning", explanation: "El resultado requiere acciones y seguimiento." },
  failed: { label: "No satisfactorio", tone: "danger", explanation: "El resultado no cumplió el criterio previsto." },
  unsatisfactory: { label: "No satisfactorio", tone: "danger", explanation: "El resultado exige acciones antes de considerarse adecuado." },
  critical: { label: "Crítica", tone: "danger", explanation: "Requiere atención prioritaria." },
  high: { label: "Alta", tone: "danger", explanation: "Requiere atención pronta." },
  medium: { label: "Media", tone: "warning", explanation: "Requiere seguimiento planificado." },
  low: { label: "Baja", tone: "neutral", explanation: "Puede gestionarse dentro de la programación habitual." },
};

export function presentStatus(value: string | null | undefined): StatusPresentation {
  if (!value) return { label: "Sin estado", tone: "neutral", explanation: "No hay un estado registrado." };
  return statusCatalog[value] ?? { label: value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase()), tone: "neutral", explanation: "Estado registrado en el sistema." };
}

export function isKnownStatus(value: string) {
  return value in statusCatalog;
}
