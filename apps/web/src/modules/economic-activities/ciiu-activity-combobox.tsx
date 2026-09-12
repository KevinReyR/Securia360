"use client";

import { CaretDown, Check, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type EconomicActivityOption, searchEconomicActivities } from "./economic-activities";

export const RISK_LABELS = ["", "I", "II", "III", "IV", "V"] as const;

export function CiiuActivityCombobox({
  value,
  onChange,
  invalid,
}: {
  value: EconomicActivityOption | null;
  onChange: (option: EconomicActivityOption) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<EconomicActivityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(false);
      searchEconomicActivities(query)
        .then((results) => { if (active) setOptions(results); })
        .catch(() => { if (active) { setOptions([]); setError(true); } })
        .finally(() => { if (active) setLoading(false); });
    }, query ? 220 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [open, query, nonce]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          role="combobox"
          aria-label="Código CIIU y actividad económica, obligatorio"
          aria-expanded={open}
          aria-invalid={invalid}
          className="h-auto min-h-11 w-full justify-between gap-3 px-3 py-2 text-left font-normal"
        >
          {value ? (
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="font-mono font-semibold text-[var(--foreground)]">{value.ciiu_code}</span>
                <span className="rounded-full bg-[var(--warning-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--warning)]">Riesgo {RISK_LABELS[value.risk_class]}</span>
              </span>
              <span className="mt-1 block truncate text-xs text-[var(--muted)]">{value.activity}</span>
            </span>
          ) : <span className="text-[var(--muted)]">Buscar por código o actividad…</span>}
          <CaretDown size={16} className="shrink-0 text-[var(--muted)]" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(680px,calc(100vw-2rem))] p-0">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Ej. 161-01, café o fumigación" aria-label="Buscar actividad económica" />
          <CommandList>
            {loading ? <div role="status" className="px-3 py-8 text-center text-sm text-[var(--muted)]">Consultando catálogo…</div> : null}
            {!loading && error ? (
              <div role="alert" className="grid justify-items-center gap-3 px-4 py-8 text-center text-sm text-[var(--muted)]">
                <WarningCircle size={22} className="text-[var(--warning)]" />
                <p>No pudimos consultar el catálogo.</p>
                <Button type="button" size="sm" variant="secondary" onClick={() => setNonce((current) => current + 1)}>Intentar de nuevo</Button>
              </div>
            ) : null}
            {!loading && !error && options.length === 0 ? <CommandEmpty>No encontramos actividades para esta búsqueda.</CommandEmpty> : null}
            {!loading && !error ? options.map((option) => (
              <CommandItem
                key={option.entry_id}
                value={option.entry_id}
                onSelect={() => { onChange(option); setOpen(false); setQuery(""); }}
                className="items-start py-3"
              >
                <Check size={16} className={`mt-0.5 shrink-0 ${value?.entry_id === option.entry_id ? "opacity-100" : "opacity-0"}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold">{option.ciiu_code}</span>
                    <span className="rounded-full bg-[var(--warning-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--warning)]">Riesgo {RISK_LABELS[option.risk_class]}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{option.activity}</span>
                </span>
              </CommandItem>
            )) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
