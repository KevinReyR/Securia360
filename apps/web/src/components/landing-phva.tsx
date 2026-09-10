import { ArrowRight, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import { brand } from "@/config/brand";

const stages = [
  {
    letter: "P", name: "Planear", purpose: "Conoce tu punto de partida y define prioridades.",
    features: [
      ["Evaluación inicial y requisitos", "Identifica estándares aplicables, registra respuestas y reconoce oportunidades de mejora."],
      ["Riesgos y controles", "Relaciona procesos, actividades y peligros con su valoración y medidas de intervención."],
      ["Plan anual y responsabilidades", "Organiza actividades, tareas, responsables y fechas según las necesidades de tu empresa."],
    ],
    outcome: "Prioridades y un plan de trabajo con responsables.",
  },
  {
    letter: "H", name: "Hacer", purpose: "Lleva la prevención al trabajo de cada día.",
    features: [
      ["Capacitaciones y EPP", "Gestiona sesiones, asistencia, evaluación, entregas, aceptación e inspecciones de equipos."],
      ["Contratistas y salud ocupacional", "Da seguimiento a requisitos de acceso, documentos, programas y vencimientos con permisos específicos."],
      ["Emergencias, incidentes y comités", "Organiza brigadas y simulacros; documenta investigaciones, reuniones y compromisos."],
    ],
    outcome: "Actividades ejecutadas y evidencia de lo realizado.",
  },
  {
    letter: "V", name: "Verificar", purpose: "Comprueba el avance y revisa la eficacia.",
    features: [
      ["Indicadores e históricos", "Consulta resultados, metas y períodos para observar el avance de la gestión."],
      ["Auditorías y revisión por la dirección", "Registra hallazgos, informes y decisiones con trazabilidad e independencia cuando corresponda."],
      ["Seguimiento de evidencias y controles", "Revisa documentos, vencimientos y verificaciones para identificar lo que requiere atención."],
    ],
    outcome: "Resultados y hallazgos que sustentan decisiones.",
  },
  {
    letter: "A", name: "Actuar", purpose: "Convierte los hallazgos en mejoras verificables.",
    features: [
      ["Plan de mejoramiento", "Conecta oportunidades de mejora con acciones, responsables y fechas de seguimiento."],
      ["Validación y cierre", "Conserva la evidencia y la revisión humana que respaldan el cierre de cada acción."],
      ["Reevaluación y nueva planificación", "Usa los resultados para revisar controles y ajustar las prioridades del siguiente ciclo."],
    ],
    outcome: "Mejoras verificadas que alimentan una nueva planificación.",
  },
] as const;

export function LandingPhva() {
  return (
    <section id="funcionalidades-phva" aria-labelledby="phva-title" tabIndex={-1} className="scroll-mt-32 border-b border-[var(--border)] bg-white/90 outline-none lg:scroll-mt-20">
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="max-w-3xl">
          <h2 id="phva-title" className="text-balance text-4xl font-semibold leading-tight tracking-[-0.04em]">Funcionalidades para cada etapa del ciclo PHVA</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)]">{brand.name} conecta Planear, Hacer, Verificar y Actuar para organizar la prevención, documentar lo realizado y dar seguimiento a las obligaciones de seguridad y salud en el trabajo.</p>
        </div>
        <ol className="mt-12 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {stages.map((stage) => (
            <li key={stage.letter} className="grid gap-7 py-9 lg:grid-cols-[.75fr_1.25fr] lg:gap-16 lg:py-10">
              <div>
                <div className="flex items-center gap-4">
                  <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-[var(--brand-soft)] text-2xl font-semibold text-[var(--brand)]">{stage.letter}</span>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">{stage.name}</h3>
                </div>
                <p className="mt-4 max-w-sm text-lg leading-7 text-[var(--muted-strong)]">{stage.purpose}</p>
                <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]"><span className="font-semibold text-[var(--brand)]">Qué obtienes: </span>{stage.outcome}</p>
              </div>
              <ul className="grid content-start gap-6">
                {stage.features.map(([title, description]) => (
                  <li key={title} className="grid grid-cols-[16px_minmax(0,1fr)] gap-3">
                    <ArrowRight size={16} aria-hidden="true" className="mt-1 text-[var(--brand)]" />
                    <div><h4 className="text-base font-semibold">{title}</h4><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p></div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex items-start gap-3 text-sm leading-6 text-[var(--muted-strong)]">
          <ArrowsClockwise size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--brand)]" />
          <p><strong>Un ciclo conectado.</strong> Documentos, personas, permisos y trazabilidad acompañan todas las etapas. Esta organización muestra el uso principal de cada funcionalidad; varios módulos participan en más de una fase. Consulta el <a href="#marco-normativo" className="font-semibold text-[var(--brand)] underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">marco normativo de referencia</a>.</p>
        </div>
      </div>
    </section>
  );
}
