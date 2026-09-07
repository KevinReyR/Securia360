import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

export const economicActivityOptionSchema = z.object({
  entry_id: z.uuid(),
  ciiu_code: z.string().regex(/^[0-9]{1,4}-[0-9]{2}$/),
  risk_class: z.coerce.number().int().min(1).max(5),
  activity: z.string().trim().min(3).max(2_000),
  catalog_version: z.string().trim().min(1).max(80),
  source_reference: z.string().trim().min(3).max(300),
  source_review_status: z.string().trim().min(1).max(40),
});

export type EconomicActivityOption = z.infer<typeof economicActivityOptionSchema>;

type RpcClient = {
  rpc: (
    name: "search_public_economic_activities",
    args: { p_query: string; p_limit: number },
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export async function searchEconomicActivities(query: string): Promise<EconomicActivityOption[]> {
  const { data, error } = await (createClient() as unknown as RpcClient).rpc("search_public_economic_activities", {
    p_query: query.trim().slice(0, 120),
    p_limit: 50,
  });
  if (error) throw new Error("No fue posible consultar las actividades económicas.");
  return z.array(economicActivityOptionSchema).max(50).parse(data ?? []);
}
