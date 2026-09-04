import { ArrowRight, Check, CheckCircle, ClipboardText, Files, HardHat, LockKey, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";

const capabilities = [
  ["Cumplimiento conectado", "Convierte evaluaciones y requisitos en brechas, responsables y acciones verificables.", ClipboardText],
  ["Prevención en contexto", "Relaciona procesos, peligros, controles, capacitación y EPP sin perder la trazabilidad.", HardHat],
  ["Evidencia siempre disponible", "Organiza documentos, versiones y vencimientos junto al trabajo que respaldan.", Files],
] as const;

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] bg-white text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-black/[.06] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <BrandMark />
          <nav aria-label="Navegación pública" className="hidden items-center gap-7 text-sm font-medium text-[var(--muted-strong)] md:flex">
            <a href="#capacidades" className="hover:text-[var(--foreground)]">Capacidades</a>
            <a href="#seguridad" className="hover:text-[var(--foreground)]">Seguridad</a>
            <a href="#contacto" className="hover:text-[var(--foreground)]">Contacto</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/auth/login">Ingresar</Link></Button>
            <Button asChild><Link href="/auth/signup">Crear cuenta <ArrowRight size={16} /></Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1440px] items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-12 lg:py-14">
        <div className="max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--success-border)] bg-[var(--success-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--success)]">
            <ShieldCheck size={15} weight="fill" /> Gestión SG-SST conectada
          </div>
          <h1 className="text-balance text-[clamp(2.6rem,6vw,5.6rem)] font-semibold leading-[.96] tracking-[-0.06em]">Del requisito a la mejora, sin perder el control.</h1>
          <p className="text-pretty mt-6 max-w-lg text-lg leading-8 text-[var(--muted)]">{brand.tagline}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild><Link href="/auth/signup">Empezar ahora <ArrowRight size={18} /></Link></Button>
            <Button size="lg" variant="secondary" asChild><Link href="/auth/login">Ver mi organización</Link></Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted-strong)]">
            <span className="flex items-center gap-2"><Check size={15} className="text-[var(--brand)]" />Multiempresa</span>
            <span className="flex items-center gap-2"><Check size={15} className="text-[var(--brand)]" />Evidencia trazable</span>
            <span className="flex items-center gap-2"><Check size={15} className="text-[var(--brand)]" />Decisiones humanas</span>
          </div>
        </div>
        <figure className="relative overflow-hidden rounded-[22px] bg-[var(--muted-surface)]">
          <Image src={brand.heroImage} alt="Profesionales de seguridad y operaciones revisan un plan de trabajo en una planta industrial" width={1536} height={1024} priority className="aspect-[4/3] h-full w-full object-cover object-center lg:aspect-[1.12/1]" />
          <figcaption className="absolute inset-x-4 bottom-4 rounded-[14px] border border-white/30 bg-[#14231be8] p-4 text-white shadow-lg backdrop-blur-sm sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[320px]">
            <p className="text-xs font-medium text-emerald-200">Trabajo conectado</p>
            <p className="mt-1 text-sm font-semibold">Cada hallazgo conserva responsable, evidencia y decisión.</p>
          </figcaption>
        </figure>
      </section>

      <section id="capacidades" className="border-y border-[var(--border)] bg-[var(--background)] scroll-mt-20">
        <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-20">
            <div>
              <p className="text-sm font-semibold text-[var(--brand)]">Una operación, no otro archivo</p>
              <h2 className="text-balance mt-3 text-4xl font-semibold leading-tight tracking-[-0.04em]">El SG-SST avanza cuando el trabajo está conectado.</h2>
              <p className="mt-5 text-base leading-7 text-[var(--muted)]">Securia360 reúne cumplimiento, prevención y seguimiento en un espacio común para que cada persona sepa qué debe hacer y por qué.</p>
            </div>
            <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {capabilities.map(([title, description, Icon], index) => (
                <article key={title} className="grid gap-4 py-7 sm:grid-cols-[48px_1fr_auto] sm:items-center">
                  <span className="grid size-11 place-items-center rounded-[12px] bg-white text-[var(--brand)] shadow-[var(--shadow-control)]"><Icon size={22} weight="duotone" /></span>
                  <div><h3 className="font-semibold tracking-[-0.015em]">{title}</h3><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p></div>
                  <span className="font-mono text-xs text-[var(--muted)]">0{index + 1}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="seguridad" className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-12 lg:py-28">
        <div className="rounded-[20px] bg-[var(--sidebar)] p-8 text-white sm:p-10">
          <LockKey size={28} className="text-emerald-300" weight="duotone" />
          <h2 className="mt-8 text-3xl font-semibold tracking-[-0.04em]">Cada empresa ve únicamente lo que le corresponde.</h2>
          <p className="mt-4 max-w-lg leading-7 text-[var(--sidebar-muted)]">La separación de datos, los permisos por capacidad y el historial de cambios forman parte del núcleo de la plataforma.</p>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold text-[var(--brand)]">Confianza operativa</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Información clara para decidir mejor.</h2>
          <ul className="mt-8 grid gap-5">
            {["Trazabilidad desde el requisito hasta la evidencia", "Revisión humana para decisiones críticas", "Historial y versiones que no se alteran silenciosamente", "Acceso ajustado a la organización, la sede y la responsabilidad"].map((item) => <li key={item} className="flex gap-3 text-[15px] leading-6 text-[var(--muted-strong)]"><CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-[var(--brand)]" />{item}</li>)}
          </ul>
        </div>
      </section>

      <section id="contacto" className="bg-[var(--brand)] text-white scroll-mt-20">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center lg:px-12">
          <div><h2 className="text-3xl font-semibold tracking-[-0.035em]">Empieza a ordenar tu gestión preventiva.</h2><p className="mt-2 text-emerald-100">Crea tu cuenta o conversa con el equipo de Reinova Labs.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row"><Button size="lg" variant="secondary" asChild><Link href="/auth/signup">Crear cuenta</Link></Button><Button size="lg" className="bg-white/10 hover:bg-white/20" asChild><a href={`mailto:${brand.contactEmail}`}>Hablar con nosotros</a></Button></div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-5 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><BrandMark /><p>Producto de {brand.company}. La plataforma apoya la gestión y no reemplaza el criterio profesional.</p></div>
      </footer>
    </main>
  );
}
