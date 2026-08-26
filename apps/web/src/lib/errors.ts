export class AuthorizationError extends Error {}
export class NotFoundError extends Error {}
export class ValidationError extends Error {}
export class ConflictError extends Error {}

export function friendlyDatabaseError(error: { code?: string } | null) {
  if (error?.code === "23505") return "Ya existe un registro con esos datos.";
  if (error?.code === "23503") return "El registro está relacionado con otros datos y no puede modificarse así.";
  if (error?.code === "42501") return "No tienes permiso para realizar esta acción.";
  return "No pudimos guardar los cambios. Inténtalo nuevamente.";
}
