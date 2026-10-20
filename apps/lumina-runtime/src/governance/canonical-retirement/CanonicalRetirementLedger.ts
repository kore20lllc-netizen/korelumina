import fs from "node:fs";
import path from "node:path";

import {
  isNodeTestProcess,
  isolatedTestStorageRoot,
  resolveRepositoryRoot,
} from "../../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";

/*
 * F-28: retiring canonical knowledge from current policy.
 *
 * Current policy is normally derived from Genesis admission governance. A
 * canonical item that Genesis never produced (for example the August
 * pipeline certification fixtures) has no governance record, so nothing
 * could take it out of current policy. A retirement record does: a
 * committed file in runtime/governance/canonical-retirements, decided by a
 * human with a reason. The owner's commit is the approval (ADR-0042
 * Decision 1).
 *
 * Retirement only removes items from current policy (what the Chief Agent
 * reasons with). The canonical items stay in the store with their history;
 * nothing is deleted. A record not decided by a human is ignored.
 */

export interface CanonicalRetirementRecord {
  id: string;
  canonicalIds: string[];
  reason: string;
  decidedBy: string;
  decidedAt: string;
}

export function resolveCanonicalRetirementRoot(): string {
  const configured = process.env.KORELUMINA_CANONICAL_RETIREMENT_ROOT?.trim();
  if (configured) return path.resolve(configured);
  if (isNodeTestProcess()) return isolatedTestStorageRoot("canonical-retirements");
  return path.join(resolveRepositoryRoot(), "runtime", "governance", "canonical-retirements");
}

function isValid(record: unknown): record is CanonicalRetirementRecord {
  if (!record || typeof record !== "object") return false;
  const candidate = record as Partial<CanonicalRetirementRecord>;
  return (
    typeof candidate.id === "string" &&
    Array.isArray(candidate.canonicalIds) &&
    candidate.canonicalIds.every((id) => typeof id === "string" && id.startsWith("canonical:")) &&
    typeof candidate.reason === "string" &&
    candidate.reason.trim().length >= 10 &&
    typeof candidate.decidedBy === "string" &&
    candidate.decidedBy.startsWith("human:") &&
    typeof candidate.decidedAt === "string"
  );
}

export class CanonicalRetirementLedger {
  constructor(private readonly root: () => string = resolveCanonicalRetirementRoot) {}

  records(): CanonicalRetirementRecord[] {
    const root = this.root();
    if (!fs.existsSync(root)) return [];
    return fs
      .readdirSync(root)
      .filter((name) => name.endsWith(".json"))
      .sort()
      .flatMap((name) => {
        try {
          const record = JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
          return isValid(record) ? [record] : [];
        } catch {
          return [];
        }
      });
  }

  retiredCanonicalIds(): string[] {
    return [...new Set(this.records().flatMap((record) => record.canonicalIds))].sort();
  }
}
