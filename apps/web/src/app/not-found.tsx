import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-[100dvh] place-items-center bg-[var(--background)] px-5 py-12"><section className="w-full max-w-xl rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-card)] sm:p-12"><BrandMark href="/" /><p className="mt-12 text-sm font-semibold text-[var(--brand)]">Página no disponible</p><h1 className="mt-2 text-balance text-4xl font-semibold tracking-[-0.045em]">No encontramos lo que buscabas</h1><p className="mt-4 max-w-md text-pretty leading-7 text-[var(--muted)]">El enlace puede haber cambiado o no estar disponible para tu cuenta. Regresa al inicio y continúa desde una opción autorizada.</p><Button asChild className="mt-8"><Link href="/"><ArrowLeft size={18} />Volver al inicio</Link></Button></section></main>;
}
