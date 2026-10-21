import { createHash } from "node:crypto";

/*
 * MS-2026-0012: one shape for every audit finding. A finding states one
 * problem, points at its evidence, and has an ID derived from its rule and
 * location, so the same problem keeps the same ID across audits and fixes
 * can be tracked.
 */

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export type FindingCategory =
  | "dependency"
  | "security"
  | "build"
  | "environment"
  | "architecture"
  | "quality";

export interface FindingEvidence {
  file: string;
  line?: number;
  /* The offending source line, trimmed. Never set where it could hold a secret. */
  excerpt?: string;
}

export interface RepositoryFinding {
  id: string;
  rule: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  detail: string;
  /* The workspace package it belongs to; "." for the root. */
  packageDirectory: string | null;
  evidence: FindingEvidence[];
  /* What would resolve it, when that is clear. */
  remedy: string | null;
}

export const SEVERITY_ORDER: Readonly<Record<FindingSeverity, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function createFinding(input: Omit<RepositoryFinding, "id"> & { identity: string }): RepositoryFinding {
  const { identity, ...finding } = input;
  return {
    id: `finding:${createHash("sha256").update(`${finding.rule}\0${identity}`).digest("hex").slice(0, 24)}`,
    ...finding,
  };
}

export function sortFindings(findings: readonly RepositoryFinding[]): RepositoryFinding[] {
  return [...findings].sort(
    (left, right) =>
      SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] ||
      (left.rule < right.rule ? -1 : left.rule > right.rule ? 1 : 0) ||
      (left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
  );
}

export function excerpt(line: string): string {
  const trimmed = line.trim();
  return trimmed.length > 200 ? `${trimmed.slice(0, 197)}...` : trimmed;
}
