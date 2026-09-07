import type { Metadata } from "next";
import { AssessmentWizard } from "@/modules/public-assessment/assessment-wizard";
import { PublicAssessmentShell } from "@/modules/public-assessment/public-assessment-shell";

export const metadata: Metadata = { title: "Nueva evaluación inicial SG-SST | Securia360" };

export default async function NewInitialAssessmentPage({ searchParams }: { searchParams: Promise<{ assessment?: string }> }) {
  const params = await searchParams;
  return <PublicAssessmentShell compact><AssessmentWizard resumeId={params.assessment} /></PublicAssessmentShell>;
}
