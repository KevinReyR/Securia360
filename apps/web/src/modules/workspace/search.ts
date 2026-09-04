import { createClient } from "@/lib/supabase/server";
import { presentStatus } from "@/lib/status-presentation";
import { listPermissionCodes } from "@/modules/auth/permissions";
import type { EntityReference } from "./types";

function safeSearchTerm(query: string) {
  return query.trim().replace(/[%_,()]/g, " ").replace(/\s+/g, " ").slice(0, 64);
}

export async function searchAuthorizedWorkspace(organizationId: string, userId: string, query: string): Promise<EntityReference[]> {
  const term = safeSearchTerm(query);
  if (term.length < 2) return [];

  const supabase = await createClient();
  const permissions = new Set(await listPermissionCodes(organizationId, userId));
  const pattern = `%${term}%`;
  const requests = await Promise.all([
    permissions.has("planning.read")
      ? supabase.from("tasks").select("id,title,status").eq("organization_id", organizationId).ilike("title", pattern).limit(5)
      : Promise.resolve({ data: [] }),
    permissions.has("improvements.read")
      ? supabase.from("improvement_actions").select("id,title,status").eq("organization_id", organizationId).ilike("title", pattern).limit(5)
      : Promise.resolve({ data: [] }),
    permissions.has("documents.read")
      ? supabase.from("documents").select("id,title,status").eq("organization_id", organizationId).ilike("title", pattern).limit(5)
      : Promise.resolve({ data: [] }),
    permissions.has("sites.read")
      ? supabase.from("sites").select("id,name,status").eq("organization_id", organizationId).ilike("name", pattern).limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const [tasks, improvements, documents, sites] = requests;
  return [
    ...(tasks.data ?? []).map((item) => ({ id: item.id, kind: "task" as const, label: item.title, detail: `Tarea · ${presentStatus(item.status).label}`, href: `/org/${organizationId}/planning` })),
    ...(improvements.data ?? []).map((item) => ({ id: item.id, kind: "improvement" as const, label: item.title, detail: `Acción de mejora · ${presentStatus(item.status).label}`, href: `/org/${organizationId}/improvement-plan` })),
    ...(documents.data ?? []).map((item) => ({ id: item.id, kind: "document" as const, label: item.title, detail: `Documento · ${presentStatus(item.status).label}`, href: `/org/${organizationId}/documents/${item.id}` })),
    ...(sites.data ?? []).map((item) => ({ id: item.id, kind: "site" as const, label: item.name, detail: `Sede · ${presentStatus(item.status).label}`, href: `/org/${organizationId}/settings/structure` })),
  ].slice(0, 12);
}
