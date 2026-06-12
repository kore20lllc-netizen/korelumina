import type { AuditFinding, AuditReport } from "../audit/auditTypes.js";
import type { FixAction } from "./types.js";

function safeFile(file?: string): string[] {
  return file ? [file] : [];
}

export function generate100vwFix(
  finding: AuditFinding,
  _report: AuditReport,
): FixAction {
  const file = finding.file ?? "unknown";

  return {
    id: `fix:${finding.id}`,
    findingId: finding.id,
    title: "Replace unsafe 100vw usage",
    reason:
      "100vw can exceed nested preview containers and create horizontal overflow or a white strip on the right side.",
    autoFixable: Boolean(finding.file),
    risk: "low",
    files: safeFile(finding.file),
    diffPreview: [
      `--- ${file}`,
      `+++ ${file}`,
      "@@",
      `- width: 100vw`,
      `+ width: 100%`,
      "",
      `- w-screen`,
      `+ w-full max-w-full`,
      "",
      "Note: generated preview only. User approval is required before applying.",
    ].join("\n"),
    projectedImpact: 5,
  };
}

export function generateLockfileFix(
  finding: AuditFinding,
  report: AuditReport,
): FixAction {
  const packageManager = report.fingerprint.packageManager;

  return {
    id: `fix:${finding.id}`,
    findingId: finding.id,
    title: "Standardize package manager lockfiles",
    reason:
      "Multiple lockfiles can produce inconsistent dependency trees between local preview, CI, and deployment.",
    autoFixable: packageManager !== "unknown",
    risk: "medium",
    files: [
      "package-lock.json",
      "pnpm-lock.yaml",
      "yarn.lock",
      "bun.lock",
      "bun.lockb",
    ],
    diffPreview: [
      `# Keep ${packageManager} lockfile as canonical.`,
      "# Remove non-canonical lockfiles after user approval.",
      "",
      packageManager === "bun"
        ? "- package-lock.json"
        : packageManager === "npm"
          ? "- bun.lock\n- bun.lockb\n- pnpm-lock.yaml\n- yarn.lock"
          : packageManager === "pnpm"
            ? "- package-lock.json\n- bun.lock\n- bun.lockb\n- yarn.lock"
            : packageManager === "yarn"
              ? "- package-lock.json\n- bun.lock\n- bun.lockb\n- pnpm-lock.yaml"
              : "# manual review required",
      "",
      "Note: generated preview only. User approval is required before applying.",
    ].join("\n"),
    projectedImpact: 5,
  };
}

export function generateFaviconFix(
  finding: AuditFinding,
  _report: AuditReport,
): FixAction {
  return {
    id: `fix:${finding.id}`,
    findingId: finding.id,
    title: "Add favicon placeholder",
    reason:
      "A missing favicon is not runtime-breaking, but it blocks first-class production certification.",
    autoFixable: true,
    risk: "low",
    files: ["public/favicon.ico"],
    diffPreview: [
      "+++ public/favicon.ico",
      "@@",
      "+ Add generated KoreLumina-safe favicon placeholder or copy project brand mark.",
      "",
      "Note: generated preview only. User approval is required before applying.",
    ].join("\n"),
    projectedImpact: 1,
  };
}

export function generateFixedPositionReview(
  finding: AuditFinding,
  _report: AuditReport,
): FixAction {
  return {
    id: `review:${finding.id}`,
    findingId: finding.id,
    title: "Review fixed-position element",
    reason:
      "Fixed-position UI can escape preview containers. This needs visual validation before a safe patch can be generated.",
    autoFixable: false,
    risk: "medium",
    files: safeFile(finding.file),
    diffPreview: [
      "# Manual review required.",
      `# File: ${finding.file ?? "unknown"}`,
      "# Recommended check:",
      "# - desktop preview",
      "# - tablet preview",
      "# - mobile preview",
      "# - no horizontal overflow",
      "# - no clipped overlay",
    ].join("\n"),
    projectedImpact: 0,
  };
}
