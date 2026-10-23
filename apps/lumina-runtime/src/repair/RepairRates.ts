import fs from "node:fs";
import path from "node:path";

import type { FindingCategory, FindingSeverity, RepositoryFinding } from "../repository-intelligence/RepositoryFinding.js";
import { isNodeTestProcess, isolatedTestStorageRoot, resolveRepositoryRoot } from "../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";

/*
 * MS-2026-0015: the repair rate table and the quotes made from it.
 *
 * The owner publishes the table as a versioned governance record
 * (runtime/governance/repair-rates/repair-rate-table-vN.json); the highest
 * version is in force. A quote prices the findings the customer picked:
 * each costs its severity's price, times its category's multiplier if the
 * table sets one, and the job costs at least the minimum. Every quote
 * records the table version it used, and is always recomputed by Runtime:
 * a price sent by the browser is never trusted.
 */

const SEVERITIES: readonly FindingSeverity[] = ["critical", "high", "medium", "low", "info"];

export interface RepairRateTable {
  version: number;
  currency: string;
  minimumCents: number;
  perFindingCents: Record<FindingSeverity, number>;
  categoryMultiplier: Partial<Record<FindingCategory, number>>;
  approvedBy: string;
  approvedAt: string;
}

export interface QuoteLine {
  findingId: string;
  title: string;
  severity: FindingSeverity;
  category: FindingCategory;
  priceCents: number;
}

export interface RepairQuote {
  rateTableVersion: number;
  currency: string;
  lines: QuoteLine[];
  subtotalCents: number;
  minimumCents: number;
  totalCents: number;
}

export function resolveRepairRateRoot(): string {
  const configured = process.env.KORELUMINA_REPAIR_RATE_ROOT?.trim();
  if (configured) return path.resolve(configured);
  if (isNodeTestProcess()) return isolatedTestStorageRoot("repair-rates");
  return path.join(resolveRepositoryRoot(), "runtime", "governance", "repair-rates");
}

function validTable(value: unknown): value is RepairRateTable {
  const table = value as RepairRateTable;
  return (
    Number.isInteger(table?.version) &&
    table.version > 0 &&
    typeof table.currency === "string" &&
    Number.isInteger(table.minimumCents) &&
    table.minimumCents >= 0 &&
    typeof table.perFindingCents === "object" &&
    SEVERITIES.every((severity) => Number.isInteger(table.perFindingCents[severity]) && table.perFindingCents[severity] >= 0) &&
    typeof table.categoryMultiplier === "object" &&
    Object.values(table.categoryMultiplier ?? {}).every((factor) => typeof factor === "number" && factor > 0)
  );
}

/* The table in force: the highest valid version. Null when none is published. */
export function currentRateTable(root: string = resolveRepairRateRoot()): RepairRateTable | null {
  if (!fs.existsSync(root)) return null;
  let best: RepairRateTable | null = null;
  for (const name of fs.readdirSync(root)) {
    if (!/^repair-rate-table-v\d+\.json$/.test(name)) continue;
    try {
      const table = JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
      if (validTable(table) && (!best || table.version > best.version)) best = table;
    } catch {
      /* an unreadable table is not in force */
    }
  }
  return best;
}

export type QuoteResult = { ok: true; quote: RepairQuote } | { ok: false; error: string };

export function quoteRepair(findings: readonly RepositoryFinding[], findingIds: readonly string[], table: RepairRateTable | null): QuoteResult {
  if (!table) return { ok: false, error: "repair_rates_not_published" };
  const wanted = [...new Set(findingIds)];
  if (wanted.length === 0) return { ok: false, error: "choose_at_least_one_finding" };
  const byId = new Map(findings.map((finding) => [finding.id, finding]));
  const lines: QuoteLine[] = [];
  for (const id of wanted) {
    const finding = byId.get(id);
    if (!finding) return { ok: false, error: "finding_not_in_report" };
    const factor = table.categoryMultiplier[finding.category] ?? 1;
    lines.push({ findingId: id, title: finding.title, severity: finding.severity, category: finding.category, priceCents: Math.round(table.perFindingCents[finding.severity] * factor) });
  }
  lines.sort((left, right) => SEVERITIES.indexOf(left.severity) - SEVERITIES.indexOf(right.severity) || (left.title < right.title ? -1 : 1));
  const subtotalCents = lines.reduce((sum, line) => sum + line.priceCents, 0);
  return {
    ok: true,
    quote: {
      rateTableVersion: table.version,
      currency: table.currency,
      lines,
      subtotalCents,
      minimumCents: table.minimumCents,
      totalCents: Math.max(subtotalCents, table.minimumCents),
    },
  };
}
