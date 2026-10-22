import { execFile } from "node:child_process";

import { projectProcessEnvironment } from "../runtime/projectProcessEnvironment.js";

import { createFinding, type FindingSeverity, type RepositoryFinding } from "./RepositoryFinding.js";
import type { RepositoryInventory } from "./RepositoryInventory.js";

/*
 * MS-2026-0012: known vulnerabilities in installed dependencies, from the
 * package manager's own audit against its registry's advisory database.
 * It needs the network and a lockfile. When it cannot run, the result says
 * advisories were not checked and why; it never reports "no
 * vulnerabilities" it did not check. Advisories change over time, so the
 * result records when it was checked.
 */

export interface AdvisoryAudit {
  status: "checked" | "unavailable";
  source: string | null;
  /* Why advisories could not be checked. */
  reason: string | null;
  checkedAt: number;
  findings: RepositoryFinding[];
  counts: Record<FindingSeverity, number>;
}

export type AuditCommandRunner = (
  command: string,
  args: readonly string[],
  cwd: string,
) => Promise<{ stdout: string; stderr: string; exitCode: number | null; timedOut: boolean }>;

export const runAuditCommand: AuditCommandRunner = (command, args, cwd) =>
  new Promise((resolve) => {
    execFile(
      command,
      [...args],
      {
        cwd,
        timeout: 120_000,
        maxBuffer: 64 * 1024 * 1024,
        /*
         * SEC-1 allowlist: a project's .npmrc can point npm at any registry,
         * so Runtime's secrets (registry tokens included) are never passed.
         */
        env: projectProcessEnvironment({ npm_config_fund: "false", npm_config_update_notifier: "false" }),
      },
      (error, stdout, stderr) => {
        const failure = error as (NodeJS.ErrnoException & { killed?: boolean; code?: number | string }) | null;
        resolve({
          stdout: String(stdout ?? ""),
          stderr: String(stderr ?? ""),
          exitCode: failure ? (typeof failure.code === "number" ? failure.code : null) : 0,
          timedOut: Boolean(failure?.killed),
        });
      },
    );
  });

const SEVERITY: Record<string, FindingSeverity> = {
  critical: "critical",
  high: "high",
  moderate: "medium",
  medium: "medium",
  low: "low",
  info: "info",
};

interface NpmVulnerability {
  name?: string;
  severity?: string;
  isDirect?: boolean;
  range?: string;
  via?: (string | { title?: string; url?: string; source?: number; range?: string; cwe?: string[] })[];
  fixAvailable?: boolean | { name?: string; version?: string; isSemVerMajor?: boolean };
}

function emptyCounts(): Record<FindingSeverity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

/* npm 7+ (`npm audit --json`): { vulnerabilities: { name: {...} } }. */
export function parseNpmAudit(stdout: string, lockfile: string): { findings: RepositoryFinding[]; error: string | null } {
  let report: {
    vulnerabilities?: Record<string, NpmVulnerability>;
    error?: { code?: string; summary?: string; detail?: string };
    message?: string;
    statusCode?: number;
  };
  try {
    report = JSON.parse(stdout);
  } catch {
    return { findings: [], error: "the package manager did not return an audit report" };
  }
  if (report.error || report.statusCode) {
    /* npm puts the registry's answer in message (e.g. "403 Forbidden - POST ..."). */
    const reason = [report.error?.code, report.error?.summary, report.message].filter((part) => typeof part === "string" && part.trim()).join(": ");
    return { findings: [], error: reason || "the audit failed without a reason" };
  }
  if (!report.vulnerabilities || typeof report.vulnerabilities !== "object") {
    return { findings: [], error: report.message ?? "the audit report has no vulnerability section" };
  }

  const findings: RepositoryFinding[] = [];
  for (const [name, vulnerability] of Object.entries(report.vulnerabilities).sort(([left], [right]) => (left < right ? -1 : 1))) {
    const advisories = (vulnerability.via ?? []).filter((via): via is Exclude<typeof via, string> => typeof via === "object" && via !== null);
    const through = (vulnerability.via ?? []).filter((via): via is string => typeof via === "string");
    const severity = SEVERITY[vulnerability.severity ?? ""] ?? "medium";
    const fix = vulnerability.fixAvailable;
    const remedy =
      fix === true
        ? "npm audit fix resolves it without breaking changes."
        : fix && typeof fix === "object"
          ? `Upgrade ${fix.name ?? name} to ${fix.version ?? "a fixed version"}${fix.isSemVerMajor ? " (a major version: check its breaking changes)" : ""}.`
          : "No fixed version is published yet; consider replacing the package or limiting its exposure.";
    const titles = advisories.map((advisory) => advisory.title).filter((title): title is string => Boolean(title));
    findings.push(
      createFinding({
        identity: `${name}\0${advisories.map((advisory) => advisory.source ?? advisory.url).join(",")}\0${through.join(",")}`,
        rule: "security.advisory",
        category: "security",
        severity,
        title: titles.length > 0 ? `${name}: ${titles[0]}${titles.length > 1 ? ` and ${titles.length - 1} more` : ""}` : `${name} is vulnerable through ${through.join(", ")}`,
        detail: `${vulnerability.isDirect ? "A direct" : "An indirect"} dependency, affected versions ${vulnerability.range ?? "unknown"}.${
          advisories.length > 0
            ? ` Advisories: ${advisories.map((advisory) => [advisory.title, advisory.url].filter(Boolean).join(" ")).join("; ")}.`
            : ""
        }${through.length > 0 ? ` Vulnerable through ${through.join(", ")}.` : ""}`,
        packageDirectory: null,
        evidence: [{ file: lockfile }],
        remedy,
      }),
    );
  }
  return { findings, error: null };
}

export async function auditAdvisories(
  root: string,
  inventory: RepositoryInventory,
  options: { run?: AuditCommandRunner; now?: () => number } = {},
): Promise<AdvisoryAudit> {
  const run = options.run ?? runAuditCommand;
  const checkedAt = (options.now ?? Date.now)();
  const unavailable = (reason: string, source: string | null = null): AdvisoryAudit => ({
    status: "unavailable",
    source,
    reason,
    checkedAt,
    findings: [],
    counts: emptyCounts(),
  });

  const npmLock = inventory.packageManager.lockfiles.find((file) => file === "package-lock.json" || file === "npm-shrinkwrap.json");
  if (!npmLock) {
    const manager = inventory.packageManager.manager;
    return unavailable(
      manager && manager !== "npm"
        ? `advisories are checked through npm's audit, which needs a package-lock.json; this project uses ${manager}`
        : "there is no lockfile, so installed versions are unknown",
    );
  }

  const result = await run("npm", ["audit", "--json", "--package-lock-only", "--audit-level=info"], root);
  if (result.timedOut) return unavailable("npm audit did not finish within two minutes", "npm audit");
  const parsed = parseNpmAudit(result.stdout, npmLock);
  if (parsed.error) {
    const offline = /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|network|403|401/i.test(`${parsed.error} ${result.stderr}`);
    return unavailable(offline ? `the npm registry could not be reached (${parsed.error})` : parsed.error, "npm audit");
  }
  const counts = emptyCounts();
  for (const finding of parsed.findings) counts[finding.severity] += 1;
  return { status: "checked", source: "npm audit", reason: null, checkedAt, findings: parsed.findings, counts };
}
