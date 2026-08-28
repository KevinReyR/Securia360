/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { can } from "@/modules/auth/permissions";
import { requireAuthenticatedUser } from "@/modules/organizations/tenant";
import { addWorkRestriction, createHealthDecision, createHealthProgram, enrollHealthProgram, recordFitness, resolveHealthDecision } from "@/modules/occupational-health/actions";

export default async function OccupationalHealthPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const { supabase } = await requireAuthenticatedUser();
  const db = supabase as any;
  const [read, manage, medical, hr, confirm, membersR] = await Promise.all([
    can(organizationId, "occupational_health.read"), can(organizationId, "occupational_health.manage"),
    can(organizationId, "occupational_health.medical"), can(organizationId, "occupational_health.hr_sensitive"),
    can(organizationId, "occupational_health.confirm"), db.from("organization_members").select("id,user_id").eq("organization_id", organizationId).eq("status", "active"),
  ]);
  if (!read && !manage && !medical && !hr) return <EmptyState title="Sin permiso" description="Solicita acceso a salud ocupacional." />;
  const [programsR, enrollmentsR, fitnessR, restrictionsR, decisionsR] = await Promise.all([
    db.from("health_surveillance_programs").select("*").eq("organization_id", organizationId).order("name"),
    read || manage ? db.from("health_program_enrollments").select("*").eq("organization_id", organizationId).order("next_review_at") : Promise.resolve({ data: [] }),
    medical ? db.from("occupational_fitness_concepts").select("*").eq("organization_id", organizationId).order("expires_at") : Promise.resolve({ data: [] }),
    medical || hr ? db.from("work_restrictions").select("*").eq("organization_id", organizationId).order("effective_to") : Promise.resolve({ data: [] }),
    medical || hr ? db.from("occupational_health_decisions").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const programs = programsR.data ?? [], enrollments = enrollmentsR.data ?? [], fitness = fitnessR.data ?? [];
  const restrictions = restrictionsR.data ?? [], decisions = decisionsR.data ?? [], members = membersR.data ?? [];
  const hidden = <input type="hidden" name="organizationId" value={organizationId} />;
  const expired = (date: string | null) => Boolean(date && new Date(`${date}T00:00:00Z`) < new Date());
  return <main className="grid gap-5 p-6">
    <header><h1 className="text-3xl font-semibold">Salud ocupacional</h1><p className="text-sm text-[var(--muted)]">Conceptos funcionales, restricciones operativas y vencimientos. No se almacenan historias clínicas ni diagnósticos.</p></header>
    {manage && <section className="grid gap-3 lg:grid-cols-2">
      <Card><CardHeader>Programa de vigilancia</CardHeader><CardContent><form action={createHealthProgram} className="grid gap-2">{hidden}<Input name="code" placeholder="PVE-ERGONOMICO" required /><Input name="name" placeholder="Nombre del programa" required /><Textarea name="description" placeholder="Descripción operativa" /><Button>Crear programa</Button></form></CardContent></Card>
      <Card><CardHeader>Vincular trabajador</CardHeader><CardContent><form action={enrollHealthProgram} className="grid gap-2">{hidden}<select name="health_surveillance_program_id">{programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><select name="organization_member_id">{members.map((m: any) => <option key={m.id} value={m.id}>{m.user_id}</option>)}</select><Input name="next_review_at" type="date" /><Button>Vincular</Button></form></CardContent></Card>
    </section>}
    <section className="grid gap-3"><h2 className="text-xl font-semibold">Programas y vencimientos</h2>{programs.length ? programs.map((program: any) => <Card key={program.id}><CardHeader>{program.code} · {program.name}</CardHeader><CardContent>{enrollments.filter((x: any) => x.health_surveillance_program_id === program.id).map((x: any) => <p key={x.id} className="text-sm">Miembro {x.organization_member_id} · revisión {x.next_review_at ?? "sin fecha"}{expired(x.next_review_at) ? " · Vencida" : ""}</p>)}</CardContent></Card>) : <EmptyState title="Sin programas" description="Crea un programa para gestionar sus vinculaciones y revisiones." />}</section>
    {medical && <section className="grid gap-3 lg:grid-cols-2">
      <Card><CardHeader>Registrar concepto de aptitud</CardHeader><CardContent><form action={recordFitness} className="grid gap-2">{hidden}<select name="organization_member_id">{members.map((m: any) => <option key={m.id} value={m.id}>{m.user_id}</option>)}</select><select name="concept"><option value="fit">Apto</option><option value="fit_with_restrictions">Apto con restricciones</option><option value="pending_review">Pendiente de revisión</option><option value="not_issued">No emitido</option></select><Input name="issued_at" type="date" required /><Input name="expires_at" type="date" /><Button>Registrar concepto</Button></form></CardContent></Card>
      <Card><CardHeader>Registrar restricción funcional</CardHeader><CardContent><form action={addWorkRestriction} className="grid gap-2">{hidden}<select name="occupational_fitness_concept_id">{fitness.map((x: any) => <option key={x.id} value={x.id}>{x.organization_member_id} · {x.concept}</option>)}</select><Textarea name="restriction_summary" placeholder="Restricción funcional mínima" required /><Input name="effective_from" type="date" required /><Input name="effective_to" type="date" /><Button>Registrar restricción</Button></form></CardContent></Card>
    </section>}
    {hr && <section className="grid gap-3 lg:grid-cols-2">
      <Card><CardHeader>Decisión con confirmación humana</CardHeader><CardContent><form action={createHealthDecision} className="grid gap-2">{hidden}<select name="organization_member_id">{members.map((m: any) => <option key={m.id} value={m.id}>{m.user_id}</option>)}</select><select name="decision_type"><option value="accommodation">Adecuación</option><option value="work_assignment_review">Revisión de asignación</option><option value="restriction_acknowledgement">Reconocimiento de restricción</option></select><Textarea name="reason_summary" placeholder="Motivo funcional, sin diagnóstico" required /><Button>Enviar a confirmación</Button></form></CardContent></Card>
      <Card><CardHeader>Decisiones pendientes</CardHeader><CardContent className="grid gap-2">{decisions.map((x: any) => <div key={x.id} className="rounded border p-2 text-sm">{x.decision_type} · {x.status}{x.status === "pending_human_confirmation" && (confirm ? <form action={resolveHealthDecision} className="mt-2 flex gap-2">{hidden}<input type="hidden" name="id" value={x.id} /><select name="status"><option value="confirmed">Confirmar</option><option value="cancelled">Cancelar</option></select><Button size="sm">Resolver</Button></form> : <p className="mt-1 text-[var(--muted)]">Requiere otro usuario autorizado para confirmar.</p>)}</div>)}</CardContent></Card>
    </section>}
    {hr && !medical && <section className="grid gap-2"><h2 className="text-xl font-semibold">Restricciones funcionales autorizadas</h2>{restrictions.length ? restrictions.map((restriction: any) => <Card key={restriction.id}><CardContent className="pt-6 text-sm">{restriction.restriction_summary} · vigencia {restriction.effective_from} a {restriction.effective_to ?? "sin fecha"} · {restriction.status}</CardContent></Card>) : <EmptyState title="Sin restricciones autorizadas" description="No hay restricciones funcionales que requieran gestión humana." />}</section>}
    {medical && <section className="grid gap-2"><h2 className="text-xl font-semibold">Conceptos y restricciones protegidos</h2>{fitness.map((x: any) => <Card key={x.id}><CardHeader>{x.organization_member_id} · {x.concept}{expired(x.expires_at) ? " · Vencido" : ""}</CardHeader><CardContent className="text-sm">Emitido {x.issued_at} · vence {x.expires_at ?? "sin vencimiento"}{restrictions.filter((r: any) => r.occupational_fitness_concept_id === x.id).map((r: any) => <p key={r.id} className="mt-2">Restricción: {r.restriction_summary} · {r.status}</p>)}</CardContent></Card>)}</section>}
  </main>;
}
