import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, ClockCounterClockwise, MapPin, ShieldCheck, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/empty-state";
import { FormDrawer } from "@/components/form-drawer";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
import { assignRole, removeRole, setMemberStatus } from "@/modules/organizations/core-actions";
import { displayPersonName } from "@/modules/organizations/directory";
import { requireTenant } from "@/modules/organizations/tenant";

export default async function MemberDetailPage({ params, searchParams }: { params: Promise<{ organizationId: string; memberId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId, memberId } = await params;
  await requireTenant(organizationId);
  const feedback = await searchParams;
  const supabase = await createClient();
  const [canRead, canUpdate, canManageRoles, canReadAudit] = await Promise.all([
    can(organizationId, "members.read"),
    can(organizationId, "members.update"),
    can(organizationId, "members.roles_manage"),
    can(organizationId, "audit.read"),
  ]);
  if (!canRead) return <EmptyState title="Sin acceso" description="No tienes permiso para consultar esta persona." />;

  const { data: member } = await supabase.from("organization_members").select("*").eq("organization_id", organizationId).eq("id", memberId).maybeSingle();
  if (!member) notFound();

  const [profileResult, assignmentsResult, rolesResult, sitesResult, auditResult] = await Promise.all([
    supabase.from("profiles").select("id,first_name,middle_name,last_name,second_last_name,phone,status").eq("id", member.user_id).maybeSingle(),
    supabase.from("member_roles").select("id,role_id,site_id,created_at").eq("organization_id", organizationId).eq("organization_member_id", member.id).order("created_at"),
    supabase.from("roles").select("id,name,description,organization_id").or(`organization_id.is.null,organization_id.eq.${organizationId}`).order("name"),
    supabase.from("sites").select("id,name").eq("organization_id", organizationId).eq("status", "active").order("name"),
    canReadAudit ? supabase.from("audit_log").select("id,action,entity_type,created_at").eq("organization_id", organizationId).eq("entity_id", member.id).order("created_at", { ascending: false }).limit(12) : Promise.resolve({ data: [] }),
  ]);
  const profile = profileResult.data;
  const assignments = assignmentsResult.data ?? [];
  const roles = rolesResult.data ?? [];
  const sites = sitesResult.data ?? [];
  const auditEntries = auditResult.data ?? [];
  const displayName = displayPersonName(profile, "Persona invitada");

  return (
    <main className="grid gap-7">
      <Link href={`/org/${organizationId}/settings/members`} className={`${buttonVariants({ variant: "link" })} w-fit`}><ArrowLeft size={16} />Volver a personas</Link>
      <PageHeader
        eyebrow="Persona con acceso"
        title={displayName}
        description="Responsabilidades, alcance y estado de acceso dentro de esta organización."
        action={canManageRoles ? (
          <FormDrawer title="Asignar responsabilidad" description="Añade un acceso para toda la organización o para una sede." triggerLabel="Asignar rol">
            <form action={assignRole} className="grid gap-4">
              <input type="hidden" name="organizationId" value={organizationId} />
              <input type="hidden" name="member_id" value={member.id} />
              <label className="grid gap-2 text-sm font-medium">Responsabilidad<Select name="role_id" required><option value="">Selecciona</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></label>
              <label className="grid gap-2 text-sm font-medium">Alcance<Select name="site_id"><option value="">Toda la organización</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</Select></label>
              <Button type="submit">Asignar acceso</Button>
            </form>
          </FormDrawer>
        ) : null}
      />
      <StatusBanner status={feedback.status} />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4"><div><h2 className="font-semibold">Ficha de acceso</h2><p className="mt-1 text-sm text-[var(--muted)]">Información mínima compartida con las organizaciones autorizadas.</p></div><StatusBadge>{member.status}</StatusBadge></CardHeader>
          <CardContent>
            <dl className="grid gap-6 sm:grid-cols-2">
              <Info label="Nombre" value={displayName} icon={<UserCircle size={18} />} />
              <Info label="Teléfono" value={profile?.phone ?? "No registrado"} icon={<UserCircle size={18} />} />
              <Info label="Ingreso" value={member.joined_at ? new Date(member.joined_at).toLocaleDateString("es-CO", { dateStyle: "long" }) : "Pendiente de aceptación"} icon={<ClockCounterClockwise size={18} />} />
              <Info label="Responsabilidades" value={`${assignments.length} ${assignments.length === 1 ? "asignada" : "asignadas"}`} icon={<ShieldCheck size={18} />} />
            </dl>
            {canUpdate ? <form action={setMemberStatus} className="mt-6 border-t border-[var(--border)] pt-5"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="memberId" value={member.id} /><input type="hidden" name="status" value={member.status === "active" ? "inactive" : "active"} /><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-lg text-sm leading-6 text-[var(--muted)]">{member.status === "active" ? "Al desactivar, esta persona dejará de acceder a la organización. Sus registros históricos se conservan." : "Al activar, recuperará los accesos definidos por sus responsabilidades."}</p><Button type="submit" variant="secondary">{member.status === "active" ? "Desactivar acceso" : "Activar acceso"}</Button></div></form> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold">Alcance actual</h2><p className="mt-1 text-sm text-[var(--muted)]">Los permisos efectivos se calculan desde estas responsabilidades.</p></CardHeader>
          <CardContent className="grid gap-3">
            {assignments.length ? assignments.map((assignment) => {
              const role = roles.find((item) => item.id === assignment.role_id);
              const site = sites.find((item) => item.id === assignment.site_id);
              return (
                <article key={assignment.id} className="rounded-[10px] border border-[var(--border)] p-4">
                  <div className="flex items-start gap-3"><span className="mt-0.5 grid size-8 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]"><ShieldCheck size={17} /></span><div><h3 className="text-sm font-semibold">{role?.name ?? "Responsabilidad personalizada"}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)]"><MapPin size={14} />{site?.name ?? "Toda la organización"}</p></div></div>
                  {canManageRoles ? <details className="mt-3 border-t border-[var(--border)] pt-3"><summary className="cursor-pointer text-xs font-semibold text-[var(--danger)]">Retirar responsabilidad</summary><form action={removeRole} className="mt-3 grid gap-3"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="memberRoleId" value={assignment.id} /><p className="text-xs leading-5 text-[var(--muted)]">Esta acción puede cambiar inmediatamente lo que la persona puede consultar o gestionar. El sistema impedirá dejar la empresa sin administrador.</p><Button type="submit" variant="danger" size="sm">Confirmar retiro</Button></form></details> : null}
                </article>
              );
            }) : <EmptyState title="Sin responsabilidades" description="Asigna al menos una responsabilidad para habilitar el trabajo en la plataforma." />}
          </CardContent>
        </Card>
      </section>

      {canReadAudit ? <Card><CardHeader><h2 className="font-semibold">Actividad de acceso</h2><p className="mt-1 text-sm text-[var(--muted)]">Cambios registrados sobre esta vinculación.</p></CardHeader><CardContent>{auditEntries.length ? <ol className="grid gap-0">{auditEntries.map((entry) => <li key={entry.id} className="grid grid-cols-[1rem_1fr] gap-3 border-l border-[var(--border)] pb-5 pl-4 last:pb-0"><span className="-ml-[1.3rem] mt-1.5 size-2 rounded-full bg-[var(--brand)]" /><div><p className="text-sm font-medium">{auditLabel(entry.action)}</p><p className="mt-1 text-xs text-[var(--muted)]">{new Date(entry.created_at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</p></div></li>)}</ol> : <p className="text-sm text-[var(--muted)]">Aún no hay cambios adicionales registrados para esta persona.</p>}</CardContent></Card> : null}
    </main>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div><dt className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">{icon}{label}</dt><dd className="mt-2 text-sm font-semibold">{value}</dd></div>;
}

function auditLabel(action: string) {
  if (action === "INSERT") return "Acceso creado";
  if (action === "UPDATE") return "Acceso actualizado";
  if (action === "DELETE") return "Acceso retirado";
  return "Cambio registrado";
}
