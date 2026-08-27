"use client";

import { Check, CaretDown } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = { value: string; label: string; keywords?: string[]; disabled?: boolean };
export function Combobox({ options, value, onValueChange, placeholder = "Selecciona una opción", searchPlaceholder = "Buscar…", emptyMessage = "Sin resultados.", disabled, className }: { options: ComboboxOption[]; value?: string; onValueChange: (value: string) => void; placeholder?: string; searchPlaceholder?: string; emptyMessage?: string; disabled?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button type="button" variant="secondary" role="combobox" aria-expanded={open} disabled={disabled} className={cn("w-full justify-between font-normal", !selected && "text-[var(--muted)]", className)}>{selected?.label ?? placeholder}<CaretDown size={15} className="shrink-0 opacity-60" /></Button></PopoverTrigger><PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0"><Command><CommandInput placeholder={searchPlaceholder} /><CommandList><CommandEmpty>{emptyMessage}</CommandEmpty><CommandGroup>{options.map((option) => <CommandItem key={option.value} value={[option.label, ...(option.keywords ?? [])].join(" ")} disabled={option.disabled} onSelect={() => { onValueChange(option.value === value ? "" : option.value); setOpen(false); }}><Check size={15} weight="bold" className={cn("opacity-0", value === option.value && "opacity-100")} />{option.label}</CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover>;
}
