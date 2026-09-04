import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { isKnownStatus, presentStatus } from "@/lib/status-presentation";

const badgeVariants = cva("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold", { variants: { variant: { brand: "bg-[var(--brand-soft)] text-[var(--brand)]", neutral: "bg-[var(--neutral-soft)] text-[var(--muted-strong)]", outline: "border border-[var(--border)] bg-transparent text-[var(--muted-strong)]", info: "bg-[var(--info-soft)] text-[var(--info)]", success: "bg-[var(--success-soft)] text-[var(--success)]", warning: "bg-[var(--warning-soft)] text-[var(--warning)]", danger: "bg-[var(--danger-soft)] text-[var(--danger)]" } }, defaultVariants: { variant: "brand" } });
export function Badge({ className, variant, children, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  const presentation = typeof children === "string" && isKnownStatus(children) ? presentStatus(children) : null;
  const resolvedVariant = variant ?? (presentation?.tone === "info" ? "info" : presentation?.tone === "success" ? "success" : presentation?.tone === "warning" ? "warning" : presentation?.tone === "danger" ? "danger" : presentation ? "neutral" : undefined);
  return (
    <span
      className={cn(badgeVariants({ variant: resolvedVariant }), className)}
      title={presentation?.explanation}
      {...props}
    >{presentation?.label ?? children}</span>
  );
}
