"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function OrganizationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="mx-auto grid max-w-lg justify-items-center py-20 text-center"><span className="grid size-12 place-items-center rounded-[14px] bg-[var(--danger-soft)] text-[var(--danger)]"><WarningCircle size={24} /></span><h1 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">No pudimos cargar esta sección</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Tu información permanece segura. Intenta cargarla de nuevo o vuelve al inicio.</p><Button className="mt-6" onClick={reset}>Intentar de nuevo</Button></section>;
}
