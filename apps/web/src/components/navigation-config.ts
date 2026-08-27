import {
  CalendarCheck,
  ChartLineUp,
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
  { label: "Planificación", suffix: "improvement-plan", icon: CalendarCheck, available: true, keywords: ["plan de mejoramiento", "brechas", "acciones"] },
  { label: "Personas", suffix: "settings/members", icon: UsersThree, available: true, keywords: ["miembros", "roles", "usuarios"] },
  { label: "Riesgos", suffix: "risks", icon: WarningDiamond, available: true, keywords: ["gtc 45", "peligros", "controles"] },
  { label: "Operación", icon: HardHat, available: false, keywords: ["inspecciones", "epp"] },
  { label: "Documentos", icon: Files, available: false, keywords: ["evidencias", "archivos"] },
  { label: "Analítica", icon: ChartLineUp, available: false, keywords: ["indicadores", "reportes"] },
  { label: "Automatizaciones", icon: Lightning, available: false, keywords: ["flujos", "alertas"] },
  { label: "Securia Copilot", icon: Sparkle, available: false, keywords: ["ia", "asistente"] },
  { label: "Configuración", suffix: "settings/organization", icon: Gear, available: true, keywords: ["empresa", "estructura", "perfil"] },
] as const;

export function navigationHref(organizationId: string, suffix: string) {
  return `/org/${organizationId}/${suffix}`;
}
