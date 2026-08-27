"use client";

import { Command as CommandPrimitive } from "cmdk";
import { MagnifyingGlass } from "@phosphor-icons/react";
import type { ComponentProps } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { cn } from "@/lib/utils";

export function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) { return <CommandPrimitive className={cn("flex size-full flex-col overflow-hidden rounded-xl bg-[var(--surface)] text-[var(--foreground)]", className)} {...props} />; }
export function CommandDialog({ title = "Buscar", description = "Busca una pantalla de Securia360", children, ...props }: ComponentProps<typeof Dialog> & { title?: string; description?: string }) { return <Dialog {...props}><DialogContent className="overflow-hidden p-0 sm:max-w-xl"><DialogTitle className="sr-only">{title}</DialogTitle><DialogDescription className="sr-only">{description}</DialogDescription><Command>{children}</Command></DialogContent></Dialog>; }
export function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) { return <div className="flex h-12 items-center gap-2 border-b border-[var(--border)] px-4"><MagnifyingGlass size={18} className="shrink-0 text-[var(--muted)]" aria-hidden /><CommandPrimitive.Input className={cn("h-full w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)] disabled:opacity-50", className)} {...props} /></div>; }
export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) { return <CommandPrimitive.List className={cn("max-h-[min(420px,60vh)] overflow-y-auto overscroll-contain p-2", className)} {...props} />; }
export function CommandEmpty({ className, ...props }: ComponentProps<typeof CommandPrimitive.Empty>) { return <CommandPrimitive.Empty className={cn("py-10 text-center text-sm text-[var(--muted)]", className)} {...props} />; }
export function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) { return <CommandPrimitive.Group className={cn("overflow-hidden [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[var(--muted)]", className)} {...props} />; }
export function CommandSeparator({ className, ...props }: ComponentProps<typeof CommandPrimitive.Separator>) { return <CommandPrimitive.Separator className={cn("my-1 h-px bg-[var(--border)]", className)} {...props} />; }
export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) { return <CommandPrimitive.Item className={cn("relative flex min-h-10 cursor-default select-none items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-45 data-[selected=true]:bg-[var(--muted-surface)]", className)} {...props} />; }
export function CommandShortcut({ className, ...props }: ComponentProps<"span">) { return <span className={cn("ml-auto text-xs tracking-widest text-[var(--muted)]", className)} {...props} />; }
