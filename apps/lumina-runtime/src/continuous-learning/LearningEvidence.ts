import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import type { LearningWindowCommit } from "./ContinuousLearningLedger.js";

/*
 * ADR-0042 (CL-1c): everything the Chief Agent may cite when it writes a
 * Learning Record for a window: the window's commits with their messages
 * and changed files, and the executive decisions and approvals recorded
 * in the window. Read-only.
 */

export interface LearningEvidenceCommit {
  sha: string;
  subject: string;
  authorName: string;
  committedAt: number;
  detail: string;
  files: readonly string[];
}

export interface LearningEvidenceRecord {
  id: string;
  kind: "decision" | "approval";
  title: string;
  status: string;
  at: number;
}

export interface LearningEvidence {
  fromCommit: string;
  toCommit: string;
  commits: readonly LearningEvidenceCommit[];
  bookkeepingCommits: readonly string[];
  changedFiles: readonly string[];
  executiveRecords: readonly LearningEvidenceRecord[];
}

/*
 * Commits that only record learning or governance state are not
 * engineering work to learn from (and would make learning recursive).
 */
const BOOKKEEPING_PREFIXES = [
  "docs/learning/",
  "runtime/governance/continuous-learning/",
  "runtime/knowledge/",
  "runtime/executive/",
  "runtime/governance/",
];

export function isBookkeepingCommit(files: readonly string[]): boolean {
  return (
    files.length > 0 &&
    files.every((file) =>
      BOOKKEEPING_PREFIXES.some((prefix) => file.startsWith(prefix)),
    )
  );
}

export interface LearningEvidenceCollectorOptions {
  repositoryRoot: string;
  executiveRoot: () => string;
  maxCharsPerCommit?: number;
  maxTotalChars?: number;
}

function readRecords(
  directory: string,
  kind: LearningEvidenceRecord["kind"],
  from: number,
  to: number,
): LearningEvidenceRecord[] {
  let names: string[];
  try {
    names = fs.readdirSync(directory).filter((name) => name.endsWith(".json"));
  } catch {
    return [];
  }
  const records: LearningEvidenceRecord[] = [];
  for (const name of names) {
    try {
      const value = JSON.parse(
        fs.readFileSync(path.join(directory, name), "utf8"),
      ) as Record<string, unknown>;
      const at = Number(value.updatedAt ?? value.createdAt ?? 0);
      if (!(at > from && at <= to)) continue;
      const metadata = (value.metadata ?? {}) as Record<string, unknown>;
      records.push({
        id: String(value.id),
        kind,
        title: String(value.title ?? metadata.decisionTitle ?? value.decisionId ?? value.id),
        status: String(value.status ?? "unknown"),
        at,
      });
    } catch {
      /* unreadable record: not citable */
    }
  }
  return records;
}

export class LearningEvidenceCollector {
  private readonly maxCharsPerCommit: number;
  private readonly maxTotalChars: number;

  constructor(private readonly options: LearningEvidenceCollectorOptions) {
    this.maxCharsPerCommit = options.maxCharsPerCommit ?? 4_000;
    this.maxTotalChars = options.maxTotalChars ?? 48_000;
  }

  private git(args: string[]): string {
    return execFileSync("git", args, {
      cwd: this.options.repositoryRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  }

  collect(input: {
    fromCommit: string;
    commits: readonly LearningWindowCommit[];
    windowStart: number;
    windowEnd: number;
  }): LearningEvidence {
    const commits: LearningEvidenceCommit[] = [];
    const bookkeeping: string[] = [];
    const perCommit = Math.max(
      600,
      Math.min(
        this.maxCharsPerCommit,
        Math.floor(this.maxTotalChars / Math.max(input.commits.length, 1)),
      ),
    );

    for (const commit of input.commits) {
      const files = this.git([
        "show",
        "--no-color",
        "--format=",
        "--name-only",
        commit.sha,
      ])
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (isBookkeepingCommit(files)) {
        bookkeeping.push(commit.sha);
        continue;
      }

      const engineeringFiles = files.filter(
        (file) =>
          !BOOKKEEPING_PREFIXES.some((prefix) => file.startsWith(prefix)),
      );

      const detail = this.git([
        "show",
        "--no-color",
        "--stat=160",
        "--format=%s%n%n%b",
        commit.sha,
        "--",
        ".",
        ...BOOKKEEPING_PREFIXES.map((prefix) => `:(exclude)${prefix}`),
      ]);

      commits.push({
        sha: commit.sha,
        subject: commit.subject,
        authorName: commit.authorName,
        committedAt: commit.committedAt,
        detail:
          detail.length > perCommit
            ? `${detail.slice(0, perCommit)}\n[truncated]`
            : detail,
        files: engineeringFiles,
      });
    }

    const toCommit =
      input.commits[input.commits.length - 1]?.sha ?? input.fromCommit;

    const changedFiles = [
      ...new Set(commits.flatMap((commit) => commit.files)),
    ].sort();

    const executiveRoot = this.options.executiveRoot();
    const executiveRecords = [
      ...readRecords(path.join(executiveRoot, "decisions"), "decision", input.windowStart, input.windowEnd),
      ...readRecords(path.join(executiveRoot, "approvals"), "approval", input.windowStart, input.windowEnd),
    ].sort((left, right) => left.at - right.at);

    return {
      fromCommit: input.fromCommit,
      toCommit,
      commits,
      bookkeepingCommits: bookkeeping,
      changedFiles,
      executiveRecords,
    };
  }
}
