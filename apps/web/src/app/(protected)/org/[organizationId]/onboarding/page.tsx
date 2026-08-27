import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm, type OnboardingMemberOption } from "@/modules/organizations/onboarding-form";
import { onboardingSitesSchema } from "@/modules/organizations/schemas";
import { requireTenant } from "@/modules/organizations/tenant";
import type { Json } from "@/types/database";

type JsonObject = { [key: string]: Json | undefined };

function objectValue(value: Json | undefined): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export default async function OnboardingPage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId } = await params;
  const { organization, userId } = await requireTenant(organizationId);
  const supabase = await createClient();
  const [{ data: progress }, { data: entity }, { data: existingSites }, { data: characteristics }, { data: members }] = await Promise.all([
    supabase.from("onboarding_progress").select("current_step,draft_data,completed_at").eq("organization_id", organizationId).maybeSingle(),
    supabase.from("legal_entities").select("id,legal_name,trade_name,tax_id,ciiu_code,economic_activity,employee_count,risk_class").eq("organization_id", organizationId).eq("status", "active").order("created_at").limit(1).maybeSingle(),
    supabase.from("sites").select("name,code,address,city,department,legal_entity_id").eq("organization_id", organizationId).eq("status", "active").order("created_at"),
    supabase.from("organization_characteristics").select("work_at_height,confined_spaces,chemical_exposure,electrical_work,transport_operations,heavy_machinery,night_work,remote_work,manual_load_handling").eq("organization_id", organizationId).maybeSingle(),
    supabase.from("organization_members").select("id,user_id").eq("organization_id", organizationId).eq("status", "active").order("created_at"),
  ]);

  if (progress?.completed_at) redirect(`/org/${organizationId}/dashboard`);

  const userIds = members?.map((member) => member.user_id) ?? [];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id,first_name,last_name").in("id", userIds)
    : { data: [] };
  const memberOptions: OnboardingMemberOption[] = (members ?? []).map((member) => {
    const profile = profiles?.find((item) => item.id === member.user_id);
    const name = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "";
    return { id: member.id, label: name || (member.user_id === userId ? "Usuario creador" : member.user_id) };
  });

  const fallbackSites = (existingSites ?? [])
    .filter((site) => !entity || site.legal_entity_id === entity.id)
    .map(({ name, code, address, city, department }) => ({ name, code, address: address ?? "", city: city ?? "", department: department ?? "" }));
  const draft = objectValue(progress?.draft_data);
  const parsedDraftSites = onboardingSitesSchema.safeParse(draft.sites);
  const draftSites = parsedDraftSites.success ? parsedDraftSites.data : null;
  const responsibleMembership = members?.find((member) => member.user_id === userId)?.id ?? members?.[0]?.id ?? "";

  const initialValues = {
    organization: { name: organization.name, nit: organization.nit ?? "", ...objectValue(draft.organization) },
    legal_entity: { legal_name: entity?.legal_name ?? organization.name, trade_name: entity?.trade_name ?? "", tax_id: entity?.tax_id ?? organization.nit ?? "", ...objectValue(draft.legal_entity) },
    economic_activity: { economic_activity: entity?.economic_activity ?? "", ...objectValue(draft.economic_activity) },
    ciiu: { ciiu_code: entity?.ciiu_code ?? "", ...objectValue(draft.ciiu) },
    workforce: { employee_count: entity?.employee_count ?? 0, ...objectValue(draft.workforce) },
    risk: { risk_class: entity?.risk_class ?? 1, ...objectValue(draft.risk) },
    sites: draftSites ?? (fallbackSites.length ? fallbackSites : [{ name: "Sede principal", code: "PRINCIPAL", address: "", city: "", department: "" }]),
    responsible: { member_id: responsibleMembership, ...objectValue(draft.responsible) },
    characteristics: {
      work_at_height: characteristics?.work_at_height ?? false,
      confined_spaces: characteristics?.confined_spaces ?? false,
      chemical_exposure: characteristics?.chemical_exposure ?? false,
      electrical_work: characteristics?.electrical_work ?? false,
      transport_operations: characteristics?.transport_operations ?? false,
      heavy_machinery: characteristics?.heavy_machinery ?? false,
      night_work: characteristics?.night_work ?? false,
      remote_work: characteristics?.remote_work ?? false,
      manual_load_handling: characteristics?.manual_load_handling ?? false,
      ...objectValue(draft.characteristics),
    },
  };
  const { status } = await searchParams;

  return <div><PageHeader eyebrow="Configuración empresarial" title="Onboarding de la organización" description="El avance se guarda en cada paso y puede retomarse más adelante." /><div className="mt-6"><StatusBanner status={status} /><Card><CardContent><OnboardingForm organizationId={organizationId} initialStep={progress?.current_step ?? 1} initialValues={initialValues} members={memberOptions} /></CardContent></Card></div></div>;
}
