export type OrganizationCreationError = "validation" | "conflict" | "auth" | "unexpected";

export function organizationCreationMessage(error?: string) {
  const messages: Record<OrganizationCreationError, string> = {
    validation: "Revisa el nombre y el identificador URL. El nombre debe tener al menos 2 caracteres y el identificador solo puede usar minúsculas, números y guiones.",
    conflict: "Ya existe una organización con ese identificador URL o NIT. Usa un valor diferente.",
    auth: "Tu sesión ya no es válida. Inicia sesión nuevamente para crear la organización.",
    unexpected: "No fue posible crear la organización. Intenta nuevamente.",
  };

  return messages[error as OrganizationCreationError] ?? messages.unexpected;
}
