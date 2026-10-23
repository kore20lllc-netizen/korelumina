import type { ResolvedVersion } from "./LockfileVersions.js";
import { createFinding, type FindingSeverity, type RepositoryFinding } from "./RepositoryFinding.js";

/*
 * MS-2026-0013 (owner decision 2026-10-22): known vulnerabilities for the
 * ecosystems npm audit does not cover, from OSV (https://osv.dev), the
 * open vulnerability database that aggregates the GitHub, PyPI, Go,
 * RustSec, RubyGems and other advisory sources.
 *
 * Only package names and versions are sent; never code, paths or project
 * names. It is on by default and turned off with
 * KORELUMINA_OSV_ADVISORIES=off. When OSV cannot be reached the result says
 * advisories were not checked; it never reports "no vulnerabilities" it did
 * not check.
 */

export const OSV_API = "https://api.osv.dev/v1";
const BATCH_SIZE = 500;
const MAX_DETAILS = 300;
const DETAIL_CONCURRENCY = 10;
const TIMEOUT_MS = 30_000;

export type OsvFetch = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface OsvAdvisoryResult {
  status: "checked" | "unavailable" | "off";
  reason: string | null;
  checkedAt: number;
  ecosystems: string[];
  packagesChecked: number;
  findings: RepositoryFinding[];
}

export function osvEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return !/^(off|false|0|no)$/i.test(env.KORELUMINA_OSV_ADVISORIES?.trim() ?? "");
}

/* ---------- CVSS v3.x base score ---------- */

const CVSS3 = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  UI: { N: 0.85, R: 0.62 },
  C: { H: 0.56, L: 0.22, N: 0 },
} as const;

function roundUp(value: number): number {
  const integer = Math.round(value * 100000);
  return integer % 10000 === 0 ? integer / 100000 : (Math.floor(integer / 10000) + 1) / 10;
}

export function cvss3BaseScore(vector: string): number | null {
  if (!/^CVSS:3\.[01]\//.test(vector)) return null;
  const metrics = Object.fromEntries(vector.split("/").slice(1).map((part) => part.split(":") as [string, string]));
  const av = CVSS3.AV[metrics.AV as keyof typeof CVSS3.AV];
  const ac = CVSS3.AC[metrics.AC as keyof typeof CVSS3.AC];
  const ui = CVSS3.UI[metrics.UI as keyof typeof CVSS3.UI];
  const changed = metrics.S === "C";
  const pr = metrics.PR === "N" ? 0.85 : metrics.PR === "L" ? (changed ? 0.68 : 0.62) : metrics.PR === "H" ? (changed ? 0.5 : 0.27) : undefined;
  const c = CVSS3.C[metrics.C as keyof typeof CVSS3.C];
  const i = CVSS3.C[metrics.I as keyof typeof CVSS3.C];
  const a = CVSS3.C[metrics.A as keyof typeof CVSS3.C];
  if ([av, ac, ui, pr, c, i, a].some((value) => value === undefined) || (metrics.S !== "U" && metrics.S !== "C")) return null;
  const iss = 1 - (1 - c) * (1 - i) * (1 - a);
  const impact = changed ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15) : 6.42 * iss;
  if (impact <= 0) return 0;
  const exploitability = 8.22 * av * ac * pr! * ui;
  return roundUp(changed ? Math.min(1.08 * (impact + exploitability), 10) : Math.min(impact + exploitability, 10));
}

function severityFromScore(score: number): FindingSeverity {
  return score >= 9 ? "critical" : score >= 7 ? "high" : score >= 4 ? "medium" : score > 0 ? "low" : "info";
}

interface OsvVulnerability {
  id: string;
  summary?: string;
  aliases?: string[];
  severity?: { type?: string; score?: string }[];
  database_specific?: { severity?: string };
  affected?: {
    package?: { name?: string; ecosystem?: string };
    ranges?: { events?: { introduced?: string; fixed?: string; last_affected?: string }[] }[];
    ecosystem_specific?: { severity?: string };
    database_specific?: { severity?: string };
  }[];
}

const LABELS: Record<string, FindingSeverity> = { CRITICAL: "critical", HIGH: "high", MODERATE: "medium", MEDIUM: "medium", LOW: "low" };

/* The severity the advisory states, then its CVSS v3 score; unrated advisories count as medium and say so. */
export function osvSeverity(vulnerability: OsvVulnerability): { severity: FindingSeverity; rated: boolean } {
  const label = vulnerability.database_specific?.severity ?? vulnerability.affected?.map((entry) => entry.ecosystem_specific?.severity ?? entry.database_specific?.severity).find(Boolean);
  if (label && LABELS[label.toUpperCase()]) return { severity: LABELS[label.toUpperCase()], rated: true };
  for (const entry of vulnerability.severity ?? []) {
    const score = entry.score ? cvss3BaseScore(entry.score) : null;
    if (score !== null) return { severity: severityFromScore(score), rated: true };
  }
  return { severity: "medium", rated: false };
}

function fixedVersions(vulnerability: OsvVulnerability, name: string): string[] {
  const fixed = new Set<string>();
  for (const affected of vulnerability.affected ?? []) {
    if (affected.package?.name && affected.package.name.toLowerCase() !== name.toLowerCase()) continue;
    for (const range of affected.ranges ?? []) for (const event of range.events ?? []) if (event.fixed) fixed.add(event.fixed);
  }
  return [...fixed];
}

const ORDER: Record<FindingSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export async function auditOsvAdvisories(
  versions: readonly ResolvedVersion[],
  options: { fetch?: OsvFetch; now?: () => number; enabled?: boolean } = {},
): Promise<OsvAdvisoryResult> {
  const checkedAt = (options.now ?? Date.now)();
  const ecosystems = [...new Set(versions.map((entry) => entry.ecosystem))].sort();
  const base = { checkedAt, ecosystems, packagesChecked: 0, findings: [] as RepositoryFinding[] };
  if (options.enabled === false) return { ...base, status: "off", reason: "OSV advisories are turned off (KORELUMINA_OSV_ADVISORIES=off)" };
  if (versions.length === 0) return { ...base, status: "checked", reason: null };
  const request: OsvFetch = options.fetch ?? (fetch as unknown as OsvFetch);

  const call = async (url: string, body?: unknown) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await request(url, body === undefined ? { signal: controller.signal } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
      if (!response.ok) throw new Error(`OSV answered ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const hits = new Map<number, string[]>();
  try {
    for (let start = 0; start < versions.length; start += BATCH_SIZE) {
      const batch = versions.slice(start, start + BATCH_SIZE);
      const answer = (await call(`${OSV_API}/querybatch`, {
        queries: batch.map((entry) => ({ package: { name: entry.name, ecosystem: entry.ecosystem }, version: entry.version })),
      })) as { results?: { vulns?: { id?: string }[] }[] };
      if (!Array.isArray(answer?.results) || answer.results.length !== batch.length) throw new Error("OSV returned an unexpected answer");
      answer.results.forEach((result, index) => {
        const ids = (result?.vulns ?? []).map((entry) => entry.id).filter((id): id is string => typeof id === "string");
        if (ids.length > 0) hits.set(start + index, ids);
      });
    }
  } catch (error) {
    const message = error instanceof Error ? (error.name === "AbortError" ? "OSV did not answer within 30 seconds" : error.message) : String(error);
    return { ...base, status: "unavailable", reason: `OSV could not be reached (${message})` };
  }

  const ids = [...new Set([...hits.values()].flat())];
  const details = new Map<string, OsvVulnerability | null>();
  const wanted = ids.slice(0, MAX_DETAILS);
  for (let start = 0; start < wanted.length; start += DETAIL_CONCURRENCY) {
    await Promise.all(
      wanted.slice(start, start + DETAIL_CONCURRENCY).map(async (id) => {
        try {
          details.set(id, (await call(`${OSV_API}/vulns/${encodeURIComponent(id)}`)) as OsvVulnerability);
        } catch {
          details.set(id, null);
        }
      }),
    );
  }

  const findings: RepositoryFinding[] = [];
  for (const [index, vulnerabilityIds] of [...hits.entries()].sort(([left], [right]) => left - right)) {
    const entry = versions[index];
    const known = vulnerabilityIds.map((id) => ({ id, detail: details.get(id) ?? null }));
    const rated = known.map(({ id, detail }) => ({ id, detail, ...(detail ? osvSeverity(detail) : { severity: "medium" as FindingSeverity, rated: false }) }));
    rated.sort((left, right) => ORDER[left.severity] - ORDER[right.severity] || (left.id < right.id ? -1 : 1));
    const worst = rated[0];
    const fixes = [...new Set(rated.flatMap(({ detail }) => (detail ? fixedVersions(detail, entry.name) : [])))];
    const names = rated.map(({ id, detail }) => [id, ...(detail?.aliases ?? []).filter((alias) => alias.startsWith("CVE-"))].join(" / "));
    findings.push(
      createFinding({
        identity: `${entry.ecosystem}\0${entry.name}\0${entry.version}\0${vulnerabilityIds.slice().sort().join(",")}`,
        rule: "security.advisory",
        category: "security",
        severity: worst.severity,
        title: `${entry.name} ${entry.version}: ${worst.detail?.summary ?? worst.id}${rated.length > 1 ? ` and ${rated.length - 1} more` : ""}`,
        detail: `${entry.ecosystem} package ${entry.name} ${entry.version} from ${entry.source} has ${rated.length} known advisor${rated.length === 1 ? "y" : "ies"}: ${names.join("; ")}.${rated.some((item) => !item.rated) ? " Advisories without a severity rating are counted as medium." : ""} Source: OSV (osv.dev).`,
        packageDirectory: entry.packageDirectory,
        evidence: [{ file: entry.source }],
        remedy: fixes.length > 0 ? `Upgrade ${entry.name} to a fixed version (${fixes.slice(0, 4).join(", ")}${fixes.length > 4 ? ", …" : ""}) and update the lockfile.` : "No fixed version is published yet; consider replacing the package or limiting its exposure.",
      }),
    );
  }
  return { ...base, status: "checked", reason: ids.length > MAX_DETAILS ? `details were read for the first ${MAX_DETAILS} advisories` : null, packagesChecked: versions.length, findings };
}
