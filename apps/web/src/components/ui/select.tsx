import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] shadow-[var(--shadow-control)] outline-none transition-[border-color,box-shadow] focus-visible:border-[var(--brand)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--muted-surface)] disabled:opacity-70 aria-invalid:border-[var(--danger)]",
        className,
      )}
      {...props}
    />
  );
}
