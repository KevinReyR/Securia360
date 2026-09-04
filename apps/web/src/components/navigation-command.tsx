"use client";

import { ArrowRight, FileText, ListChecks, MapPin, SpinnerGap } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isNavigationItemAllowed, navigationHref, navigationItems } from "./navigation-config";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "./ui/command";
import type { PermissionCode } from "@/modules/auth/permissions";
import type { EntityReference } from "@/modules/workspace/types";

const resultIcons = { task: ListChecks, improvement: ListChecks, document: FileText, site: MapPin };

export function NavigationCommand({ organizationId, open, onOpenChange, allowedPermissions }: { organizationId: string; open: boolean; onOpenChange: (open: boolean) => void; allowedPermissions?: readonly PermissionCode[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EntityReference[]>([]);
  const [resultsFor, setResultsFor] = useState("");
  const [loadingFor, setLoadingFor] = useState("");
  const visibleItems = navigationItems.filter((item) => isNavigationItemAllowed(item, allowedPermissions));
  const loading = query.trim().length >= 2 && loadingFor === query;
  const visibleResults = resultsFor === query ? results : [];

  useEffect(() => {
    if (!open || query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingFor(query);
      try {
        const response = await fetch(`/api/workspace/search?organizationId=${encodeURIComponent(organizationId)}&q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const payload = response.ok ? await response.json() as { results?: EntityReference[] } : { results: [] };
        setResults(payload.results ?? []);
        setResultsFor(query);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) { setResults([]); setResultsFor(query); }
      } finally {
        if (!controller.signal.aborted) setLoadingFor("");
      }
    }, 220);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [open, organizationId, query]);

  function navigate(href: string) {
    router.push(href);
    onOpenChange(false);
    setQuery("");
  }

  return <CommandDialog open={open} onOpenChange={onOpenChange} title="Buscar en Securia360"><CommandInput autoFocus value={query} onValueChange={setQuery} placeholder="Busca una pantalla, tarea, acción, documento o sede..." /><CommandList><CommandEmpty>{loading ? "Buscando en tu espacio de trabajo..." : "No encontramos resultados disponibles."}</CommandEmpty><CommandGroup heading="Navegación">{visibleItems.map(({ label, icon: Icon, keywords, suffix }) => {
    return <CommandItem key={label} value={[label, ...keywords].join(" ")} onSelect={() => navigate(navigationHref(organizationId, suffix))}><Icon size={18} className="text-[var(--muted)]" /><span>{label}</span><CommandShortcut><ArrowRight size={14} /></CommandShortcut></CommandItem>;
  })}</CommandGroup>{query.trim().length >= 2 ? <CommandGroup heading="Resultados autorizados">{loading ? <CommandItem disabled><SpinnerGap size={18} className="animate-spin text-[var(--muted)]" />Buscando...</CommandItem> : visibleResults.map((result) => { const Icon = resultIcons[result.kind]; return <CommandItem key={`${result.kind}-${result.id}`} value={`${result.label} ${result.detail}`} onSelect={() => navigate(result.href)}><Icon size={18} className="text-[var(--brand)]" /><span className="min-w-0"><span className="block truncate font-medium">{result.label}</span><span className="block truncate text-xs text-[var(--muted)]">{result.detail}</span></span><CommandShortcut><ArrowRight size={14} /></CommandShortcut></CommandItem>; })}</CommandGroup> : null}</CommandList></CommandDialog>;
}
