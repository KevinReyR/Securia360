"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";

const labels: Record<string, string> = { dashboard: "Inicio", onboarding: "Puesta en marcha", settings: "Configuración", organization: "Organización", structure: "Estructura", members: "Personas", profile: "Mi perfil", planning: "Plan anual y tareas", "improvement-plan": "Acciones de mejora", compliance: "Cumplimiento", documents: "Documentos", risks: "Riesgos y controles", training: "Capacitaciones", ppe: "EPP", contractors: "Contratistas", incidents: "Incidentes", "occupational-health": "Salud ocupacional", emergencies: "Emergencias", governance: "Comités y auditorías", analytics: "Indicadores", automations: "Automatizaciones", imports: "Importaciones", copilot: "Securia Copilot" };

export function AppBreadcrumbs({ organizationId }: { organizationId: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean).slice(2);
  const visible = segments.length ? segments : ["dashboard"];
  return <Breadcrumb className="hidden min-w-0 sm:block"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href={`/org/${organizationId}/dashboard`}>Inicio</BreadcrumbLink></BreadcrumbItem>{visible.filter((segment) => segment !== "dashboard").map((segment, index, filtered) => { const current = index === filtered.length - 1; const originalIndex = visible.indexOf(segment); const href = `/org/${organizationId}/${visible.slice(0, originalIndex + 1).join("/")}`; return <BreadcrumbItem key={`${segment}-${index}`}><BreadcrumbSeparator />{current ? <BreadcrumbPage>{labels[segment] ?? segment.replaceAll("-", " ")}</BreadcrumbPage> : <BreadcrumbLink href={href}>{labels[segment] ?? segment.replaceAll("-", " ")}</BreadcrumbLink>}</BreadcrumbItem>; })}</BreadcrumbList></Breadcrumb>;
}
