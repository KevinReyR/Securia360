import { Tray } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

export function EmptyState({ title, description, action, icon }: { title: string; description: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--muted-surface)] px-6 py-10 text-center">
      <div className="mx-auto mb-4 grid size-10 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] shadow-[var(--shadow-control)]">{icon ?? <Tray size={20} aria-hidden />}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
