import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const steps = [
  { key: "compliance", label: "Evaluar", detail: "Cumplimiento", suffix: "compliance" },
  { key: "improvement", label: "Mejorar", detail: "Acciones", suffix: "improvement-plan" },
  { key: "planning", label: "Planificar", detail: "Plan y tareas", suffix: "planning" },
  { key: "risks", label: "Prevenir", detail: "Riesgos", suffix: "risks" },
  { key: "documents", label: "Evidenciar", detail: "Documentos", suffix: "documents" },
] as const;

export type SgsstFlowSection = (typeof steps)[number]["key"];

export function SgsstFlowNav({ organizationId, current }: { organizationId: string; current: SgsstFlowSection }) {
  return (
    <aside className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3" aria-label="Flujos centrales SG-SST">
      <div className="flex items-center gap-4 overflow-x-auto">
        <p className="hidden shrink-0 text-xs font-semibold text-[var(--muted)] xl:block">Flujos centrales</p>
        <nav className="flex min-w-max flex-1 items-center" aria-label="Flujos centrales SG-SST">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              {index > 0 ? <ArrowRight size={14} className="mx-1.5 text-[var(--border-strong)]" aria-hidden /> : null}
              <Link
                href={`/org/${organizationId}/${step.suffix}`}
                aria-current={current === step.key ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2 rounded-[9px] px-3 py-2 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]",
                  current === step.key ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "text-[var(--muted)] hover:bg-[var(--muted-surface)] hover:text-[var(--foreground)]",
                )}
              >
                <span className={cn("grid size-5 place-items-center rounded-md font-mono text-[10px] font-semibold", current === step.key ? "bg-[var(--brand)] text-white" : "bg-[var(--muted-surface)] text-[var(--muted-strong)]")}>{index + 1}</span>
                <span><strong className="block text-xs font-semibold">{step.label}</strong><span className="hidden text-[10px] opacity-75 sm:block">{step.detail}</span></span>
              </Link>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
