import type { Metadata } from "next";
import { AssessmentResultView } from "@/modules/public-assessment/result-view";
import { PublicAssessmentShell } from "@/modules/public-assessment/public-assessment-shell";

export const metadata: Metadata = { title: "Resultado de evaluación inicial SG-SST | Securia360" };

export default async function InitialAssessmentResultPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  return <PublicAssessmentShell compact><AssessmentResultView assessmentId={assessmentId} /></PublicAssessmentShell>;
}
