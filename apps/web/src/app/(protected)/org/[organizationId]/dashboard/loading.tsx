import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function DashboardLoading() {
  return <div className="grid gap-7" aria-label="Cargando resumen"><div className="grid gap-3 border-b border-[var(--border)] pb-6"><LoadingSkeleton className="h-9 w-72 max-w-full" /><LoadingSkeleton className="h-5 w-[420px] max-w-full" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <LoadingSkeleton key={index} className="h-36 rounded-[14px]" />)}</div><div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><LoadingSkeleton className="h-[430px] rounded-[14px]" /><div className="grid gap-5"><LoadingSkeleton className="h-56 rounded-[14px]" /><LoadingSkeleton className="h-44 rounded-[14px]" /></div></div></div>;
}
