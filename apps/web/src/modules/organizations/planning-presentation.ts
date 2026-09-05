const utcFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: "UTC",
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatUtcDateTime(value: string | null) {
  if (!value) return "Sin vencimiento";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return `${utcFormatter.format(date)} UTC`;
}
