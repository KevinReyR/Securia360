import { createClient } from "@/lib/supabase/client";
import { publicAssessmentCatalogSchema, type PublicAssessmentCatalog } from "./schemas";

type RpcClient = {
  rpc: (name: "get_public_initial_assessment_catalog") => Promise<{ data: unknown; error: { message: string } | null }>;
};

export async function loadPublicAssessmentCatalog(): Promise<PublicAssessmentCatalog> {
  const { data, error } = await (createClient() as unknown as RpcClient).rpc("get_public_initial_assessment_catalog");
  if (error) throw new Error("No fue posible consultar el catálogo público.");
  const parsed = publicAssessmentCatalogSchema.safeParse(data);
  if (!parsed.success || parsed.data.profiles.length === 0) {
    throw new Error("El catálogo aún no tiene perfiles revisados disponibles.");
  }
  return parsed.data;
}
