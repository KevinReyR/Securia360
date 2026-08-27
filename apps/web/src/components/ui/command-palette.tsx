"use client";

import type { ReactNode } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "./command";

export type CommandPaletteItem = { id: string; label: string; keywords?: string[]; icon?: ReactNode; shortcut?: ReactNode; disabled?: boolean; onSelect: () => void };
export function CommandPalette({ open, onOpenChange, items, title = "Buscar", placeholder = "Buscar…", emptyMessage = "Sin resultados." }: { open: boolean; onOpenChange: (open: boolean) => void; items: CommandPaletteItem[]; title?: string; placeholder?: string; emptyMessage?: string }) {
  return <CommandDialog open={open} onOpenChange={onOpenChange} title={title}><CommandInput placeholder={placeholder} /><CommandList><CommandEmpty>{emptyMessage}</CommandEmpty><CommandGroup>{items.map((item) => <CommandItem key={item.id} value={[item.label, ...(item.keywords ?? [])].join(" ")} disabled={item.disabled} onSelect={() => { item.onSelect(); onOpenChange(false); }}>{item.icon}<span>{item.label}</span>{item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}</CommandItem>)}</CommandGroup></CommandList></CommandDialog>;
}
