import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function ProtectedLoading() {
  return <main className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8" aria-busy="true" aria-label="Cargando contenido"><div className="grid gap-3"><LoadingSkeleton className="h-4 w-32" /><LoadingSkeleton className="h-10 w-full max-w-xl" /><LoadingSkeleton className="h-5 w-full max-w-2xl" /></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <LoadingSkeleton key={index} className="h-28" />)}</div><LoadingSkeleton className="h-72" /></main>;
}
