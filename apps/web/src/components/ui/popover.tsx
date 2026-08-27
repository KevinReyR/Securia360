"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export function PopoverContent({ className, align = "center", sideOffset = 6, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return <PopoverPrimitive.Portal><PopoverPrimitive.Content align={align} sideOffset={sideOffset} className={cn("z-50 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-overlay)] outline-none data-[state=open]:animate-[popover-in_140ms_ease-out]", className)} {...props} /></PopoverPrimitive.Portal>;
}
