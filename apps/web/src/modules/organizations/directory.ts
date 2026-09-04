export type DirectoryProfile = {
  first_name: string | null;
  middle_name?: string | null;
  last_name: string | null;
  second_last_name?: string | null;
};

export function displayPersonName(profile: DirectoryProfile | null | undefined, fallback = "Persona sin nombre") {
  if (!profile) return fallback;
  return [profile.first_name, profile.middle_name, profile.last_name, profile.second_last_name]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ") || fallback;
}

export function normalizedSearch(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-CO");
}

export function matchesDirectorySearch(values: Array<string | null | undefined>, query: string) {
  const normalizedQuery = normalizedSearch(query);
  if (!normalizedQuery) return true;
  return normalizedSearch(values.filter(Boolean).join(" ")).includes(normalizedQuery);
}

export function safePage(value: string | undefined, total: number, pageSize: number) {
  const parsed = Math.max(1, Number.parseInt(value ?? "1", 10) || 1);
  return Math.min(parsed, Math.max(1, Math.ceil(total / pageSize)));
}
