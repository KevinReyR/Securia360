import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", { variants: { status: { active: "bg-[var(--success-soft)] text-[var(--success)]", inactive: "bg-[var(--neutral-soft)] text-[var(--muted-strong)]", invited: "bg-[var(--info-soft)] text-[var(--info)]", pending: "bg-[var(--warning-soft)] text-[var(--warning)]", warning: "bg-[var(--warning-soft)] text-[var(--warning)]", danger: "bg-[var(--danger-soft)] text-[var(--danger)]", upcoming: "bg-[var(--neutral-soft)] text-[var(--muted)]" } }, defaultVariants: { status: "inactive" } });

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof statusBadgeVariants>;
export function StatusBadge({ className, status, children, ...props }: StatusBadgeProps) {
  return <span className={cn(statusBadgeVariants({ status }), className)} {...props}><span className="size-1.5 rounded-full bg-current" aria-hidden />{children}</span>;
}
