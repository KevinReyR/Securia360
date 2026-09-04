import { presentStatus } from "@/lib/status-presentation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const fieldLabels: Record<string, string> = {
  text: "Contenido",
  title: "Título",
  description: "Descripción",
  code: "Código",
  status: "Estado",
  source: "Fuente",
  formula: "Fórmula",
  rationale: "Justificación",
  expected: "Resultado esperado",
  expected_result: "Resultado esperado",
  actual: "Resultado observado",
  actual_result: "Resultado observado",
  notes: "Observaciones",
};

export function humanizeField(value: string) {
  return fieldLabels[value] ?? value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

function Primitive({ field, value }: { field: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="text-[var(--muted)]">Sin información</span>;
  if (typeof value === "boolean") return <span>{value ? "Sí" : "No"}</span>;
  if (typeof value === "string" && UUID.test(value)) return <span className="text-[var(--muted)]">Referencia protegida</span>;
  if (field === "status" && typeof value === "string") return <span>{presentStatus(value).label}</span>;
  return <span className="break-words">{String(value)}</span>;
}

export function StructuredData({ value }: { value: unknown }) {
  if (!value || typeof value !== "object") return <Primitive field="value" value={value} />;
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return <p className="text-sm text-[var(--muted)]">No hay contenido estructurado.</p>;
  return <dl className="grid gap-3 sm:grid-cols-2">{entries.map(([field, item]) => <div key={field} className="rounded-lg bg-[var(--muted-surface)] px-3 py-2.5"><dt className="text-xs font-semibold text-[var(--muted)]">{humanizeField(field)}</dt><dd className="mt-1 text-sm leading-6">{Array.isArray(item) ? item.length ? item.map((entry, index) => <div key={index} className="border-b border-[var(--border)] py-1 last:border-0"><Primitive field={field} value={typeof entry === "object" ? "Contenido estructurado" : entry} /></div>) : <span className="text-[var(--muted)]">Sin elementos</span> : item && typeof item === "object" ? <StructuredData value={item} /> : <Primitive field={field} value={item} />}</dd></div>)}</dl>;
}
