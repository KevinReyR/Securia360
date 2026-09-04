import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { BrandMark } from "@/components/brand-mark";

export function AuthShell({ title, description, children, footer }: { title: string; description: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="grid min-h-[100dvh] bg-white lg:grid-cols-[minmax(0,.85fr)_minmax(480px,1.15fr)]">
      <section className="flex flex-col px-5 py-6 sm:px-10 lg:px-14 lg:py-10">
        <BrandMark className="self-start" />
        <div className="my-auto w-full max-w-[440px] py-12 lg:mx-auto">
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.045em]">{title}</h1>
          <p className="text-pretty mt-3 text-base leading-7 text-[var(--muted)]">{description}</p>
          {children}
          {footer ? <div className="mt-6 text-center text-sm text-[var(--muted)]">{footer}</div> : null}
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-[var(--sidebar)] p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/[.06]" />
        <div className="absolute -right-10 -top-10 size-52 rounded-full border border-white/[.08]" />
        <p className="relative text-sm font-medium text-emerald-300">Trabajo seguro, información confiable</p>
        <div className="relative max-w-xl">
          <h2 className="text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.045em]">Todo lo que requiere atención, en el contexto correcto.</h2>
          <ul className="mt-8 grid gap-4 text-[15px] text-[var(--sidebar-muted)]">
            {["Pendientes y vencimientos en un solo lugar", "Responsables, evidencia y decisiones trazables", "Acceso adaptado a cada organización y sede"].map((item) => <li key={item} className="flex gap-3"><CheckCircle size={20} weight="fill" className="shrink-0 text-emerald-300" />{item}</li>)}
          </ul>
        </div>
        <p className="relative text-xs text-[var(--sidebar-muted)]">Securia360 by Reinova Labs</p>
      </aside>
    </main>
  );
}
