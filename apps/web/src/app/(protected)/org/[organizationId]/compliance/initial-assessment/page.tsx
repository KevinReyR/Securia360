/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "@/components/page-header";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/modules/auth/permissions";
import { startInitialAssessment } from "@/modules/compliance/initial-assessment-actions";
import { requireTenant } from "@/modules/organizations/tenant";

export default async function InitialAssessmentStartPage({ params, searchParams }: { params: Promise<{ organizationId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { organizationId } = await params;
  const query = await searchParams;
  await requireTenant(organizationId);
  const [read, manage, snapshots] = await Promise.all([can(organizationId, "assessments.read"), can(organizationId, "assessments.manage"), can(organizationId, "snapshots.create")]);
  if (!read) return <div className="grid gap-6"><PageHeader title="Evaluación Inicial SG-SST" description="No tienes permiso para consultar evaluaciones de esta organización."/><StatusBanner status="forbidden"/></div>;
  const supabase = await createClient() as any;
  const { data: openAssessment } = await supabase.from("assessments").select("id,status").eq("organization_id", organizationId).in("status", ["draft", "in_progress"]).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const { data: classification } = await supabase.from("organization_classifications").select("id,employee_count,risk_class,ciiu_code,economic_activity,standard_profile_id,effective_from").eq("organization_id", organizationId).is("effective_to", null).order("effective_from", { ascending: false }).limit(1).maybeSingle();
  let profileVersion = null;
  let scoringRule = null;
  if (classification?.standard_profile_id) {
    const result = await supabase.from("standard_profile_versions").select("id,version_code,status,expert_review_status,standard_profiles(code,name)").eq("standard_profile_id", classification.standard_profile_id).eq("status", "published").eq("expert_review_status", "reviewed").order("created_at", { ascending: false }).limit(1).maybeSingle();
    profileVersion = result.data;
    if (profileVersion) scoringRule = (await supabase.from("assessment_scoring_rules").select("id,code,status,expert_review_status").eq("standard_profile_version_id", profileVersion.id).eq("status", "approved").eq("expert_review_status", "reviewed").limit(1).maybeSingle()).data;
  }
  const missing = !classification ? "La organización necesita una clasificación vigente." : !profileVersion ? "El perfil aplicable todavía no tiene una versión publicada y revisada." : !scoringRule ? "El perfil todavía no tiene una regla de puntuación aprobada y revisada." : !manage || !snapshots ? "Puedes consultar resultados, pero no tienes permisos para iniciar una evaluación." : null;

  return <div className="grid gap-6"><PageHeader eyebrow="Cumplimiento" title="Evaluación Inicial SG-SST" description="Evalúa los estándares aplicables con la clasificación vigente de la organización."/><StatusBanner status={query.status}/>
    {openAssessment ? <Card><CardHeader><CardTitle>Hay una evaluación en curso</CardTitle></CardHeader><CardContent><p className="text-sm text-[var(--muted)]">Continúa donde quedaste. Las respuestas ya guardadas se conservan.</p><Button className="mt-5" asChild><Link href={`/org/${organizationId}/compliance/initial-assessment/${openAssessment.id}`}>Continuar evaluación</Link></Button></CardContent></Card> : null}
    <Card><CardHeader><CardTitle>Datos utilizados</CardTitle></CardHeader><CardContent className="grid gap-5">
      {classification ? <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-xs text-[var(--muted)]">Trabajadores</dt><dd className="mt-1 font-semibold">{classification.employee_count}</dd></div><div><dt className="text-xs text-[var(--muted)]">Clase de riesgo</dt><dd className="mt-1 font-semibold">{classification.risk_class}</dd></div><div><dt className="text-xs text-[var(--muted)]">CIIU</dt><dd className="mt-1 font-semibold">{classification.ciiu_code ?? "Sin dato"}</dd></div><div><dt className="text-xs text-[var(--muted)]">Perfil aplicable</dt><dd className="mt-1 font-semibold">{profileVersion?.standard_profiles?.name ?? "Pendiente"}</dd></div></dl> : null}
      {missing ? <div className="flex items-start gap-3 rounded-[10px] border border-[var(--warning-border)] bg-[var(--warning-soft)] p-4 text-sm text-[var(--warning)]"><WarningCircle className="mt-0.5 shrink-0" size={19}/><div><p className="font-semibold">Aún no es posible iniciar</p><p className="mt-1">{missing}</p>{!classification ? <Link className="mt-2 inline-block font-semibold underline" href={`/org/${organizationId}/compliance?section=classification`}>Revisar clasificación</Link> : <Link className="mt-2 inline-block font-semibold underline" href={`/org/${organizationId}/compliance?section=standards`}>Revisar contenido normativo</Link>}</div></div> : <div className="flex items-start gap-3 rounded-[10px] border border-[var(--success-border)] bg-[var(--success-soft)] p-4 text-sm text-[var(--success)]"><CheckCircle className="mt-0.5 shrink-0" size={19}/><div><p className="font-semibold">Contenido listo para evaluar</p><p className="mt-1">La evaluación usará el perfil y la regla aprobados, y conservará un corte histórico.</p></div></div>}
      {!openAssessment && !missing ? <form action={startInitialAssessment}><input type="hidden" name="organizationId" value={organizationId}/><Button type="submit">Iniciar evaluación</Button></form> : null}
    </CardContent></Card>
  </div>;
}
