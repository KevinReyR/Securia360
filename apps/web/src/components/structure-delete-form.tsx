"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  organizationId: string;
  id: string;
  name: string;
  label: string;
  consequence: string;
};

export function StructureDeleteForm({ action, organizationId, id, name, label, consequence }: Props) {
  const [open, setOpen] = useState(false);
  return <div className="mt-3 border-t border-[var(--border)] pt-3"><Button type="button" size="sm" variant="ghost" className="text-[var(--danger)]" onClick={() => setOpen((value) => !value)}>Eliminar</Button>{open ? <form action={action} className="mt-3 grid gap-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] p-3"><p className="text-sm text-[var(--danger)]">{consequence}</p><label className="grid gap-2 text-sm font-medium">Escribe <strong>{name}</strong> para confirmar<input name="confirmation" required autoComplete="off" className="h-10 rounded-md border border-[var(--danger-border)] bg-white px-3 text-sm text-[var(--foreground)]" /></label><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="id" value={id} /><div className="flex gap-2"><Button type="submit" size="sm" variant="danger">{label}</Button><Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button></div></form> : null}</div>;
}
