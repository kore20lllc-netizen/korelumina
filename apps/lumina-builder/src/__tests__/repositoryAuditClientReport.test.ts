import { describe, expect, it } from "vitest";

import { draftExecutiveSummary, isArchivedFinding, selectClientFindings } from "@/services/repositoryAuditClientReport";
import type { RepositoryAuditReport, RepositoryFinding } from "@/services/repositoryAuditService";

/* MS-2026-0012: a client report is chosen from the real findings, never invented. */

function finding(id: string, severity: RepositoryFinding["severity"], file: string, title = `Finding ${id}`): RepositoryFinding {
  return { id, rule: "dependency.undeclared", category: "dependency", severity, title, detail: "", packageDirectory: ".", evidence: [{ file, line: 1 }], remedy: "Declare it." };
}

const findings = [
  finding("a", "high", "src/main.ts", "zod is imported but not declared"),
  finding("b", "medium", "src/api.ts"),
  finding("c", "low", "src/util.ts"),
  finding("d", "low", "archive/old/page.tsx", "next is imported but not declared (archived code)"),
  finding("e", "info", "README.md"),
];

const report = {
  reportId: "repository-audit:1",
  projectId: "shop",
  mode: "scan",
  startedAt: 0,
  completedAt: Date.UTC(2026, 9, 21, 12),
  manifest: { manifestId: "m", commit: "0123456789abcdef", inventory: { totalFiles: 42, totalBytes: 1, languages: [], packageManager: { manager: "npm", lockfiles: [], conflicting: false }, packages: [] } },
  summary: {
    score: 81,
    grade: "B",
    counts: { critical: 0, high: 1, medium: 1, low: 2, info: 1 },
    categories: [
      { category: "security", status: "partial", score: 100, findings: 0, notes: [] },
      { category: "build", status: "not-checked", score: null, findings: 0, notes: [] },
      { category: "dependency", status: "checked", score: 72, findings: 4, notes: [] },
    ],
  },
  coverage: { filesScannedForSecrets: 40, filesScannedForCode: 30, lockfilesChecked: [], advisories: { status: "unavailable", source: null, reason: "the npm registry could not be reached", checkedAt: 0, counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 } }, build: [] },
  architecture: { modules: 0, imports: 0, entryPoints: 0, cycles: 0, unreachableFiles: 0, packageGraph: {} },
  environmentVariables: [],
  findings,
  comparison: null,
} as RepositoryAuditReport;

describe("client report", () => {
  it("includes the chosen severities and leaves archived code out by default", () => {
    expect(selectClientFindings(report, { severities: ["high", "medium", "low"], includeArchived: false }).map((item) => item.id)).toEqual(["a", "b", "c"]);
    expect(selectClientFindings(report, { severities: ["low"], includeArchived: true }).map((item) => item.id)).toEqual(["c", "d"]);
    expect(isArchivedFinding(findings[3]!)).toBe(true);
    expect(isArchivedFinding(findings[0]!)).toBe(false);
  });

  it("drafts a plain summary from the findings, saying what was not checked", () => {
    const summary = draftExecutiveSummary(report, selectClientFindings(report, { severities: ["high", "medium"], includeArchived: false }));
    expect(summary).toContain("We reviewed the shop repository");
    expect(summary).toContain("(commit 01234567), covering 42 files");
    expect(summary).toContain("It scores 81 out of 100 (grade B).");
    expect(summary).toContain("This report covers 1 high-priority and 1 medium findings.");
    expect(summary).toContain("The most important to address first: zod is imported but not declared.");
    expect(summary).toContain("The area needing the most attention is dependencies.");
    expect(summary).toContain("Known vulnerabilities in third-party packages were not checked, because the npm registry could not be reached.");
    expect(summary).toContain("The project was not built for this review");
  });

  it("says so when nothing at the chosen levels was found", () => {
    expect(draftExecutiveSummary(report, [])).toContain("No issues at the levels included in this report were found.");
  });
});
