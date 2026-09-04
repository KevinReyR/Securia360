"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createRiskAssessment } from "./risk-actions";

type Variable = { code: string; label: string; data_type: string; required: boolean; definition: unknown };
type Catalog = { code: string; entries: unknown };
type MethodologyVersion = { id: string; version_code: string; variables: Variable[]; catalogs: Catalog[] };
type AssessmentOption = { id: string; label: string };

function optionsFor(variable: Variable, catalogs: Catalog[]) {
  const definition = variable.definition && typeof variable.definition === "object" && !Array.isArray(variable.definition) ? variable.definition as Record<string, unknown> : {};
  const inline = Array.isArray(definition.options) ? definition.options : null;
  const catalogCode = typeof definition.catalog_code === "string" ? definition.catalog_code : variable.code;
  const entries = inline ?? catalogs.find((catalog) => catalog.code === catalogCode)?.entries;
  if (!Array.isArray(entries)) return [];
  return entries.flatMap((entry) => {
    if (typeof entry === "string" || typeof entry === "number") return [{ value: String(entry), label: String(entry) }];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const item = entry as Record<string, unknown>;
    const value = item.value ?? item.code ?? item.id;
    const label = item.label ?? item.name ?? value;
    return value == null || label == null ? [] : [{ value: String(value), label: String(label) }];
  });
}

export function RiskAssessmentForm({ organizationId, identifications, versions, previousAssessments }: {
  organizationId: string;
  identifications: { id: string; label: string }[];
  versions: MethodologyVersion[];
  previousAssessments: AssessmentOption[];
}) {
  const [versionId, setVersionId] = useState(versions[0]?.id ?? "");
  const inputData = useRef<HTMLInputElement>(null);
  const version = useMemo(() => versions.find((item) => item.id === versionId), [versionId, versions]);

  function prepareSubmission(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const values: Record<string, string | string[] | number | boolean> = {};
    for (const variable of version?.variables ?? []) {
      const fieldName = `variable_${variable.code}`;
      if (variable.data_type === "multiselect") values[variable.code] = data.getAll(fieldName).map(String);
      else {
        const raw = String(data.get(fieldName) ?? "");
        if (!raw && !variable.required) continue;
        if (variable.data_type === "number") values[variable.code] = Number(raw);
        else if (variable.data_type === "boolean") values[variable.code] = raw === "true";
        else values[variable.code] = raw;
      }
    }
    if (inputData.current) inputData.current.value = JSON.stringify(values);
  }

  const ready = Boolean(version && version.variables.length && identifications.length);
  return <form action={createRiskAssessment} onSubmit={prepareSubmission} className="grid gap-4">
    <input type="hidden" name="organizationId" value={organizationId} />
    <input ref={inputData} type="hidden" name="input_data" value="{}" readOnly />
    <label className="grid gap-1.5 text-sm font-medium">Peligro identificado<Select name="risk_identification_id" required>{identifications.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></label>
    <label className="grid gap-1.5 text-sm font-medium">Versión metodológica<Select name="risk_methodology_version_id" required value={versionId} onChange={(event) => setVersionId(event.target.value)}>{versions.map((item) => <option key={item.id} value={item.id}>{item.version_code}</option>)}</Select></label>
    <label className="grid gap-1.5 text-sm font-medium">Tipo de evaluación<Select name="parent_risk_assessment_id" defaultValue=""><option value="">Evaluación inicial</option>{previousAssessments.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></label>
    {version?.variables.length ? <fieldset className="grid gap-4 border-t border-[var(--border)] pt-4"><legend className="px-1 text-sm font-semibold">Variables definidas por la metodología</legend>{version.variables.map((variable) => {
      const options = optionsFor(variable, version.catalogs);
      const name = `variable_${variable.code}`;
      if (variable.data_type === "boolean") return <label key={variable.code} className="grid gap-1.5 text-sm font-medium">{variable.label}<Select name={name} required={variable.required}><option value="">Selecciona</option><option value="true">Sí</option><option value="false">No</option></Select></label>;
      if ((variable.data_type === "select" || variable.data_type === "multiselect") && options.length) return <label key={variable.code} className="grid gap-1.5 text-sm font-medium">{variable.label}<Select name={name} required={variable.required} multiple={variable.data_type === "multiselect"} className={variable.data_type === "multiselect" ? "min-h-28" : undefined}>{variable.data_type === "select" ? <option value="">Selecciona</option> : null}{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label>;
      return <label key={variable.code} className="grid gap-1.5 text-sm font-medium">{variable.label}<Input name={name} type={variable.data_type === "number" ? "number" : "text"} step={variable.data_type === "number" ? "any" : undefined} required={variable.required} /></label>;
    })}</fieldset> : <div className="rounded-[10px] border border-[var(--warning)] bg-[var(--warning-soft)] p-4 text-sm leading-6 text-[var(--warning)]">La versión seleccionada no tiene variables publicadas. Un experto debe completar y revisar su configuración antes de calcular.</div>}
    <Button disabled={!ready}>Calcular con metodología aprobada</Button>
    <p className="text-xs leading-5 text-[var(--muted)]">El resultado apoya la valoración. La aceptación y las medidas requieren criterio profesional.</p>
  </form>;
}
