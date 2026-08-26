import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingForm } from "@/modules/organizations/onboarding-form";
import { requireTenant } from "@/modules/organizations/tenant";

export default async function OnboardingPage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId } = await params;
  await requireTenant(organizationId);
  const { status } = await searchParams;
  return <div><PageHeader title="Configuración inicial" description="Completa los datos que utilizará el futuro motor de aplicabilidad del SG-SST." /><div className="mt-6"><StatusBanner status={status} /><Card><CardContent><OnboardingForm organizationId={organizationId} /></CardContent></Card></div></div>;
}
