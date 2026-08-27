import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] shadow-[var(--shadow-control)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted)] focus-visible:border-[var(--brand)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--muted-surface)] disabled:opacity-70 aria-invalid:border-[var(--danger)] aria-invalid:ring-[var(--danger-soft)]",
        className,
      )}
      {...props}
    />
  );
}
