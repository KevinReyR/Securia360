import {
  CalendarCheck,
  ChartLineUp,
  ClipboardText,
  Files,
  Gear,
  HardHat,
  House,
  Lightning,
  ShieldCheck,
  Sparkle,
  UsersThree,
  WarningDiamond,
} from "@phosphor-icons/react";

export const navigationItems = [
  { label: "Inicio", suffix: "dashboard", icon: House, available: true, keywords: ["dashboard", "resumen"] },
  { label: "Mi SG-SST", suffix: "onboarding", icon: ShieldCheck, available: true, keywords: ["onboarding", "sistema"] },
  { label: "Cumplimiento", suffix: "compliance", icon: ClipboardText, available: true, keywords: ["normativa", "0312", "evaluaciones", "clasificación"] },
  { label: "Planificación", suffix: "planning", icon: CalendarCheck, available: true, keywords: ["plan anual", "tareas", "brechas", "acciones"] },
  { label: "Personas", suffix: "settings/members", icon: UsersThree, available: true, keywords: ["miembros", "roles", "usuarios"] },
  { label: "Capacitaciones", suffix: "training", icon: CalendarCheck, available: true, keywords: ["competencias", "asistencia", "certificados"] },
  { label: "Riesgos", suffix: "risks", icon: WarningDiamond, available: true, keywords: ["gtc 45", "peligros", "controles"] },
  { label: "EPP", suffix: "ppe", icon: HardHat, available: true, keywords: ["elementos de protección personal", "inventario", "entrega"] },
  { label: "Contratistas", suffix: "contractors", icon: UsersThree, available: true, keywords: ["proveedores", "contratos", "portal"] },
  { label: "Incidentes", suffix: "incidents", icon: WarningDiamond, available: true, keywords: ["accidentes", "investigaciones", "evidencias"] },
  { label: "Salud ocupacional", suffix: "occupational-health", icon: ShieldCheck, available: true, keywords: ["aptitud", "restricciones", "vigilancia"] },
  { label: "Emergencias", suffix: "emergencies", icon: WarningDiamond, available: true, keywords: ["simulacros", "brigadas", "planes"] },
  { label: "Gobierno y auditoría", suffix: "governance", icon: ClipboardText, available: true, keywords: ["comités", "actas", "auditorías", "revisión por la dirección"] },
  { label: "Documentos", suffix: "documents", icon: Files, available: true, keywords: ["evidencias", "archivos"] },
  { label: "Importaciones", suffix: "imports", icon: Files, available: true, keywords: ["csv", "xlsx", "trabajadores", "estructura"] },
  { label: "Analítica", suffix: "analytics", icon: ChartLineUp, available: true, keywords: ["indicadores", "reportes"] },
  { label: "Automatizaciones", suffix: "automations", icon: Lightning, available: true, keywords: ["flujos", "alertas"] },
  { label: "Securia Copilot", suffix: "copilot", icon: Sparkle, available: true, keywords: ["ia", "asistente"] },
  { label: "Configuración", suffix: "settings/organization", icon: Gear, available: true, keywords: ["empresa", "estructura", "perfil"] },
] as const;

export function navigationHref(organizationId: string, suffix: string) {
  return `/org/${organizationId}/${suffix}`;
}
