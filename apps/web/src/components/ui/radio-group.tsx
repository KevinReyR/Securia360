"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function RadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-3", className)} {...props} />;
}

export function RadioGroupItem({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return <RadioGroupPrimitive.Item className={cn("grid size-5 shrink-0 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-control)] outline-none transition-[border-color,box-shadow,transform] hover:border-[var(--brand)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--brand)]", className)} {...props}><RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-[var(--brand)]" /></RadioGroupPrimitive.Item>;
}
