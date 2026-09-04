import { ChartLineUp, FileArrowUp, Lightning } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";

const items = [
  { id: "analytics", label: "Indicadores", description: "Estado e históricos", icon: ChartLineUp },
  { id: "automations", label: "Automatizaciones", description: "Reglas y ejecuciones", icon: Lightning },
  { id: "imports", label: "Importaciones", description: "Estructura y personas", icon: FileArrowUp },
] as const;

export type AnalysisArea = (typeof items)[number]["id"];

export function AnalysisNav({ organizationId, current }: { organizationId: string; current: AnalysisArea }) {
  return (
    <nav aria-label="Herramientas de análisis" className="overflow-x-auto border-b border-[var(--border)]">
      <div className="flex min-w-max gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === current;
          return (
            <Link
              key={item.id}
              href={`/org/${organizationId}/${item.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-w-40 items-center gap-2.5 border-b-2 px-3 py-3 text-left transition-colors",
                active ? "border-[var(--brand)] text-[var(--foreground)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon size={18} weight={active ? "fill" : "regular"} aria-hidden />
              <span><span className="block text-sm font-semibold">{item.label}</span><span className="block text-xs">{item.description}</span></span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
