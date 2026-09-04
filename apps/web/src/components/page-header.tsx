import type { ReactNode } from "react";

export function PageHeader({ title, description, action, eyebrow }: { title: string; description?: string; action?: ReactNode; eyebrow?: string }) {
  return (
    <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="mb-1.5 text-xs font-semibold text-[var(--brand)]">{eyebrow}</p> : null}
        <h1 className="text-balance text-3xl font-semibold tracking-[-0.04em]">{title}</h1>
        {description ? <p className="text-pretty mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
