import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Breadcrumb({ className, ...props }: ComponentProps<"nav">) {
  return <nav aria-label="Migas de pan" className={cn("min-w-0", className)} {...props} />;
}
export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return <ol className={cn("flex min-w-0 items-center gap-1.5 text-xs text-[var(--muted)]", className)} {...props} />;
}
export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return <li className={cn("flex min-w-0 items-center gap-1.5", className)} {...props} />;
}
export function BreadcrumbLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return <Link href={href} className={cn("truncate rounded-sm outline-none hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--brand)]", className)}>{children}</Link>;
}
export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return <span aria-current="page" className={cn("truncate font-semibold text-[var(--foreground)]", className)} {...props} />;
}
export function BreadcrumbSeparator() { return <li role="presentation" aria-hidden><CaretRight size={12} /></li>; }
