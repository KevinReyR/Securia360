import { redirect } from "next/navigation";

export default function MethodologiesPage() {
  redirect("/internal/normative-review?type=RISK_METHODOLOGY_VERSION");
}
