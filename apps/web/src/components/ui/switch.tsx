"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return <SwitchPrimitive.Root className={cn("group inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-[var(--border-strong)] p-0.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--brand)]", className)} {...props}><SwitchPrimitive.Thumb className="block size-5 rounded-full bg-white shadow-sm transition-transform will-change-transform data-[state=checked]:translate-x-5" /></SwitchPrimitive.Root>;
}
