import { execFileSync } from "node:child_process";

import type {
  LearningWindowCommit,
} from "./ContinuousLearningLedger.js";

/*
 * ADR-0042 (CL-1a): read the commits since the learning checkpoint from
 * the repository the Runtime serves. Read-only: the Runtime never writes
 * to git.
 */
export interface LearningWindowSource {
  head(): { sha: string; committedAt: number; branch: string };
  commitAt(sha: string): { sha: string; committedAt: number } | null;
  lastCommitAtOrBefore(timestamp: number): { sha: string; committedAt: number } | null;
  commitsAfter(sha: string): LearningWindowCommit[];
  commitsSince(timestamp: number): string[];
  repositoryName(): string;
}

const FIELD = "\u001f";
const RECORD = "\u001e";

export class GitLearningWindowSource
  implements LearningWindowSource
{
  constructor(private readonly repositoryRoot: string) {}

  private git(args: string[]): string {
    return execFileSync("git", args, {
      cwd: this.repositoryRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  }

  head() {
    const [sha, time] = this.git(["log", "-1", "--format=%H %ct"])
      .trim()
      .split(" ");
    const branch = this.git(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
    return { sha, committedAt: Number(time) * 1000, branch };
  }

  commitAt(sha: string) {
    try {
      const [full, time] = this.git(["log", "-1", "--format=%H %ct", sha])
        .trim()
        .split(" ");
      return { sha: full, committedAt: Number(time) * 1000 };
    } catch {
      return null;
    }
  }

  lastCommitAtOrBefore(timestamp: number) {
    const out = this.git([
      "log",
      "-1",
      "--format=%H %ct",
      `--before=@${Math.floor(timestamp / 1000)}`,
    ]).trim();
    if (!out) return null;
    const [sha, time] = out.split(" ");
    return { sha, committedAt: Number(time) * 1000 };
  }

  commitsAfter(sha: string): LearningWindowCommit[] {
    const out = this.git([
      "log",
      "--reverse",
      `--format=%H${FIELD}%an${FIELD}%ae${FIELD}%ct${FIELD}%s${RECORD}`,
      `${sha}..HEAD`,
    ]);
    return out
      .split(RECORD)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [commit, authorName, authorEmail, time, subject] =
          entry.split(FIELD);
        return {
          sha: commit,
          authorName,
          authorEmail: authorEmail.toLowerCase(),
          committedAt: Number(time) * 1000,
          subject,
        };
      });
  }

  commitsSince(timestamp: number): string[] {
    return this.git([
      "log",
      "--format=%H",
      `--since=@${Math.floor(timestamp / 1000)}`,
    ])
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  repositoryName(): string {
    try {
      const url = this.git(["config", "--get", "remote.origin.url"]).trim();
      const match = url.match(/[:/]([^/:]+\/[^/]+?)(?:\.git)?$/);
      if (match) return match[1];
    } catch {
      /* fall through */
    }
    return "korelumina";
  }
}
