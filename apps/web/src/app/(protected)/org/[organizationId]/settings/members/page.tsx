import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { FormDrawer } from "@/components/form-drawer";
import { StatusBanner } from "@/components/status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
import { assignRole, inviteMember, removeRole, setMemberStatus } from "@/modules/organizations/core-actions";
import { requireTenant } from "@/modules/organizations/tenant";

export default async function MembersSettings({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId } = await params;
  await requireTenant(organizationId);
  const supabase = await createClient();
  const [{ data: members }, { data: roles }, { data: assignments }, { data: sites }, canInvite, canUpdate, canManageRoles] = await Promise.all([
    supabase.from("organization_members").select("*").eq("organization_id", organizationId).order("created_at"),
    supabase.from("roles").select("id,code,name,organization_id").or(`organization_id.is.null,organization_id.eq.${organizationId}`).order("name"),
    supabase.from("member_roles").select("id,organization_member_id,role_id,site_id").eq("organization_id", organizationId),
    supabase.from("sites").select("id,name").eq("organization_id", organizationId).eq("status", "active").order("name"),
    can(organizationId, "members.create"),
    can(organizationId, "members.update"),
    can(organizationId, "members.roles_manage"),
  ]);
  const userIds = members?.map((member) => member.user_id) ?? [];
  const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id,first_name,last_name,phone").in("id", userIds) : { data: [] };
  const { status } = await searchParams;
  return (
    <div className="grid gap-7">
      <PageHeader title="Personas y accesos" description="Gestiona quién puede ingresar, qué puede hacer y en cuáles sedes trabaja." action={<div className="flex flex-wrap gap-2">{canInvite && canManageRoles ? <FormDrawer title="Invitar una persona" description="Enviaremos una invitación con el acceso y alcance que selecciones." triggerLabel="Invitar persona"><form action={inviteMember} className="grid gap-4"><input type="hidden" name="organizationId" value={organizationId} /><label className="grid gap-2 text-sm font-medium">Correo electrónico<Input name="email" type="email" required autoComplete="email" /></label><label className="grid gap-2 text-sm font-medium">Rol inicial<Select name="role_id" required><option value="">Selecciona</option>{roles?.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></label><label className="grid gap-2 text-sm font-medium">Alcance por sede<Select name="site_id"><option value="">Toda la organización</option>{sites?.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</Select></label><Button type="submit">Enviar invitación</Button></form></FormDrawer> : null}{canManageRoles ? <FormDrawer title="Asignar otro acceso" description="Añade una responsabilidad adicional sin retirar los accesos actuales." triggerLabel="Asignar rol" variant="secondary"><form action={assignRole} className="grid gap-4"><input type="hidden" name="organizationId" value={organizationId} /><label className="grid gap-2 text-sm font-medium">Persona<Select name="member_id" required><option value="">Selecciona</option>{members?.map((member) => { const profile = profiles?.find((item) => item.id === member.user_id); return <option key={member.id} value={member.id}>{profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Usuario invitado" : "Usuario invitado"}</option>; })}</Select></label><label className="grid gap-2 text-sm font-medium">Rol<Select name="role_id" required><option value="">Selecciona</option>{roles?.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></label><label className="grid gap-2 text-sm font-medium">Alcance<Select name="site_id"><option value="">Toda la organización</option>{sites?.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</Select></label><Button type="submit">Asignar acceso</Button></form></FormDrawer> : null}</div>} />
      <StatusBanner status={status} />
      <Card>
        <CardHeader><h2 className="font-semibold">Accesos de la organización</h2></CardHeader>
        <CardContent className="grid gap-4">
          {members?.length ? members.map((member) => {
            const profile = profiles?.find((item) => item.id === member.user_id);
            const memberAssignments = assignments?.filter((item) => item.organization_member_id === member.id) ?? [];
            const displayName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Usuario invitado" : "Usuario invitado";
            return <article key={member.id} className="rounded-[12px] border border-[var(--border)] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><h3 className="font-semibold">{displayName}</h3><Badge className={member.status === "active" ? "" : "bg-amber-50 text-amber-800"}>{member.status === "active" ? "Activo" : "Inactivo"}</Badge></div><p className="mt-1 text-xs text-[var(--muted)]">{memberAssignments.length} {memberAssignments.length === 1 ? "acceso asignado" : "accesos asignados"}</p></div>{canUpdate ? <form action={setMemberStatus}><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="memberId" value={member.id} /><input type="hidden" name="status" value={member.status === "active" ? "inactive" : "active"} /><Button type="submit" size="sm" variant="secondary">{member.status === "active" ? "Desactivar" : "Activar"}</Button></form> : null}</div><div className="mt-4 flex flex-wrap gap-2">{memberAssignments.map((assignment) => { const role = roles?.find((item) => item.id === assignment.role_id); const site = sites?.find((item) => item.id === assignment.site_id); return <div key={assignment.id} className="inline-flex items-center gap-2 rounded-lg bg-[var(--muted-surface)] px-3 py-2 text-xs"><span><strong>{role?.name ?? "Rol"}</strong>{site ? ` · ${site.name}` : " · Toda la organización"}</span>{canManageRoles ? <form action={removeRole}><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="memberRoleId" value={assignment.id} /><button type="submit" className="font-bold text-[var(--danger)]" aria-label={`Retirar ${role?.name ?? "rol"}`}>×</button></form> : null}</div>; })}</div></article>;
          }) : <EmptyState title="Sin personas" description="Invita al equipo que participará en la gestión." />}
        </CardContent>
      </Card>
    </div>
  );
}
