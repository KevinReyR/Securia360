import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

export function PublicAssessmentShell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-white/95 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
          <BrandMark />
          <Link href="/" className="inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-semibold text-[var(--muted-strong)] outline-none hover:bg-[var(--muted-surface)] focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]">
            <ArrowLeft size={16} aria-hidden="true" /> Volver al inicio
          </Link>
        </div>
      </header>
      <main className={compact ? "mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:px-12 lg:py-10" : undefined}>{children}</main>
    </div>
  );
}
