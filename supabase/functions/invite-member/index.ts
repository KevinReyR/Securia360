import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const jsonHeaders = { "Content-Type": "application/json" };

function response(status: number, message: string) {
  return new Response(JSON.stringify({ message }), { status, headers: jsonHeaders });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return response(405, "Método no permitido.");

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return response(401, "Autenticación requerida.");

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) return response(500, "Configuración incompleta.");

  let body: { organizationId?: string; email?: string; role_id?: string; site_id?: string | null };
  try { body = await request.json(); } catch { return response(400, "Solicitud inválida."); }
  if (!body.organizationId || !body.role_id || !body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
    return response(400, "Datos de invitación inválidos.");
  }

  const callerClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: caller, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !caller.user) return response(401, "Sesión inválida.");

  const [{ data: canCreate }, { data: canManageRoles }] = await Promise.all([
    callerClient.rpc("can", { p_organization_id: body.organizationId, p_permission_code: "members.create", p_site_id: body.site_id ?? null }),
    callerClient.rpc("can", { p_organization_id: body.organizationId, p_permission_code: "members.roles_manage", p_site_id: body.site_id ?? null }),
  ]);
  if (!canCreate || !canManageRoles) return response(403, "No tienes permiso para invitar miembros.");

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const normalizedEmail = body.email.trim().toLowerCase();
  let targetUser: { id: string } | undefined;
  let page = 1;

  // Supabase Auth has no admin lookup-by-email endpoint. Membership invitations
  // are infrequent, so page through the server-only Admin API without exposing
  // the directory of users to the browser.
  while (!targetUser) {
    const { data: usersPage, error: usersError } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (usersError) return response(500, "No fue posible validar el usuario.");
    targetUser = usersPage.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (targetUser || usersPage.users.length < 1000) break;
    page += 1;
  }

  let createdNewUser = false;
  if (!targetUser) {
    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: { invited_by: caller.user.id },
    });
    if (inviteError || !invited.user) return response(409, "No fue posible enviar la invitación.");
    targetUser = invited.user;
    createdNewUser = true;
  }

  const { error: membershipError } = await callerClient.rpc("add_invited_member", {
    p_organization_id: body.organizationId,
    p_user_id: targetUser.id,
    p_role_id: body.role_id,
    p_site_id: body.site_id ?? null,
  });
  if (membershipError) {
    if (createdNewUser) await adminClient.auth.admin.deleteUser(targetUser.id);
    return response(400, "No fue posible asignar la membresía.");
  }

  return response(201, createdNewUser ? "Invitación enviada." : "Membresía creada. Se activará al iniciar sesión.");
});
