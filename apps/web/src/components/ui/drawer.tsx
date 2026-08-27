"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export function DrawerContent({ className, children, side = "left", ...props }: ComponentProps<typeof DialogPrimitive.Content> & { side?: "left" | "right" }) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45 data-[state=open]:animate-[overlay-in_160ms_ease-out] data-[state=closed]:animate-[overlay-out_120ms_ease-in]" /><DialogPrimitive.Content data-side={side} className={cn("fixed inset-y-0 z-50 flex w-[min(88vw,320px)] flex-col bg-[var(--surface)] shadow-[var(--shadow-overlay)] outline-none", side === "left" ? "left-0 data-[state=open]:animate-[drawer-in_220ms_cubic-bezier(.2,.8,.2,1)] data-[state=closed]:animate-[drawer-out_160ms_ease-in]" : "right-0 data-[state=open]:animate-[drawer-in-right_220ms_cubic-bezier(.2,.8,.2,1)] data-[state=closed]:animate-[drawer-out-right_160ms_ease-in]", className)} {...props}>{children}<DialogPrimitive.Close className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-[var(--muted)] outline-none hover:bg-[var(--muted-surface)] focus-visible:ring-2 focus-visible:ring-[var(--brand)]"><X size={19} /><span className="sr-only">Cerrar panel</span></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>;
}
export function DrawerTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) { return <DialogPrimitive.Title className={cn("text-base font-semibold", className)} {...props} />; }
export function DrawerDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) { return <DialogPrimitive.Description className={cn("text-sm text-[var(--muted)]", className)} {...props} />; }
