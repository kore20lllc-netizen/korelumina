import type { AuditReport } from "@/lib/audit/engine";

export interface AutoFixDraft {
  file: string;
  code: string;
}

export async function generateAutoFixDrafts(
  projectId: string,
  report: AuditReport
): Promise<AutoFixDraft[]> {
  const summary = {
    buildStatus: report.buildStatus,
    typeErrors: report.typeErrors,
    missingDependencies: report.missingDependencies,
    buildErrors: report.buildErrors,
    envVars: report.envVars,
    securityFindings: report.securityFindings,
    repairPlan: report.repairPlan,
  };

  const response = await fetch(
    "http://localhost:3000/api/ai/orchestrate",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        task:
          "Fix all issues identified in this audit report and return production-ready file drafts.",
        context: summary,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("AI orchestration failed");
  }

  const data = await response.json();

  return Array.isArray(data?.drafts)
    ? data.drafts
    : [];
}
