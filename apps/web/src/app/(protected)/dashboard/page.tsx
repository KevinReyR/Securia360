import { redirectToActiveTenant } from "@/modules/organizations/tenant";

export default async function DashboardPage() {
  return redirectToActiveTenant();
}
