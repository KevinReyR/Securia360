import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const headers = { "Content-Type": "application/json" };
const reply = (status: number, message: string) => new Response(JSON.stringify({ message }), { status, headers });

Deno.serve(async (request) => {
  if (request.method !== "POST") return reply(405, "Método no permitido.");
  const authorization = request.headers.get("Authorization"); if (!authorization?.startsWith("Bearer ")) return reply(401, "Autenticación requerida.");
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_ANON_KEY"), service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key || !service) return reply(500, "Configuración incompleta.");
  let body: { organizationId?: string; contactId?: string; contractId?: string; siteId?: string | null; activate?: boolean };
  try { body = await request.json(); } catch { return reply(400, "Solicitud inválida."); }
  if (!body.organizationId || !body.contactId || !body.contractId || typeof body.activate !== "boolean") return reply(400, "Datos de acceso inválidos.");
  const caller = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: user } = await caller.auth.getUser(); if (!user.user) return reply(401, "Sesión inválida.");
  const { data: permitted } = await caller.rpc("can", { p_organization_id: body.organizationId, p_permission_code: "contractors.approve", p_site_id: body.siteId ?? null });
  if (!permitted) return reply(403, "No tienes permiso para aprobar accesos de contratistas.");
  const { data: contact, error: contactError } = await caller.from("contractor_contacts").select("email,contractor_organization_id").eq("organization_id", body.organizationId).eq("id", body.contactId).maybeSingle();
  if (contactError || !contact) return reply(404, "Contacto no encontrado.");
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  let page = 1, target: { id: string; email?: string } | undefined;
  while (!target) { const result = await admin.auth.admin.listUsers({ page, perPage: 1000 }); if (result.error) return reply(500, "No fue posible validar el usuario."); target = result.data.users.find((item) => item.email?.toLowerCase() === contact.email.toLowerCase()); if (target || result.data.users.length < 1000) break; page += 1; }
  if (!target) return reply(409, "El contacto debe registrarse primero en Securia360.");
  const { error: linkError } = await caller.from("contractor_contacts").update({ user_id: target.id, status: body.activate ? "active" : "inactive" }).eq("organization_id", body.organizationId).eq("id", body.contactId);
  if (linkError) return reply(400, "No fue posible vincular el contacto.");
  const { error: accessError } = await caller.from("contractor_portal_accesses").upsert({ organization_id: body.organizationId, contractor_contact_id: body.contactId, contract_id: body.contractId, site_id: body.siteId ?? null, status: body.activate ? "active" : "revoked" }, { onConflict: "contractor_contact_id,contract_id,site_id" });
  if (accessError) return reply(400, "No fue posible actualizar el acceso.");
  return reply(200, body.activate ? "Acceso de portal activado." : "Acceso de portal revocado.");
});
