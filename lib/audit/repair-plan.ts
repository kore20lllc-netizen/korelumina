import type {
  AuditReport,
  RepairStep,
} from "@/lib/audit/engine";

export function buildRepairPlan(
  report: AuditReport
): RepairStep[] {
  const steps: RepairStep[] = [];

  if (report.missingDependencies.length > 0) {
    steps.push({
      id: "deps",
      title: "Install missing dependencies",
      detail:
        "Install or upgrade: " +
        report.missingDependencies
          .map((d) => d.name)
          .join(", "),
      estMinutes: 10,
      automated: true,
    });
  }

  if (report.securityFindings.length > 0) {
    steps.push({
      id: "security",
      title: "Patch security findings",
      detail: `Resolve ${report.securityFindings.length} security issue(s).`,
      estMinutes: 15,
      automated: true,
    });
  }

  if (
    report.envVars.some(
      (v) => v.required && !v.present
    )
  ) {
    steps.push({
      id: "env",
      title: "Configure environment variables",
      detail:
        "Populate missing required environment variables.",
      estMinutes: 15,
      automated: false,
    });
  }

  if (report.buildErrors.length > 0) {
    steps.push({
      id: "build",
      title: "Resolve build errors",
      detail:
        `Fix ${report.buildErrors.length} build error(s).`,
      estMinutes: 30,
      automated: false,
    });
  }

  return steps;
}
