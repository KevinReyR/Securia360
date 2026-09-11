import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const headers = { "Content-Type": "application/json" };
const reply = (status: number, message: string) => new Response(JSON.stringify({ message }), { status, headers });
const customerCode = /^[A-Z0-9][A-Z0-9_-]{1,29}$/;
const commercialStates = new Set(["trialing", "active", "past_due", "suspended", "cancelled"]);

Deno.serve(async (request) => {
  if (request.method !== "POST") return reply(405, "Método no permitido.");
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply(401, "Autenticación requerida.");

  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const appUrl = Deno.env.get("APP_URL");
  if (!url || !publishableKey || !serviceRoleKey || !appUrl) return reply(500, "Configuración de aprovisionamiento incompleta.");

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return reply(400, "Solicitud inválida."); }
  const code = String(body.code ?? "").trim().toUpperCase();
  const name = String(body.name ?? "").trim();
  const administratorEmail = String(body.administratorEmail ?? "").trim().toLowerCase();
  const planVersionId = String(body.planVersionId ?? "");
  const status = String(body.status ?? "");
  if (!customerCode.test(code) || name.length < 2 || name.length > 160 || !/^\S+@\S+\.\S+$/.test(administratorEmail)
    || !/^[0-9a-f-]{36}$/i.test(planVersionId) || !commercialStates.has(status)) {
    return reply(400, "Datos de empresa o suscripción inválidos.");
  }

  const caller = createClient(url, publishableKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: callerUser, error: callerError } = await caller.auth.getUser();
  if (callerError || !callerUser.user) return reply(401, "Sesión inválida.");
  const { data: role } = await caller.from("saas_admin_roles").select("role,status").eq("user_id", callerUser.user.id).maybeSingle();
  if (role?.role !== "saas_admin" || role.status !== "active") return reply(403, "No tienes permiso para aprovisionar empresas.");

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const organizationId = crypto.randomUUID();
  let target: { id: string } | undefined;
  let page = 1;
  while (!target) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return reply(500, "No fue posible validar el administrador de la empresa.");
    target = data.users.find((user) => user.email?.toLowerCase() === administratorEmail);
    if (target || data.users.length < 1000) break;
    page += 1;
  }

  let createdUser = false;
  if (!target) {
    let redirectTo: string;
    try {
      const activationUrl = new URL("/auth/activate", appUrl);
      activationUrl.searchParams.set("organizationId", organizationId);
      redirectTo = activationUrl.toString();
    } catch { return reply(500, "La URL de la aplicación no es válida."); }
    const { data, error } = await admin.auth.admin.inviteUserByEmail(administratorEmail, { redirectTo });
    if (error || !data.user) return reply(409, "No fue posible enviar la invitación al administrador.");
    target = data.user;
    createdUser = true;
  }

  const args = {
    p_organization_id: organizationId, p_code: code, p_name: name, p_administrator_user_id: target.id, p_plan_version_id: planVersionId,
    p_status: status, p_trial_ends_at: body.trialEndsAt || null, p_period_start: body.periodStart || null,
    p_period_end: body.periodEnd || null, p_customer_reference: body.customerReference || null,
    p_subscription_reference: body.subscriptionReference || null, p_note: body.note || null,
  };
  const { error } = await caller.rpc("provision_saas_customer", args);
  if (error) {
    if (createdUser) await admin.auth.admin.deleteUser(target.id);
    return reply(error.code === "23505" ? 409 : error.code === "42501" ? 403 : 400, "No fue posible crear la empresa. Revisa los datos e inténtalo de nuevo.");
  }
  return reply(201, createdUser ? "Empresa creada e invitación enviada al administrador." : "Empresa creada. El administrador existente podrá ingresar a su nueva organización.");
});
