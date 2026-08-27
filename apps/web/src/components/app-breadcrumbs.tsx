"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";

const labels: Record<string, string> = { dashboard: "Inicio", onboarding: "Mi SG-SST", settings: "Configuración", organization: "Organización", structure: "Estructura", members: "Personas", profile: "Mi perfil" };

export function AppBreadcrumbs({ organizationId }: { organizationId: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean).slice(2);
  const visible = segments.length ? segments : ["dashboard"];
  return <Breadcrumb className="hidden min-w-0 sm:block"><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href={`/org/${organizationId}/dashboard`}>Securia360</BreadcrumbLink></BreadcrumbItem>{visible.map((segment, index) => { const current = index === visible.length - 1; const href = `/org/${organizationId}/${visible.slice(0, index + 1).join("/")}`; return <BreadcrumbItem key={`${segment}-${index}`}><BreadcrumbSeparator />{current ? <BreadcrumbPage>{labels[segment] ?? segment}</BreadcrumbPage> : <BreadcrumbLink href={href}>{labels[segment] ?? segment}</BreadcrumbLink>}</BreadcrumbItem>; })}</BreadcrumbList></Breadcrumb>;
}
