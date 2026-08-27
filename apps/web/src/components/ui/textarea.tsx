import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("min-h-24 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--foreground)] shadow-[var(--shadow-control)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted)] focus-visible:border-[var(--brand)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:bg-[var(--muted-surface)] disabled:opacity-70 aria-invalid:border-[var(--danger)] aria-invalid:ring-[var(--danger-soft)]", className)} {...props} />;
}
