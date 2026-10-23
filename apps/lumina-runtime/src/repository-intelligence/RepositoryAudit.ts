import { createHash } from "node:crypto";

import { auditAdvisories, type AdvisoryAudit, type AuditCommandRunner } from "./AdvisoryAudit.js";
import { mapArchitecture } from "./ArchitectureMap.js";
import { checkBuildHealth, type BuildCheck, type ProcessRunner } from "./BuildHealth.js";
import { scanLanguageRisks, unscannedLanguages } from "./CodeRiskLanguages.js";
import { scanCodeRisks } from "./CodeRiskScan.js";
import { checkEcosystemDependencies } from "./EcosystemDependencyChecks.js";
import { ECOSYSTEM_LABEL } from "./Ecosystems.js";
import { analyzeDependencies } from "./DependencyAnalysis.js";
import { analyzeEnvironment } from "./EnvironmentAnalysis.js";
import { createRepositoryIntelligenceManifest, type RepositoryIntelligenceManifest } from "./RepositoryIntelligenceManifest.js";
import { sortFindings, type FindingCategory, type FindingSeverity, type RepositoryFinding } from "./RepositoryFinding.js";
import { takeRepositoryInventory } from "./RepositoryInventory.js";
import { takeRepositorySnapshotAsync } from "./RepositorySnapshot.js";
import { scanSecretsAsync } from "./SecretScan.js";

/*
 * MS-2026-0012: one audit run. Every analysis contributes findings; the
 * scores are computed from those findings alone, by the published rule
 * below, and a category that could not be checked is reported as not
 * checked rather than as passing.
 */

export const REPOSITORY_AUDIT_REPORT_VERSION = "repository-audit-report:v1";

export type AuditMode = "scan" | "deep";

export type AuditStage =
  | "snapshot"
  | "inventory"
  | "dependencies"
  | "secrets"
  | "code"
  | "environment"
  | "architecture"
  | "advisories"
  | "build"
  | "report";

export interface AuditProgress {
  stage: AuditStage;
  state: "started" | "completed" | "skipped";
  /* What was found or why it was skipped, in a short sentence. */
  message: string;
  at: number;
}

export type CategoryStatus = "checked" | "partial" | "not-checked";

export interface CategoryScore {
  category: FindingCategory;
  status: CategoryStatus;
  /* null when not checked. */
  score: number | null;
  findings: number;
  /* Why the category is partial or not checked. */
  notes: string[];
}

export interface RepositoryAuditReport {
  version: typeof REPOSITORY_AUDIT_REPORT_VERSION;
  reportId: string;
  projectId: string;
  mode: AuditMode;
  manifest: RepositoryIntelligenceManifest;
  startedAt: number;
  completedAt: number;
  summary: {
    score: number | null;
    grade: "A" | "B" | "C" | "D" | "F" | null;
    counts: Record<FindingSeverity, number>;
    categories: CategoryScore[];
  };
  coverage: {
    filesScannedForSecrets: number;
    filesScannedForCode: number;
    lockfilesChecked: string[];
    advisories: Omit<AdvisoryAudit, "findings">;
    build: BuildCheck[];
  };
  architecture: {
    modules: number;
    imports: number;
    entryPoints: number;
    cycles: number;
    unreachableFiles: number;
    packageGraph: Record<string, string[]>;
  };
  environmentVariables: { name: string; packageDirectory: string; public: boolean; documented: boolean }[];
  findings: RepositoryFinding[];
  /* Against the previous report of the same project, by finding ID. */
  comparison: { previousReportId: string; newFindings: string[]; resolvedFindings: string[] } | null;
}

export const SEVERITY_WEIGHT: Readonly<Record<FindingSeverity, number>> = { critical: 30, high: 12, medium: 4, low: 1, info: 0 };
/* Many findings of one rule lower a category by at most this much (see scoreCategory). */
export const RULE_DEDUCTION_CAP = 25;
/* Overall weights of the categories that were checked. */
export const CATEGORY_WEIGHT: Readonly<Record<FindingCategory, number>> = {
  security: 30,
  build: 25,
  dependency: 20,
  architecture: 15,
  environment: 10,
  quality: 0,
};
/* Any critical finding caps the overall score here. */
export const CRITICAL_CAP = 49;

const CATEGORIES: readonly FindingCategory[] = ["security", "build", "dependency", "architecture", "environment"];

/*
 * Each rule costs the sum of its findings' weights, at most RULE_DEDUCTION_CAP,
 * but never less than its single worst finding: the cap stops many small
 * findings from piling up; it never shrinks one serious finding.
 */
export function scoreCategory(findings: readonly RepositoryFinding[]): number {
  const byRule = new Map<string, { sum: number; worst: number }>();
  for (const finding of findings) {
    const weight = SEVERITY_WEIGHT[finding.severity];
    const rule = byRule.get(finding.rule) ?? { sum: 0, worst: 0 };
    rule.sum += weight;
    rule.worst = Math.max(rule.worst, weight);
    byRule.set(finding.rule, rule);
  }
  const deduction = [...byRule.values()].reduce((total, rule) => total + Math.min(rule.sum, Math.max(RULE_DEDUCTION_CAP, rule.worst)), 0);
  return Math.max(0, 100 - deduction);
}

export function gradeOf(score: number): "A" | "B" | "C" | "D" | "F" {
  return score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";
}

export function summarize(
  findings: readonly RepositoryFinding[],
  statuses: Readonly<Partial<Record<FindingCategory, { status: CategoryStatus; notes: string[] }>>>,
): RepositoryAuditReport["summary"] {
  const counts: Record<FindingSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const finding of findings) counts[finding.severity] += 1;
  const categories: CategoryScore[] = CATEGORIES.map((category) => {
    const own = findings.filter((finding) => finding.category === category);
    const status = statuses[category]?.status ?? "checked";
    return {
      category,
      status,
      score: status === "not-checked" ? null : scoreCategory(own),
      findings: own.length,
      notes: statuses[category]?.notes ?? [],
    };
  });
  const scored = categories.filter((category) => category.score !== null && CATEGORY_WEIGHT[category.category] > 0);
  if (scored.length === 0) return { score: null, grade: null, counts, categories };
  const weight = scored.reduce((sum, category) => sum + CATEGORY_WEIGHT[category.category], 0);
  let score = Math.round(scored.reduce((sum, category) => sum + category.score! * CATEGORY_WEIGHT[category.category], 0) / weight);
  if (counts.critical > 0) score = Math.min(score, CRITICAL_CAP);
  return { score, grade: gradeOf(score), counts, categories };
}

type Coverage = { status: CategoryStatus; notes: string[] };
const STATUS_RANK: Record<CategoryStatus, number> = { checked: 0, partial: 1, "not-checked": 2 };

/* The weaker of two coverages, with both sets of notes. */
export function combineStatus(left: Coverage | undefined, right: Coverage | undefined): Coverage | undefined {
  if (!left) return right;
  if (!right) return left;
  return { status: STATUS_RANK[left.status] >= STATUS_RANK[right.status] ? left.status : right.status, notes: [...left.notes, ...right.notes] };
}

const SCRIPT_LANGUAGES = new Set(["TypeScript", "JavaScript", "Vue", "Svelte", "Astro"]);
const NOT_CODE = new Set(["JSON", "Markdown", "MDX", "YAML", "TOML", "CSS", "SCSS", "Less", "HTML", "SQL", "Shell"]);

const list = (items: readonly string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

/*
 * MS-2026-0013: what each category could and could not check, given the
 * repository's ecosystems and languages. A category that covered only part
 * of the code is partial, with the reason; one that covered none of it is
 * not checked. Neither is ever counted as passing.
 */
export function ecosystemCoverageNotes(inventory: RepositoryAuditReport["manifest"]["inventory"]): Partial<Record<FindingCategory, Coverage>> {
  const others = inventory.ecosystemCoverage.recognised.filter((ecosystem) => ecosystem !== "node").map((ecosystem) => ECOSYSTEM_LABEL[ecosystem]);
  const hasNode = inventory.ecosystemCoverage.recognised.includes("node");
  const code = inventory.languages.filter((share) => share.files > 0 && !NOT_CODE.has(share.language)).map((share) => share.language);
  const scripts = code.filter((language) => SCRIPT_LANGUAGES.has(language));
  const nonScript = code.filter((language) => !SCRIPT_LANGUAGES.has(language));
  const unscanned = unscannedLanguages(inventory.languages);
  const result: Partial<Record<FindingCategory, Coverage>> = {};

  const dependencyNotes: string[] = [];
  if (others.length > 0) dependencyNotes.push(`For ${list(others)}, manifests and lockfiles were checked; unused and undeclared packages are found for Node.js only.`);
  if (inventory.ecosystemCoverage.languagesWithoutManifest.length > 0) dependencyNotes.push(`${list(inventory.ecosystemCoverage.languagesWithoutManifest)} code has no manifest, so its dependencies are unknown.`);
  if (inventory.ecosystemCoverage.unsupportedLanguages.length > 0) dependencyNotes.push(`${list(inventory.ecosystemCoverage.unsupportedLanguages)} dependencies are not analyzed yet.`);
  if (dependencyNotes.length > 0) result.dependency = { status: "partial", notes: dependencyNotes };

  const securityNotes: string[] = [];
  if (others.length > 0) securityNotes.push(`Dependency advisories cover Node.js only; ${list(others)} dependencies were not checked against an advisory database.`);
  if (unscanned.length > 0) securityNotes.push(`${list(unscanned)} code was not scanned for risky patterns; committed credentials were still searched for in every text file.`);
  if (securityNotes.length > 0) result.security = { status: "partial", notes: securityNotes };

  if (others.length > 0) {
    result.build = {
      status: hasNode ? "partial" : "not-checked",
      notes: [`${list(others)} ${others.length === 1 ? "was" : "were"} not built: building runs the project's own build scripts, which the audit does not run yet.`],
    };
  }

  if (nonScript.length > 0) {
    const note = (what: string) => `${what} JavaScript and TypeScript only; ${list(nonScript)} code is not covered.`;
    result.architecture = scripts.length > 0 ? { status: "partial", notes: [note("The import map covers")] } : { status: "not-checked", notes: [note("The import map covers")] };
    result.environment = scripts.length > 0 ? { status: "partial", notes: [note("Environment variables are read from")] } : { status: "not-checked", notes: [note("Environment variables are read from")] };
  }
  return result;
}

export interface RunRepositoryAuditInput {
  projectId: string;
  root: string;
  mode: AuditMode;
  previous?: RepositoryAuditReport | null;
  onProgress?: (event: AuditProgress) => void;
  now?: () => number;
  /* false skips the network advisory check (it is then reported as not checked). */
  checkAdvisories?: boolean;
  runAudit?: AuditCommandRunner;
  runProcess?: ProcessRunner;
}

export async function runRepositoryAudit(input: RunRepositoryAuditInput): Promise<RepositoryAuditReport> {
  const now = input.now ?? Date.now;
  const startedAt = now();
  const progress = (stage: AuditStage, state: AuditProgress["state"], message: string) =>
    input.onProgress?.({ stage, state, message, at: now() });
  /*
   * Each stage is synchronous work; yielding before it lets the Runtime
   * serve other requests and deliver progress while an audit runs.
   */
  const step = async <T>(stage: AuditStage, started: string, work: () => T | Promise<T>, done: (result: T) => string): Promise<T> => {
    progress(stage, "started", started);
    await new Promise((resolve) => setImmediate(resolve));
    const result = await work();
    progress(stage, "completed", done(result));
    return result;
  };

  const snapshot = await step("snapshot", "Reading the repository", () => takeRepositorySnapshotAsync(input.root), (result) => `${result.files.filter((file) => !file.ignored).length} files`);
  const inventory = await step(
    "inventory",
    "Identifying languages, packages and frameworks",
    () => takeRepositoryInventory(snapshot),
    (result) => `${result.packages.length} package${result.packages.length === 1 ? "" : "s"}, ${result.languages.slice(0, 3).map((share) => share.language).join(", ")}`,
  );
  const manifest = createRepositoryIntelligenceManifest({ projectId: input.projectId, snapshot, inventory, analyzedAt: startedAt });
  const dependencies = await step("dependencies", "Checking declared and imported packages", () => analyzeDependencies(snapshot, inventory), (result) => `${result.findings.length} findings`);
  const secrets = await step("secrets", "Looking for committed credentials", () => scanSecretsAsync(snapshot), (result) => `${result.filesScanned} files, ${result.findings.length} findings`);
  const ecosystemFindings = checkEcosystemDependencies(inventory.ecosystems);
  const code = await step(
    "code",
    "Looking for risky code patterns",
    () => {
      const script = scanCodeRisks(snapshot);
      const other = scanLanguageRisks(snapshot);
      return { findings: [...script.findings, ...other.findings], filesScanned: script.filesScanned + other.filesScanned };
    },
    (result) => `${result.filesScanned} files, ${result.findings.length} findings`,
  );
  const environment = await step("environment", "Comparing environment variables with their documentation", () => analyzeEnvironment(snapshot, inventory), (result) => `${result.variables.length} variables`);
  const architecture = await step(
    "architecture",
    "Mapping imports",
    () => mapArchitecture(snapshot, inventory),
    (result) => `${result.modules} modules, ${result.cycles.length} cycles, ${result.unreachable.length} unreachable`,
  );

  let advisories: AdvisoryAudit;
  if (input.checkAdvisories === false) {
    progress("advisories", "skipped", "Advisory check turned off for this run");
    advisories = { status: "unavailable", source: null, reason: "the advisory check was turned off for this run", checkedAt: now(), findings: [], counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 } };
  } else {
    progress("advisories", "started", "Checking dependencies against the advisory database");
    advisories = await auditAdvisories(snapshot.root, inventory, { run: input.runAudit, now });
    progress("advisories", "completed", advisories.status === "checked" ? `${advisories.findings.length} vulnerable packages` : `Not checked: ${advisories.reason}`);
  }

  let build: BuildCheck[] = [];
  let buildFindings: RepositoryFinding[] = [];
  if (input.mode === "deep") {
    progress("build", "started", "Running the project's typecheck and build");
    const health = await checkBuildHealth(snapshot.root, inventory, { run: input.runProcess });
    build = health.checks;
    buildFindings = health.findings;
    progress("build", "completed", build.map((check) => `${check.packageDirectory === "." ? "" : `${check.packageDirectory} `}${check.check} ${check.status}`).join(", ") || "Nothing to build");
  } else {
    progress("build", "skipped", "Build health runs in the deep audit");
  }

  progress("report", "started", "Scoring");
  const findings = sortFindings([
    ...dependencies.findings,
    ...ecosystemFindings,
    ...secrets.findings,
    ...code.findings,
    ...advisories.findings,
    ...environment.findings,
    ...architecture.findings,
    ...buildFindings,
  ]);

  const buildRan = build.filter((check) => check.status === "passed" || check.status === "failed");
  const buildNotes = build.filter((check) => check.status === "unavailable").map((check) => `${check.packageDirectory} ${check.check}: ${check.reason}`);
  const coverage = ecosystemCoverageNotes(inventory);
  const summary = summarize(findings, {
    dependency: coverage.dependency,
    architecture: coverage.architecture,
    environment: coverage.environment,
    security: combineStatus(
      advisories.status === "checked"
        ? { status: "checked", notes: [] }
        : { status: "partial", notes: [`Dependency advisories were not checked: ${advisories.reason}`] },
      coverage.security,
    ),
    build: combineStatus(
      input.mode !== "deep"
        ? { status: "not-checked", notes: ["Build health runs in the deep audit."] }
        : buildRan.length === 0
          ? { status: "not-checked", notes: buildNotes.length > 0 ? buildNotes : ["Nothing to typecheck or build."] }
          : { status: buildNotes.length > 0 ? "partial" : "checked", notes: buildNotes },
      input.mode === "deep" ? coverage.build : undefined,
    ),
  });

  const ids = new Set(findings.map((finding) => finding.id));
  const previousIds = new Set(input.previous?.findings.map((finding) => finding.id) ?? []);
  const completedAt = now();
  const report: RepositoryAuditReport = {
    version: REPOSITORY_AUDIT_REPORT_VERSION,
    reportId: `repository-audit:${createHash("sha256")
      .update(`${manifest.manifestId}\0${input.mode}\0${startedAt}\0${[...ids].sort().join(",")}`)
      .digest("hex")
      .slice(0, 32)}`,
    projectId: input.projectId,
    mode: input.mode,
    manifest,
    startedAt,
    completedAt,
    summary,
    coverage: {
      filesScannedForSecrets: secrets.filesScanned,
      filesScannedForCode: code.filesScanned,
      lockfilesChecked: dependencies.lockfilesChecked,
      advisories: { status: advisories.status, source: advisories.source, reason: advisories.reason, checkedAt: advisories.checkedAt, counts: advisories.counts },
      build,
    },
    architecture: {
      modules: architecture.modules,
      imports: architecture.edges.length,
      entryPoints: architecture.entryPoints.length,
      cycles: architecture.cycles.length,
      unreachableFiles: architecture.unreachable.length,
      packageGraph: architecture.packageGraph,
    },
    environmentVariables: environment.variables.map(({ name, packageDirectory, public: exposed, documented }) => ({ name, packageDirectory, public: exposed, documented })),
    findings,
    comparison: input.previous
      ? {
          previousReportId: input.previous.reportId,
          newFindings: [...ids].filter((id) => !previousIds.has(id)).sort(),
          resolvedFindings: [...previousIds].filter((id) => !ids.has(id)).sort(),
        }
      : null,
  };
  progress("report", "completed", summary.score === null ? "No category could be scored" : `Score ${summary.score} (${summary.grade})`);
  return report;
}
