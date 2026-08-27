"use client";

import { ArrowRight, LockSimple } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { navigationHref, navigationItems } from "./navigation-config";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "./ui/command";

export function NavigationCommand({ organizationId, open, onOpenChange }: { organizationId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  return <CommandDialog open={open} onOpenChange={onOpenChange} title="Buscar en Securia360"><CommandInput autoFocus placeholder="Buscar pantallas y módulos…" /><CommandList><CommandEmpty>No encontramos esa opción.</CommandEmpty><CommandGroup heading="Navegación">{navigationItems.map(({ label, icon: Icon, available, keywords, ...item }) => {
    const suffix = "suffix" in item ? item.suffix : undefined;
    return <CommandItem key={label} value={[label, ...keywords].join(" ")} disabled={!available || !suffix} onSelect={() => { if (!suffix) return; router.push(navigationHref(organizationId, suffix)); onOpenChange(false); }}><Icon size={18} className="text-[var(--muted)]" /><span>{label}</span>{available ? <CommandShortcut><ArrowRight size={14} /></CommandShortcut> : <CommandShortcut className="flex items-center gap-1 normal-case tracking-normal"><LockSimple size={12} />Próximamente</CommandShortcut>}</CommandItem>;
  })}</CommandGroup></CommandList></CommandDialog>;
}
