import type { AuditFinding, AuditReport } from "../audit/auditTypes.js";
import { fixRegistry } from "./fixRegistry.js";
import type { FixAction, FixPlan } from "./types.js";

function uniqueFixes(fixes: FixAction[]): FixAction[] {
  const seen = new Set<string>();
  const out: FixAction[] = [];

  for (const fix of fixes) {
    if (seen.has(fix.id)) continue;
    seen.add(fix.id);
    out.push(fix);
  }

  return out;
}

function buildFixForFinding(
  finding: AuditFinding,
  report: AuditReport,
): FixAction | null {
  const generator = fixRegistry.find((entry) => entry.match(finding));

  if (!generator) {
    return null;
  }

  return generator.generate(finding, report);
}

export function generateFixPlan(report: AuditReport): FixPlan {
  const fixes = uniqueFixes(
    report.findings
      .map((finding) => buildFixForFinding(finding, report))
      .filter((fix): fix is FixAction => Boolean(fix)),
  );

  const autoFixes = fixes.filter((fix) => fix.autoFixable);
  const manualReviewFindings = report.findings.filter((finding) => {
    const fix = fixes.find((item) => item.findingId === finding.id);
    return !fix || !fix.autoFixable;
  });

  const projectedScore = Math.min(
    100,
    report.complianceScore +
      autoFixes.reduce((sum, fix) => sum + fix.projectedImpact, 0),
  );

  return {
    projectId: report.projectId,
    currentScore: report.complianceScore,
    projectedScore,
    autoFixableCount: autoFixes.length,
    manualReviewCount: manualReviewFindings.length,
    fixes,
    manualReviewFindings,
    generatedAt: Date.now(),
  };
}
