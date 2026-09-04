import Link from "next/link";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

export function BrandMark({ href = "/", inverse = false, compact = false, className }: { href?: string; inverse?: boolean; compact?: boolean; className?: string }) {
  return (
    <Link href={href} aria-label={`${brand.name}, inicio`} className={cn("inline-flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2", className)}>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-[10px]", inverse ? "bg-emerald-300 text-emerald-950" : "bg-[var(--brand)] text-white")}>
        <ShieldCheck size={21} weight="duotone" aria-hidden />
      </span>
      {!compact ? (
        <span className="min-w-0 leading-none">
          <span className={cn("block text-[15px] font-bold tracking-[-0.02em]", inverse ? "text-white" : "text-[var(--foreground)]")}>{brand.name}</span>
          <span className={cn("mt-1 block text-[10px] font-medium uppercase tracking-[0.12em]", inverse ? "text-[var(--sidebar-muted)]" : "text-[var(--muted)]")}>by {brand.company}</span>
        </span>
      ) : null}
    </Link>
  );
}
