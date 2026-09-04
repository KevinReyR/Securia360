import type { Icon } from "@phosphor-icons/react";
import { Buildings, CalendarCheck, ChartLineUp, ClipboardText, FileText, Files, FirstAid, Gear, HardHat, House, Lightning, ListChecks, ShieldCheck, Sparkle, UsersThree, WarningDiamond } from "@phosphor-icons/react";
import type { PermissionCode } from "@/modules/auth/permissions";

export type NavigationItem = { label: string; suffix: string; icon: Icon; permission?: PermissionCode; keywords: string[] };
export type NavigationSection = { label: string; icon: Icon; items: NavigationItem[] };

export const navigationHome: NavigationItem = { label: "Inicio", suffix: "dashboard", icon: House, keywords: ["panel", "resumen", "atención"] };

export const navigationSections: NavigationSection[] = [
  { label: "Trabajo", icon: ListChecks, items: [
    { label: "Plan anual y tareas", suffix: "planning", icon: CalendarCheck, permission: "planning.read", keywords: ["pendientes", "tareas", "calendario"] },
    { label: "Acciones de mejora", suffix: "improvement-plan", icon: ListChecks, permission: "improvements.read", keywords: ["brechas", "evidencias", "cierre"] },
  ] },
  { label: "Cumplimiento", icon: ShieldCheck, items: [
    { label: "Evaluación y requisitos", suffix: "compliance", icon: ClipboardText, permission: "assessments.read", keywords: ["0312", "clasificación", "aplicabilidad", "snapshots"] },
    { label: "Documentos", suffix: "documents", icon: Files, permission: "documents.read", keywords: ["evidencias", "versiones", "vencimientos"] },
  ] },
  { label: "Prevención", icon: WarningDiamond, items: [
    { label: "Riesgos y controles", suffix: "risks", icon: WarningDiamond, permission: "risks.read", keywords: ["peligros", "gtc 45", "reevaluación"] },
    { label: "Capacitaciones", suffix: "training", icon: CalendarCheck, permission: "training.read", keywords: ["asistencia", "certificados", "competencias"] },
    { label: "EPP", suffix: "ppe", icon: HardHat, permission: "ppe.read", keywords: ["inventario", "entregas", "inspecciones"] },
    { label: "Emergencias", suffix: "emergencies", icon: FirstAid, permission: "emergencies.read", keywords: ["brigadas", "simulacros", "planes"] },
    { label: "Incidentes", suffix: "incidents", icon: WarningDiamond, permission: "incidents.read", keywords: ["investigación", "acciones", "cierre"] },
    { label: "Salud ocupacional", suffix: "occupational-health", icon: FirstAid, permission: "occupational_health.read", keywords: ["aptitud", "restricciones", "vigilancia"] },
  ] },
  { label: "Organización", icon: Buildings, items: [
    { label: "Personas", suffix: "settings/members", icon: UsersThree, permission: "members.read", keywords: ["miembros", "roles", "usuarios"] },
    { label: "Estructura", suffix: "settings/structure", icon: Buildings, permission: "organization.read", keywords: ["razones sociales", "sedes", "áreas"] },
    { label: "Contratistas", suffix: "contractors", icon: UsersThree, permission: "contractors.read", keywords: ["proveedores", "contratos", "portal"] },
    { label: "Comités y auditorías", suffix: "governance", icon: ClipboardText, permission: "committees.read", keywords: ["actas", "hallazgos", "dirección"] },
  ] },
  { label: "Análisis", icon: ChartLineUp, items: [
    { label: "Indicadores", suffix: "analytics", icon: ChartLineUp, permission: "analytics.read", keywords: ["dashboard", "resultados", "histórico"] },
    { label: "Automatizaciones", suffix: "automations", icon: Lightning, permission: "automations.read", keywords: ["reglas", "eventos", "reintentos"] },
    { label: "Importaciones", suffix: "imports", icon: FileText, permission: "imports.read", keywords: ["csv", "xlsx", "trabajadores"] },
  ] },
];

export const navigationUtilities: NavigationItem[] = [
  { label: "Securia Copilot", suffix: "copilot", icon: Sparkle, permission: "copilot.read", keywords: ["asistente", "fuentes", "propuestas"] },
  { label: "Configuración", suffix: "settings/organization", icon: Gear, permission: "organization.read", keywords: ["empresa", "perfil", "facturación"] },
];

export const navigationItems = [navigationHome, ...navigationSections.flatMap((section) => section.items), ...navigationUtilities];

export function navigationHref(organizationId: string, suffix: string) {
  return `/org/${organizationId}/${suffix}`;
}

export function navigationPermissions() {
  return [...new Set(navigationItems.flatMap((item) => item.permission ? [item.permission] : []))];
}

export function isNavigationItemAllowed(item: NavigationItem, allowedPermissions?: readonly PermissionCode[]) {
  return !item.permission || !allowedPermissions || allowedPermissions.includes(item.permission);
}
