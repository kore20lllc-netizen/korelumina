import type { PreviewTone } from "../design/executiveDesignPreview";
import type { ExecutiveOfficeState } from "./useExecutiveOffice";

/*
 * EW-1b: the Chief Agent's automatic briefing.
 *
 * Opening the Executive Office briefs the owner on what happened since
 * their last visit and what needs them, composed from the same Runtime
 * records the office reads (activation, learning cycles, decisions,
 * approvals, canonical reviews). Nothing here is typed in or guessed: a
 * record that could not be read is reported as unread, not as healthy.
 *
 * It is deliberately composed, not generated: it is instant, costs nothing,
 * and cannot invent state. The Chief Agent's own narrative briefing needs
 * live operational state in its reasoning context first (F-24).
 */

export interface BriefingItem {
  text: string;
  detail?: string;
}

export interface BriefingRisk {
  title: string;
  tone: PreviewTone;
}

export interface ExecutiveBriefing {
  ready: boolean;
  generatedAt: number;
  since: number;
  sinceLabel: string;
  greeting: string;
  headline: string;
  completed: BriefingItem[];
  remaining: BriefingItem[];
  priorities: BriefingItem[];
  risks: BriefingRisk[];
  narrative: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

function ago(at: number, now: number): string {
  const minutes = Math.max(0, Math.round((now - at) / 60_000));
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function greetingFor(now: number): string {
  const hour = new Date(now).getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

/* docs/learning/LR-2026-0005-executive-office-design-preview.md -> "Executive office design preview" */
function learningTitle(repositoryPath: unknown, recordId: string): string {
  if (typeof repositoryPath !== "string") return recordId;
  const file = repositoryPath.split("/").pop() ?? "";
  const slug = file.replace(/\.md$/, "").replace(/^LR-\d{4}-\d{4}-?/, "");
  if (!slug) return recordId;
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function composeExecutiveBriefing(
  office: ExecutiveOfficeState,
  lastVisit: number | null,
  now: number = Date.now(),
): ExecutiveBriefing {
  const since = lastVisit && now - lastVisit < 14 * DAY_MS ? lastVisit : now - DAY_MS;
  const sinceLabel = lastVisit && since === lastVisit
    ? `since your last visit ${ago(lastVisit, now)}`
    : "in the last 24 hours";

  const ready =
    office.operations.status !== "loading" &&
    office.activation.status !== "loading" &&
    office.learning.status !== "loading" &&
    office.canonicalReviews.status !== "loading";

  const completed: BriefingItem[] = [];
  const remaining: BriefingItem[] = [];
  const priorities: BriefingItem[] = [];
  const risks: BriefingRisk[] = [];
  const sentences: string[] = [];

  /* Chief Agent */
  const activation = office.activation;
  if (activation.status === "ok" && !activation.data.active) {
    risks.push({ title: `The Chief Agent is not active (${activation.data.state}).`, tone: "error" });
  }
  if (activation.status === "error") {
    risks.push({ title: `Activation could not be read: ${activation.message}`, tone: "error" });
  }

  /* Learning */
  const learning = office.learning;
  if (learning.status === "ok") {
    const recent = learning.data.cycles.filter((cycle) => (cycle.completedAt ?? cycle.startedAt) >= since);
    const learned = recent.filter((cycle) => cycle.outcome === "CAPTURED");
    for (const cycle of learned) {
      const recordId = cycle.learning?.recordId;
      completed.push({
        text: recordId
          ? `Learned ${recordId}: ${learningTitle(cycle.learning?.repositoryPath, recordId)}`
          : `Captured ${plural(cycle.commits.length, "commit")}`,
        detail: cycle.commits.map((commit) => commit.subject).join(" · "),
      });
    }
    if (learned.length > 0) {
      const records = learned.map((cycle) => cycle.learning?.recordId).filter(Boolean);
      sentences.push(
        records.length > 0
          ? `I learned from your engineering work: ${records.join(", ")}.`
          : `I captured ${plural(learned.reduce((sum, cycle) => sum + cycle.commits.length, 0), "commit")}.`,
      );
    }

    /* A failure a later cycle already recovered from is history, not a risk. */
    const latest = [...learning.data.cycles].sort((a, b) => a.startedAt - b.startedAt).pop();
    if (latest && (latest.outcome === "FAILED" || latest.outcome === "HELD")) {
      risks.push({
        title: `The latest learning cycle ${latest.outcome === "FAILED" ? "failed" : "was held"}${latest.reasons.length ? `: ${latest.reasons.join("; ")}` : "."}`,
        tone: latest.outcome === "FAILED" ? "error" : "warning",
      });
    }

    const waitingCommits = learning.data.pendingCommits.length;
    if (waitingCommits > 0) {
      remaining.push({
        text: `${plural(waitingCommits, "commit")} not learned yet`,
        detail: learning.data.pendingCommits.map((commit) => commit.subject).join(" · "),
      });
    }
    if (learning.data.nonOwnerPendingCommits.length > 0) {
      risks.push({
        title: `${plural(learning.data.nonOwnerPendingCommits.length, "commit")} by someone other than you are held from learning.`,
        tone: "warning",
      });
    }
  } else if (learning.status === "error") {
    risks.push({ title: `Learning status could not be read: ${learning.message}`, tone: "warning" });
  }

  /* Decisions and approvals */
  const operations = office.operations;
  let pendingProposals = 0;
  if (operations.status === "ok") {
    const decided = operations.data.decisions.filter(
      (decision) => decision.updatedAt >= since && decision.status !== "proposed",
    );
    for (const decision of decided) {
      completed.push({ text: `${decision.status.charAt(0).toUpperCase()}${decision.status.slice(1)}: ${decision.title}` });
    }

    const pending = operations.data.approvals.filter((approval) => approval.status === "pending");
    pendingProposals = pending.length;
    for (const approval of pending) {
      remaining.push({
        text: `Decide: ${approval.metadata?.decisionTitle ?? approval.decisionId}`,
        detail: `Proposed by ${approval.requestedBy} ${ago(approval.createdAt, now)}`,
      });
    }
    if (pending.length > 0) {
      priorities.push({
        text: `Decide ${plural(pending.length, "proposal")} from the Chief Agent`,
        detail: "Nothing it proposes takes effect until you approve or reject it.",
      });
      sentences.push(`${plural(pending.length, "proposal")} of mine ${pending.length === 1 ? "waits" : "wait"} for your decision.`);
    }
  } else if (operations.status === "error") {
    risks.push({ title: `Decisions and approvals could not be read: ${operations.message}`, tone: "error" });
  }

  /* Canonical reviews */
  const reviews = office.canonicalReviews;
  if (reviews.status === "ok" && reviews.data.length > 0) {
    const oldest = reviews.data.reduce((first, review) => (review.createdAt < first.createdAt ? review : first));
    for (const review of reviews.data) {
      remaining.push({ text: `Review ${review.id}: ${review.title}`, detail: `${review.classification.replace(/_/g, " ")} · waiting ${ago(review.createdAt, now).replace(" ago", "")}` });
    }
    const individual = reviews.data.filter((review) => review.classification === "individual");
    priorities.push({
      text: `Review ${plural(reviews.data.length, "knowledge package")} in Canonical Review`,
      detail: individual.length > 0
        ? `Start with the individual reviews: ${individual.map((review) => review.title).join("; ")}.`
        : "They are batch candidates and can be reviewed together.",
    });
    sentences.push(
      `${plural(reviews.data.length, "knowledge package")} ${reviews.data.length === 1 ? "waits" : "wait"} for canonical review, the oldest for ${ago(oldest.createdAt, now).replace(" ago", "")}.`,
    );
    if (now - oldest.createdAt > 14 * DAY_MS) {
      risks.push({ title: `${oldest.id} has waited ${ago(oldest.createdAt, now).replace(" ago", "")} for canonical review.`, tone: "warning" });
    }
  } else if (reviews.status === "error") {
    risks.push({ title: `Canonical reviews could not be read: ${reviews.message}`, tone: "warning" });
  }

  if (learning.status === "ok" && learning.data.pendingCommits.length > 0 && !learning.data.running) {
    priorities.push({
      text: `Let me learn ${plural(learning.data.pendingCommits.length, "new commit")}`,
      detail: "Press Learn now, or I learn them at the next 30-minute check.",
    });
  }

  if (priorities.length === 0 && ready) {
    priorities.push({
      text: "Nothing needs you right now",
      detail: "Ask me for the next most valuable engineering step.",
    });
  }

  if (completed.length === 0 && ready) {
    sentences.unshift(`Nothing new was recorded ${sinceLabel}.`);
  }

  const headline = !ready
    ? "Reading Runtime to prepare your briefing…"
    : pendingProposals > 0
      ? `${plural(pendingProposals, "proposal")} ${pendingProposals === 1 ? "needs" : "need"} your decision.`
      : priorities[0]?.text === "Nothing needs you right now"
        ? "All clear: nothing needs your decision right now."
        : `Next: ${priorities[0]?.text ?? "ask the Chief Agent"}.`;

  const greeting = greetingFor(now);
  const narrative = !ready
    ? ""
    : [
        greeting,
        `Here is what happened ${sinceLabel}.`,
        ...sentences,
        priorities[0] ? `I suggest we start with: ${priorities[0].text.charAt(0).toLowerCase()}${priorities[0].text.slice(1)}.` : "",
      ].filter(Boolean).join(" ");

  return {
    ready,
    generatedAt: now,
    since,
    sinceLabel,
    greeting,
    headline,
    completed,
    remaining,
    priorities: priorities.slice(0, 3),
    risks,
    narrative,
  };
}
