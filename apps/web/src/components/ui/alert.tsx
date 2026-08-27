import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva("relative rounded-xl border px-4 py-3 text-sm", { variants: { variant: { default: "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]", info: "border-[var(--info-border)] bg-[var(--info-soft)] text-[var(--info)]", success: "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]", warning: "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning)]", danger: "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]" } }, defaultVariants: { variant: "default" } });

export function Alert({ className, variant, ...props }: HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div role={variant === "danger" ? "alert" : "status"} className={cn(alertVariants({ variant }), className)} {...props} />;
}
export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) { return <h5 className={cn("font-semibold", className)} {...props} />; }
export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("mt-1 leading-6 opacity-90", className)} {...props} />; }
