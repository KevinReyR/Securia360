import Link from "next/link";
import { cn } from "@/lib/utils";

const sections = [
  { key: "training", label: "Capacitaciones", suffix: "training" },
  { key: "ppe", label: "EPP", suffix: "ppe" },
  { key: "contractors", label: "Contratistas", suffix: "contractors" },
  { key: "incidents", label: "Incidentes", suffix: "incidents" },
  { key: "occupational-health", label: "Salud ocupacional", suffix: "occupational-health" },
  { key: "emergencies", label: "Emergencias", suffix: "emergencies" },
] as const;

export type OperationsSection = (typeof sections)[number]["key"];

export function OperationsNav({ organizationId, current }: { organizationId: string; current: OperationsSection }) {
  return (
    <nav aria-label="Operación preventiva" className="overflow-x-auto border-b border-[var(--border)]">
      <div className="flex min-w-max gap-6">
        {sections.map((section) => (
          <Link
            key={section.key}
            href={`/org/${organizationId}/${section.suffix}`}
            aria-current={current === section.key ? "page" : undefined}
            className={cn(
              "border-b-2 px-0.5 pb-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
              current === section.key
                ? "border-[var(--brand)] font-semibold text-[var(--foreground)]"
                : "border-transparent font-medium text-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            {section.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
