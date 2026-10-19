/*
 * EW-2 (F-24): live operational state for Chief Agent reasoning.
 *
 * Governed knowledge tells the Chief Agent what is true and allowed; it
 * cannot tell it what is happening now. Asked "which pending review should
 * I handle first?" it answered that it could not see the review queue.
 *
 * This reads a small, read-only snapshot of the platform at the moment of
 * reasoning: activation, continuous learning, executive approvals and
 * decisions, and canonical reviews waiting. Every entry has an
 * `operational:` id the Chief Agent may cite for claims about current
 * state. The snapshot is context, not knowledge: it never authorizes an
 * action and is never promoted. A part that cannot be read is reported as
 * unavailable, never guessed.
 */

export interface ChiefAgentOperationalEntry {
  id: string;
  kind:
    | "activation"
    | "learning"
    | "learning-cycle"
    | "approval"
    | "decision"
    | "canonical-review";
  title: string;
  detail: string;
  at?: string;
}

export interface ChiefAgentOperationalState {
  capturedAt: string;
  entries: ChiefAgentOperationalEntry[];
  unavailable: string[];
}

export interface OperationalActivation {
  state: string;
  autonomyLevel: string | null;
}

export interface OperationalLearning {
  checkpoint: { commit: string; committedAt: number } | null;
  pendingCommits: ReadonlyArray<{ sha: string; subject: string }>;
  nonOwnerPendingCommits: ReadonlyArray<{ sha: string; subject: string }>;
  running: boolean;
  cycles: ReadonlyArray<{
    cycleId: string;
    outcome: string;
    startedAt: number;
    completedAt?: number;
    commits: ReadonlyArray<{ sha: string; subject: string }>;
    reasons: ReadonlyArray<string>;
    learning?: { recordId?: string | null; status?: string } | null;
  }>;
}

export interface OperationalApproval {
  id: string;
  decisionId: string;
  status: string;
  requestedBy: string;
  approverId: string;
  createdAt: number;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface OperationalDecision {
  id: string;
  title: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface OperationalCanonicalReview {
  id: string;
  title: string;
  classification: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChiefAgentOperationalStateSources {
  activation(): OperationalActivation;
  learning(): OperationalLearning;
  approvals(): readonly OperationalApproval[];
  decisions(): readonly OperationalDecision[];
  canonicalReviews(): readonly OperationalCanonicalReview[];
  now?(): number;
}

const LIMIT = 12;

function iso(at: number | undefined): string | undefined {
  return typeof at === "number" && Number.isFinite(at) && at > 0
    ? new Date(at).toISOString()
    : undefined;
}

function days(from: number, to: number): string {
  const value = Math.max(0, Math.round((to - from) / 86_400_000));
  return `${value} day${value === 1 ? "" : "s"}`;
}

export class ChiefAgentOperationalStateReader {
  constructor(
    private readonly sources: ChiefAgentOperationalStateSources,
  ) {}

  read(): ChiefAgentOperationalState {
    const now = this.sources.now?.() ?? Date.now();
    const entries: ChiefAgentOperationalEntry[] = [];
    const unavailable: string[] = [];

    const attempt = (part: string, read: () => void) => {
      try {
        read();
      } catch (error) {
        unavailable.push(
          `${part}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    attempt("activation", () => {
      const activation = this.sources.activation();
      entries.push({
        id: "operational:activation",
        kind: "activation",
        title: `Chief Agent ${activation.state}`,
        detail: `Autonomy level: ${activation.autonomyLevel ?? "none"}.`,
      });
    });

    attempt("learning", () => {
      const learning = this.sources.learning();
      entries.push({
        id: "operational:learning",
        kind: "learning",
        title: learning.running ? "Continuous learning: a cycle is running" : "Continuous learning: idle",
        detail: [
          learning.checkpoint ? `Checkpoint ${learning.checkpoint.commit.slice(0, 8)}.` : "No checkpoint.",
          `${learning.pendingCommits.length} owner commit(s) not learned yet${learning.pendingCommits.length ? `: ${learning.pendingCommits.map((commit) => commit.subject).join("; ")}` : ""}.`,
          learning.nonOwnerPendingCommits.length
            ? `${learning.nonOwnerPendingCommits.length} non-owner commit(s) held from learning.`
            : "",
        ].filter(Boolean).join(" "),
      });

      const recent = [...learning.cycles]
        .sort((left, right) => right.startedAt - left.startedAt)
        .slice(0, 5);
      for (const cycle of recent) {
        entries.push({
          id: `operational:${cycle.cycleId}`,
          kind: "learning-cycle",
          title: `Learning cycle ${cycle.outcome}${cycle.learning?.recordId ? `, wrote ${cycle.learning.recordId}` : ""}`,
          detail: [
            `${cycle.commits.length} commit(s)${cycle.commits.length ? `: ${cycle.commits.map((commit) => commit.subject).join("; ")}` : ""}.`,
            cycle.reasons.length ? `Reasons: ${cycle.reasons.join("; ")}.` : "",
          ].filter(Boolean).join(" "),
          at: iso(cycle.completedAt ?? cycle.startedAt),
        });
      }
    });

    attempt("approvals", () => {
      const pending = this.sources
        .approvals()
        .filter((approval) => approval.status === "pending")
        .sort((left, right) => left.createdAt - right.createdAt)
        .slice(0, LIMIT);
      for (const approval of pending) {
        const title =
          typeof approval.metadata?.decisionTitle === "string"
            ? approval.metadata.decisionTitle
            : approval.decisionId;
        entries.push({
          id: `operational:${approval.id}`,
          kind: "approval",
          title: `Pending approval: ${title}`,
          detail: `Requested by ${approval.requestedBy} for ${approval.approverId}; waiting ${days(approval.createdAt, now)}. Decision ${approval.decisionId}.`,
          at: iso(approval.createdAt),
        });
      }
      if (pending.length === 0) {
        entries.push({
          id: "operational:approvals",
          kind: "approval",
          title: "No executive approvals pending",
          detail: "Nothing the Chief Agent proposed is waiting for a decision.",
        });
      }
    });

    attempt("decisions", () => {
      const recent = [...this.sources.decisions()]
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .slice(0, 6);
      for (const decision of recent) {
        entries.push({
          id: `operational:${decision.id}`,
          kind: "decision",
          title: `Decision ${decision.status}: ${decision.title}`,
          detail: `Last changed ${days(decision.updatedAt, now)} ago.`,
          at: iso(decision.updatedAt),
        });
      }
    });

    attempt("canonical reviews", () => {
      const waiting = [...this.sources.canonicalReviews()]
        .sort((left, right) => left.createdAt - right.createdAt)
        .slice(0, LIMIT);
      for (const review of waiting) {
        entries.push({
          id: `operational:canonical-review:${review.id}`,
          kind: "canonical-review",
          title: `Waiting for canonical review: ${review.id} ${review.title}`,
          detail: `Review mode ${review.classification.replace(/_/g, " ")}; waiting ${days(review.createdAt, now)}.`,
          at: iso(review.createdAt),
        });
      }
      if (waiting.length === 0) {
        entries.push({
          id: "operational:canonical-reviews",
          kind: "canonical-review",
          title: "No knowledge waiting for canonical review",
          detail: "The canonical review queue is empty.",
        });
      }
    });

    return {
      capturedAt: new Date(now).toISOString(),
      entries,
      unavailable,
    };
  }
}
