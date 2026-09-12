export const ppeViews = ["summary", "catalog", "inventory", "assignments", "history"] as const;
export type PpeView = (typeof ppeViews)[number];
export type PpeSiteScope = string | undefined;

export function isPpeView(value: string | undefined): value is PpeView {
  return ppeViews.includes(value as PpeView);
}

export function parsePpeView(value: string | undefined): PpeView {
  return isPpeView(value) ? value : "summary";
}

export function parsePpeSiteScope(value: string | undefined, siteIds: string[]): PpeSiteScope {
  if (!value) return undefined;
  if (value === "general") return value;
  return siteIds.includes(value) ? value : undefined;
}

export function ppeHref(
  organizationId: string,
  site: PpeSiteScope,
  view: PpeView,
  filters: Record<string, string | number | undefined> = {},
) {
  const search = new URLSearchParams({ view });
  if (site) search.set("site", site);
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  return `/org/${organizationId}/ppe?${search.toString()}`;
}
