import fs from "node:fs";
import path from "node:path";

import type { LearningEvidence } from "./LearningEvidence.js";
import type {
  LearningRecordDraft,
  LearningStatement,
} from "./LearningRecordSynthesizer.js";

/*
 * ADR-0042 (CL-1c): write a checked Learning Record into docs/learning.
 * The Runtime never runs git; the file becomes part of the owner's next
 * commit, and the next learning cycle admits it.
 */

/*
 * Every Learning Record carries the same Scope, so one review policy
 * (authority "learning", this scope) governs them all (ADR-0042 Decision 4).
 */
export const LEARNING_RECORD_SCOPE =
  "What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.";

export const LEARNING_RECORD_AUTHORITY = "learning";

export interface WrittenLearningRecord {
  recordId: string;
  repositoryPath: string;
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "learning"
  );
}

function citation(value: string): string {
  return /^[0-9a-f]{40}$/.test(value) ? value.slice(0, 8) : value;
}

function section(title: string, entries: readonly LearningStatement[]): string[] {
  if (entries.length === 0) return [];
  return [
    `## ${title}`,
    "",
    ...entries.map(
      (entry) =>
        `- ${entry.statement} (${entry.citations.map((value) => `\`${citation(value)}\``).join(", ")})`,
    ),
    "",
  ];
}

export function renderLearningRecord(input: {
  recordId: string;
  record: LearningRecordDraft;
  evidence: LearningEvidence;
  cycleId: string;
  model: string;
  writtenAt: number;
}): string {
  const date = new Date(input.writtenAt).toISOString().slice(0, 10);
  const sources = input.evidence.commits.map((commit) => commit.sha);
  return [
    `# ${input.recordId} — ${input.record.title}`,
    "",
    "Status: Approved",
    "",
    "Version: 1.0",
    "",
    "Owner: Founder, Kore20 LLC",
    "",
    `Scope: ${LEARNING_RECORD_SCOPE}`,
    "",
    `Window: ${input.evidence.fromCommit.slice(0, 8)}..${input.evidence.toCommit.slice(0, 8)}`,
    "",
    `Source commits: ${sources.map((sha) => sha.slice(0, 8)).join(", ")}`,
    "",
    "Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).",
    "",
    `Approval Date: ${date}`,
    "",
    `Learning cycle: ${input.cycleId} · written by the Chief Agent (${input.model})`,
    "",
    "---",
    "",
    "## Summary",
    "",
    input.record.summary,
    "",
    ...section("What changed", input.record.changes),
    ...section("Decisions", input.record.decisions),
    ...section("Lessons", input.record.lessons),
    ...section("Open risks", input.record.risks),
  ].join("\n");
}

export class LearningRecordWriter {
  constructor(private readonly repositoryRoot: string) {}

  private directory(): string {
    return path.join(this.repositoryRoot, "docs", "learning");
  }

  nextRecordId(at: number): string {
    const year = new Date(at).getUTCFullYear();
    let highest = 0;
    try {
      for (const name of fs.readdirSync(this.directory())) {
        const match = name.match(/^LR-(\d{4})-(\d{4})/);
        if (match && Number(match[1]) === year) {
          highest = Math.max(highest, Number(match[2]));
        }
      }
    } catch {
      /* no records yet */
    }
    return `LR-${year}-${String(highest + 1).padStart(4, "0")}`;
  }

  write(input: {
    record: LearningRecordDraft;
    evidence: LearningEvidence;
    cycleId: string;
    model: string;
    writtenAt: number;
  }): WrittenLearningRecord {
    const recordId = this.nextRecordId(input.writtenAt);
    const fileName = `${recordId}-${slug(input.record.title)}.md`;
    fs.mkdirSync(this.directory(), { recursive: true });
    const target = path.join(this.directory(), fileName);
    fs.writeFileSync(
      target,
      renderLearningRecord({ ...input, recordId }),
      { encoding: "utf8", flag: "wx" },
    );
    return {
      recordId,
      repositoryPath: path.posix.join("docs", "learning", fileName),
    };
  }
}
