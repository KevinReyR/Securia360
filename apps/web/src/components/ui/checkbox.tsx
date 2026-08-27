"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return <CheckboxPrimitive.Root className={cn("peer grid size-5 shrink-0 place-items-center rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] text-white shadow-[var(--shadow-control)] outline-none transition-[background-color,border-color,box-shadow,transform] hover:border-[var(--brand)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--brand)] data-[state=checked]:bg-[var(--brand)]", className)} {...props}><CheckboxPrimitive.Indicator><Check size={14} weight="bold" aria-hidden /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root>;
}
