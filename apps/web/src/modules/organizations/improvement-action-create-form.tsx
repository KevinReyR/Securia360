"use client";

import { useState } from "react";
import { createImprovementAction } from "./improvement-actions";
import { improvementActionCreateSchema } from "./improvement-schemas";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type MemberOption = { id: string; label: string };

export function ImprovementActionCreateForm({ organizationId, gapId, defaultPriority, members }: { organizationId: string; gapId: string; defaultPriority: string; members: MemberOption[] }) {
  const [message, setMessage] = useState<string | null>(null);

  return <form action={createImprovementAction} onSubmit={(event) => {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const result = improvementActionCreateSchema.safeParse(data);
    if (!result.success) {
      event.preventDefault();
      setMessage(result.error.issues[0]?.message ?? "Revisa los datos de la acción.");
    } else setMessage(null);
  }} className="grid gap-3 rounded-lg border border-dashed border-[var(--border)] p-4 md:grid-cols-2">
    <input type="hidden" name="organizationId" value={organizationId} />
    <input type="hidden" name="gap_id" value={gapId} />
    <label className="grid gap-1 text-sm font-medium md:col-span-2">Nueva acción<Input name="title" required placeholder="Acción concreta para cerrar la brecha" /></label>
    <label className="grid gap-1 text-sm font-medium md:col-span-2">Descripción<Textarea name="description" placeholder="Resultado esperado, alcance o instrucciones" /></label>
    <label className="grid gap-1 text-sm font-medium">Prioridad<Select name="priority" defaultValue={defaultPriority}><option value="critical">Crítica</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></Select></label>
    <label className="grid gap-1 text-sm font-medium">Responsable<Select name="responsible_user_id" defaultValue=""><option value="">Sin asignar</option>{members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</Select></label>
    <label className="grid gap-1 text-sm font-medium">Fecha objetivo<Input name="target_date" type="date" /></label>
    <div className="flex items-end"><Button type="submit">Crear acción</Button></div>
    {message ? <Alert variant="danger" className="md:col-span-2">{message}</Alert> : null}
  </form>;
}
