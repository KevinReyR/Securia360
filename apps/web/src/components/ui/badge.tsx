import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold", { variants: { variant: { brand: "bg-[var(--brand-soft)] text-[var(--brand)]", neutral: "bg-[var(--neutral-soft)] text-[var(--muted-strong)]", outline: "border border-[var(--border)] bg-transparent text-[var(--muted-strong)]", warning: "bg-[var(--warning-soft)] text-[var(--warning)]" } }, defaultVariants: { variant: "brand" } });
export function Badge({ className, variant, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
