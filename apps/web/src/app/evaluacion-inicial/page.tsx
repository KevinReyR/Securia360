import type { Metadata } from "next";
import { ArrowRight, Browser, CheckCircle, LockKey, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { LandingAtmosphere } from "@/components/landing-atmosphere";
import { Button } from "@/components/ui/button";
import { AssessmentHistory } from "@/modules/public-assessment/history-client";
import { PublicAssessmentShell } from "@/modules/public-assessment/public-assessment-shell";

export const metadata: Metadata = {
  title: "Evaluación Inicial SG-SST | Securia360",
  description: "Diagnóstico inicial gratuito de los Estándares Mínimos del SG-SST. Tus respuestas permanecen en este navegador.",
};

export default function InitialAssessmentPage() {
  return (
    <PublicAssessmentShell>
      <div className="relative isolate overflow-hidden">
        <LandingAtmosphere />
        <section className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--success-border)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--brand)] backdrop-blur-sm"><ShieldCheck size={15} weight="fill" /> Herramienta pública y gratuita</span>
            <h1 className="mt-6 text-balance text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[.98] tracking-[-0.055em]">Conoce el punto de partida de tu SG-SST.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted-strong)]">Responde los estándares que corresponden al tamaño y nivel de riesgo de tu empresa. Obtendrás un resultado orientativo y una lista priorizada de oportunidades de mejora.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild><Link href="/evaluacion-inicial/nueva">Iniciar evaluación <ArrowRight size={18} /></Link></Button>
              <Button size="lg" variant="secondary" asChild><a href="#mis-evaluaciones">Ver mis evaluaciones</a></Button>
            </div>
          </div>
          <aside className="self-end rounded-[18px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_80px_rgba(18,54,37,.10)] backdrop-blur-md sm:p-8">
            <h2 className="text-xl font-semibold tracking-[-0.025em]">Privacidad desde el inicio</h2>
            <div className="mt-6 grid gap-5">
              <div className="flex gap-3"><Browser size={22} className="mt-0.5 shrink-0 text-[var(--brand)]" weight="duotone" /><div><h3 className="font-semibold">Solo en este navegador</h3><p className="mt-1 text-sm leading-6 text-[var(--muted)]">La empresa, las respuestas y los resultados no se envían a Securia360.</p></div></div>
              <div className="flex gap-3"><LockKey size={22} className="mt-0.5 shrink-0 text-[var(--brand)]" weight="duotone" /><div><h3 className="font-semibold">Sin cuenta y sin seguimiento</h3><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Puedes empezar sin registrarte. El historial desaparece si borras los datos del navegador.</p></div></div>
              <div className="flex gap-3"><CheckCircle size={22} className="mt-0.5 shrink-0 text-[var(--brand)]" weight="duotone" /><div><h3 className="font-semibold">Criterio profesional</h3><p className="mt-1 text-sm leading-6 text-[var(--muted)]">El resultado orienta prioridades; no certifica cumplimiento ni sustituye la evaluación formal.</p></div></div>
            </div>
          </aside>
        </section>
      </div>
      <div id="mis-evaluaciones" className="scroll-mt-8 border-t border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-8 lg:px-12 lg:py-16"><AssessmentHistory /></div>
      </div>
    </PublicAssessmentShell>
  );
}
