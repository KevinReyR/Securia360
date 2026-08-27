import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-[var(--skeleton)]", className)} {...props} />;
}
