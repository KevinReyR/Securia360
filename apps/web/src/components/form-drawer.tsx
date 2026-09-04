"use client";

import { Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

export function FormDrawer({ title, description, triggerLabel, children, variant = "primary", disabled = false }: { title: string; description: string; triggerLabel: string; children: React.ReactNode; variant?: "primary" | "secondary"; disabled?: boolean }) {
  return (
    <Drawer>
      <DrawerTrigger asChild><Button type="button" variant={variant} size="sm" disabled={disabled}><Plus size={16} />{triggerLabel}</Button></DrawerTrigger>
      <DrawerContent side="right" className="w-[min(94vw,560px)]">
        <div className="border-b border-[var(--border)] px-6 py-5 pr-14"><DrawerTitle className="text-xl tracking-[-0.025em]">{title}</DrawerTitle><DrawerDescription className="mt-1 leading-6">{description}</DrawerDescription></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
