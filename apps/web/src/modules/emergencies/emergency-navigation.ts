export const emergencyViews = ["summary", "preparedness", "plans", "drills", "directory"] as const;
export type EmergencyView = (typeof emergencyViews)[number];

export function isEmergencyView(value: string | undefined): value is EmergencyView {
  return emergencyViews.includes(value as EmergencyView);
}

export function parseEmergencyView(value: string | undefined): EmergencyView {
  return isEmergencyView(value) ? value : "summary";
}

export function emergencyHref(organizationId: string, siteId: string | undefined, view: EmergencyView) {
  const search = new URLSearchParams({ view });
  if (siteId) search.set("site", siteId);
  return `/org/${organizationId}/emergencies?${search.toString()}`;
}
