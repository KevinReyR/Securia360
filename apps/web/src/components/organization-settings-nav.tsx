import Link from "next/link";
import { cn } from "@/lib/utils";

const items = [
  { key: "organization", label: "Empresa", suffix: "organization" },
  { key: "structure", label: "Estructura", suffix: "structure" },
  { key: "members", label: "Personas", suffix: "members" },
  { key: "profile", label: "Mi perfil", suffix: "profile" },
] as const;

export function OrganizationSettingsNav({ organizationId, current }: { organizationId: string; current: (typeof items)[number]["key"] }) {
  return (
    <nav aria-label="Configuración de la organización" className="overflow-x-auto border-b border-[var(--border)]">
      <div className="flex min-w-max gap-6">
        {items.map((item) => (
          <Link
            key={item.key}
            href={`/org/${organizationId}/settings/${item.suffix}`}
            aria-current={current === item.key ? "page" : undefined}
            className={cn(
              "border-b-2 px-0.5 pb-3 text-sm font-medium transition-colors",
              current === item.key
                ? "border-[var(--brand)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
