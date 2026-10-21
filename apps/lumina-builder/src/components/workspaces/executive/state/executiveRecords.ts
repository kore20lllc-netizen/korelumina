import type { PreviewTone } from "../design/executiveDesignPreview";
import type { ExecutiveOfficeState } from "./useExecutiveOffice";

/*
 * EW-3: the Activity, Notifications, Knowledge and Memory sections, composed
 * from the Runtime records the office already reads. Nothing is typed in:
 * an unread record shows as unread, and a layer that does not exist yet
 * says "Not built".
 */

export interface ActivityEvent {
  key: string;
  at: number;
  type: string;
  title: string;
}

export function composeActivity(office: ExecutiveOfficeState, limit = 12): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  if (office.activation.status === "ok") {
    for (const record of office.activation.data.history) {
      events.push({
        key: `activation:${record.decidedAt}`,
        at: record.decidedAt,
        type: "Activation",
        title:
          record.action === "ACTIVATE"
            ? `Chief Agent activated at ${record.autonomyLevel ?? "no autonomy"} by ${record.decidedBy}`
            : `Chief Agent ${record.action.toLowerCase()} (${record.state}) by ${record.decidedBy}`,
      });
    }
  }

  if (office.learning.status === "ok") {
    for (const cycle of office.learning.data.cycles) {
      const at = cycle.completedAt ?? cycle.startedAt;
      const record = cycle.learning?.recordId;
      events.push({
        key: `learning:${cycle.cycleId}`,
        at,
        type: "Learning",
        title:
          cycle.outcome === "CAPTURED"
            ? record
              ? `Learned ${record} from ${cycle.commits.length} commit${cycle.commits.length === 1 ? "" : "s"}`
              : `Captured ${cycle.commits.length} commit${cycle.commits.length === 1 ? "" : "s"}`
            : cycle.outcome === "NO_NEW_WORK"
              ? "Learning check: nothing new"
              : `Learning cycle ${cycle.outcome.toLowerCase()}${cycle.reasons.length ? `: ${cycle.reasons.join("; ")}` : ""}`,
      });
    }
  }

  if (office.operations.status === "ok") {
    for (const decision of office.operations.data.decisions) {
      events.push({
        key: `decision:${decision.id}:proposed`,
        at: decision.createdAt,
        type: "Proposal",
        title: `Chief Agent proposed: ${decision.title}`,
      });
      if (decision.status !== "proposed" && decision.updatedAt > decision.createdAt) {
        events.push({
          key: `decision:${decision.id}:${decision.status}`,
          at: decision.updatedAt,
          type: "Decision",
          title: `${decision.status.charAt(0).toUpperCase()}${decision.status.slice(1)}: ${decision.title}`,
        });
      }
    }
  }

  if (office.lifecycle.status === "ok") {
    for (const item of office.lifecycle.data.canonicalItems) {
      if (!item.canonicalizedAt) continue;
      events.push({
        key: `canonical:${item.id}`,
        at: item.canonicalizedAt,
        type: "Knowledge",
        title: `Promoted to canonical: ${item.title}`,
      });
    }
  }

  return events
    .filter((event) => event.at > 0)
    .sort((left, right) => right.at - left.at)
    .slice(0, limit);
}

export interface PriorityNotification {
  priority: "Critical" | "High" | "Normal" | "Informational";
  title: string;
  detail: string;
  tone: PreviewTone;
  /* MS-2026-0004 (E2.T2): Critical conditions not yet acknowledged. */
  unacknowledged?: Array<{ key: string; text: string }>;
}

/*
 * A Critical condition carries a stable key naming this occurrence, so an
 * acknowledgement covers exactly it; null when it cannot be recorded
 * (Runtime not answering).
 */
interface CriticalCondition {
  key: string | null;
  text: string;
}

export function composeNotifications(office: ExecutiveOfficeState): PriorityNotification[] {
  const conditions: CriticalCondition[] = [];
  if (office.activation.status === "ok" && !office.activation.data.active) {
    const latest = office.activation.data.history.reduce((newest, record) => Math.max(newest, record.decidedAt), 0);
    conditions.push({ key: `activation-${office.activation.data.state.toLowerCase()}:${latest}`, text: `The Chief Agent is not active (${office.activation.data.state}).` });
  }
  if (office.prerequisites.status === "ok") {
    for (const prerequisite of office.prerequisites.data.filter((entry) => entry.state !== "VALID")) {
      conditions.push({
        key: `prerequisite-${prerequisite.gate}:${prerequisite.state.toLowerCase()}:${prerequisite.id ?? "none"}`,
        text: `Activation certification ${prerequisite.gate} is ${prerequisite.state.toLowerCase()}.`,
      });
    }
  }
  if (office.learning.status === "ok") {
    const latest = [...office.learning.data.cycles].sort((a, b) => b.startedAt - a.startedAt)[0];
    if (latest?.outcome === "FAILED") {
      conditions.push({ key: `learning-cycle-failed:${latest.cycleId}`, text: `The latest learning cycle failed${latest.reasons.length ? `: ${latest.reasons.join("; ")}` : "."}` });
    }
  }
  const unreadable = [office.operations, office.activation, office.learning].filter((read) => read.status === "error");
  if (unreadable.length === 3) conditions.push({ key: null, text: "Runtime is not answering." });

  const acknowledged = new Map((office.acknowledgements.status === "ok" ? office.acknowledgements.data : []).map((entry) => [entry.conditionKey, entry]));
  const open = conditions.filter((condition) => !condition.key || !acknowledged.has(condition.key));
  const seen = conditions.map((condition) => (condition.key ? acknowledged.get(condition.key) : undefined)).filter(Boolean);
  const critical = (open.length ? open : conditions).map((condition) => condition.text);

  const pending =
    office.operations.status === "ok"
      ? office.operations.data.approvals.filter((approval) => approval.status === "pending")
      : [];

  const reviews = office.canonicalReviews.status === "ok" ? office.canonicalReviews.data : [];

  const learned =
    office.learning.status === "ok"
      ? [...office.learning.data.cycles]
          .sort((a, b) => b.startedAt - a.startedAt)
          .find((cycle) => cycle.learning?.recordId)
      : undefined;

  return [
    {
      priority: "Critical",
      title: critical.length ? critical[0] : "None",
      detail: !critical.length
        ? "Nothing requires acknowledgement."
        : open.length
          ? [critical.slice(1).join(" "), open.some((condition) => condition.key) ? "Requires your acknowledgement." : ""].filter(Boolean).join(" ")
          : `${critical.slice(1).join(" ")} Acknowledged by ${seen[0]!.acknowledgedBy} ${new Date(seen[0]!.acknowledgedAt).toLocaleString()}.`.trim(),
      tone: !critical.length ? "healthy" : open.length ? "error" : "warning",
      unacknowledged: open.filter((condition): condition is { key: string; text: string } => Boolean(condition.key)),
    },
    {
      priority: "High",
      title: pending.length ? `${pending.length} proposal${pending.length === 1 ? "" : "s"} waiting for you` : "None",
      detail: pending.length
        ? pending.map((approval) => approval.metadata?.decisionTitle ?? approval.decisionId).join("; ")
        : "No Chief Agent proposal is waiting for your decision.",
      tone: pending.length ? "warning" : "healthy",
    },
    {
      priority: "Normal",
      title: reviews.length ? `${reviews.length} package${reviews.length === 1 ? "" : "s"} awaiting canonical review` : "None",
      detail: reviews.length ? reviews.map((review) => review.id).join(", ") : "The canonical review queue is empty.",
      tone: reviews.length ? "warning" : "healthy",
    },
    {
      priority: "Informational",
      title: learned?.learning?.recordId ? `${learned.learning.recordId} written` : "No Learning Record yet",
      detail: learned
        ? `Learned from ${learned.commits.map((commit) => commit.subject).join("; ")}`
        : "The Chief Agent writes one after each owner commit window.",
      tone: "active",
    },
  ];
}

export interface KnowledgeCategory {
  label: "Canon and Constitution" | "Architecture and governance" | "Business and domain" | "Learning Records" | "Awaiting review";
  count: number | null;
  detail: string;
}

function categoryOf(contentRef: string, title: string): KnowledgeCategory["label"] {
  const ref = contentRef.toLowerCase();
  if (ref.startsWith("docs/learning/")) return "Learning Records";
  if (ref.startsWith("docs/business/") || ref.startsWith("docs/domain/")) return "Business and domain";
  if (
    ref.startsWith("docs/canon/") ||
    ref.includes("constitution") ||
    ref.includes("/amendments/") ||
    /^CA-\d{3}/.test(title)
  ) {
    return "Canon and Constitution";
  }
  return "Architecture and governance";
}

function listTitles(titles: string[]): string {
  if (titles.length <= 4) return titles.join(", ");
  return `${titles.slice(0, 4).join(", ")} and ${titles.length - 4} more`;
}

function shortTitle(title: string): string {
  const head = title.split(" — ")[0];
  return head.length <= 28 ? head : `${head.slice(0, 27)}…`;
}

export function composeKnowledgeCategories(office: ExecutiveOfficeState): KnowledgeCategory[] {
  const labels: KnowledgeCategory["label"][] = [
    "Canon and Constitution",
    "Architecture and governance",
    "Business and domain",
    "Learning Records",
  ];

  const lifecycle = office.lifecycle;
  const reviews = office.canonicalReviews;

  const categories: KnowledgeCategory[] = labels.map((label) => {
    if (lifecycle.status !== "ok") {
      return { label, count: null, detail: lifecycle.status === "error" ? "Could not be read" : "Reading…" };
    }
    /* Certification records written to /tmp are kept for history, not reasoned with. */
    const items = lifecycle.data.canonicalItems
      .filter((item) => !item.contentRef.startsWith("/tmp/"))
      .filter((item) => categoryOf(item.contentRef, item.title) === label);
    return {
      label,
      count: items.length,
      detail: items.length ? listTitles(items.map((item) => shortTitle(item.title))) : "None yet",
    };
  });

  categories.push(
    reviews.status === "ok"
      ? {
          label: "Awaiting review",
          count: reviews.data.length,
          detail: reviews.data.length ? listTitles(reviews.data.map((review) => shortTitle(review.title))) : "Queue is empty",
        }
      : { label: "Awaiting review", count: null, detail: reviews.status === "error" ? "Could not be read" : "Reading…" },
  );

  return categories;
}

export interface MemoryLayer {
  layer: string;
  detail: string;
  state: string;
  built: boolean;
}

export function composeMemoryLayers(office: ExecutiveOfficeState): MemoryLayer[] {
  const reasoning = office.operations.status === "ok" ? office.operations.data.reasoning.length : null;
  const cycles = office.learning.status === "ok" ? office.learning.data.cycles : null;
  const firstCycle = cycles && cycles.length ? Math.min(...cycles.map((cycle) => cycle.startedAt)) : null;
  const lifecycle = office.lifecycle.status === "ok" ? office.lifecycle.data : null;
  const canonical = office.knowledge.status === "ok" ? office.knowledge.data.canonicalItems : lifecycle?.canonicalItems.length ?? null;
  const reading = "Reading…";

  return [
    { layer: "Working Memory", detail: "Governed knowledge and live state assembled for each request", state: "Per request", built: true },
    {
      layer: "Conversation Memory",
      detail: "Your questions and the Chief Agent's recorded reasoning",
      state: reasoning === null ? reading : `${reasoning} exchange${reasoning === 1 ? "" : "s"}`,
      built: true,
    },
    { layer: "Session Memory", detail: "Today's work session", state: "Not built", built: false },
    { layer: "Project Memory", detail: "Per managed project", state: "Not built", built: false },
    {
      layer: "Repository Memory",
      detail: "Owner commits captured by continuous learning",
      state: cycles === null ? reading : firstCycle ? `${cycles.length} cycle${cycles.length === 1 ? "" : "s"} since ${new Date(firstCycle).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "No cycle yet",
      built: true,
    },
    {
      layer: "Organizational Memory",
      detail: "Stewarded projections of canonical knowledge",
      state: lifecycle === null ? reading : `${lifecycle.organizationalMemory} record${lifecycle.organizationalMemory === 1 ? "" : "s"}`,
      built: true,
    },
    {
      layer: "Canonical Knowledge",
      detail: "Certified, governed knowledge",
      state: canonical === null ? reading : `${canonical} item${canonical === 1 ? "" : "s"}`,
      built: true,
    },
  ];
}
