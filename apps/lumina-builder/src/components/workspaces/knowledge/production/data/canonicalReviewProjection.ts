export interface CanonicalReviewQueueSlot {
  id: string;
  capsuleId: string | null;
  title: string;
  domain: string;
  authority: string;
  reviewers: string;
  conflict: string;
  readiness: number;
  state: string;
  tone: "emerald" | "amber" | "rose";
}

export interface CanonicalReviewTimelineSlot {
  id: string;
  capsuleId: string;
  label: string;
  detail: string;
  state: "complete" | "active" | "waiting";
}

export interface CanonicalReviewAuthoritySlot {
  title: string;
  value: string;
  detail: string;
}

export interface CanonicalReviewProjection {
  summary: {
    awaitingReview: string;
    conflicts: string;
    reviewersActive: string;
    readyToPublish: string;
  };

  metrics: {
    reviewQueue: string;
    requiredReviewers: string;
    pendingDecisions: string;
    publicationReadiness: string;
    priorityReviews: string;
  };

  reviewQueue: readonly CanonicalReviewQueueSlot[];
  timeline: readonly CanonicalReviewTimelineSlot[];
  authorities: readonly CanonicalReviewAuthoritySlot[];
}

export const canonicalReviewFixtureProjection = {
  summary: {
    awaitingReview: "12",
    conflicts: "3",
    reviewersActive: "18",
    readyToPublish: "5",
  },

  metrics: {
    reviewQueue: "12",
    requiredReviewers: "18",
    pendingDecisions: "7",
    publicationReadiness: "82%",
    priorityReviews: "3 priority reviews",
  },

  reviewQueue: [
    {
      id: "KCAP-2026-042",
      capsuleId: "capsule-144",
      title: "Runtime Isolation Recovery Standard",
      domain: "Runtime Architecture",
      authority: "Architecture Council",
      reviewers: "3 of 4 assigned",
      conflict: "No unresolved conflicts",
      readiness: 92,
      state: "Ready for final review",
      tone: "emerald" as const,
    },
    {
      id: "KCAP-2026-039",
      capsuleId: null,
      title: "Knowledge Package Integrity Protocol",
      domain: "Knowledge Constitution",
      authority: "Constitutional Review Board",
      reviewers: "4 of 5 assigned",
      conflict: "1 constitutional interpretation",
      readiness: 74,
      state: "Decision required",
      tone: "amber" as const,
    },
    {
      id: "KCAP-2026-036",
      capsuleId: null,
      title: "Mission Recovery Evidence Standard",
      domain: "Mission System",
      authority: "Mission Governance",
      reviewers: "2 of 4 assigned",
      conflict: "Supersession scope disputed",
      readiness: 58,
      state: "Review blocked",
      tone: "rose" as const,
    },
  ],

  timeline: [
    {
      id: "canonical-review-event-evidence-certified",
      capsuleId: "capsule-144",
      label: "Evidence certified",
      detail: "Validation Council · 09:14",
      state: "complete" as const,
    },
    {
      id: "canonical-review-event-scope-reviewed",
      capsuleId: "capsule-144",
      label: "Constitutional scope reviewed",
      detail: "Chief Systems Architect · 10:02",
      state: "complete" as const,
    },
    {
      id: "canonical-review-event-authority-review",
      capsuleId: "capsule-144",
      label: "Authority review",
      detail: "Architecture Council · In progress",
      state: "active" as const,
    },
    {
      id: "canonical-review-event-publication-decision",
      capsuleId: "capsule-144",
      label: "Publication decision",
      detail: "Required before canonical promotion",
      state: "waiting" as const,
    },
  ],

  authorities: [
    {
      title: "Constitutional authority",
      value: "Knowledge Constitution",
      detail: "Defines admissibility and canonical constraints.",
    },
    {
      title: "Domain authority",
      value: "Architecture Council",
      detail: "Owns technical scope and supersession decisions.",
    },
    {
      title: "Publication authority",
      value: "Chief Systems Architect",
      detail: "Certifies organizational publication readiness.",
    },
  ],
} as const;

import type {
  CanonicalReviewSnapshot,
} from "@/services/knowledgeOperationsService";

export function createCanonicalReviewProjection(
  snapshot: CanonicalReviewSnapshot,
): CanonicalReviewProjection {
  const pending =
    snapshot.packages.filter(
      (item) =>
        item.reviewStatus === "pending",
    );

  const approved =
    snapshot.packages.filter(
      (item) =>
        item.reviewStatus === "approved",
    );

  const rejected =
    snapshot.packages.filter(
      (item) =>
        item.reviewStatus === "rejected",
    );

  const remediationRequired =
    snapshot.packages.filter(
      (item) =>
        item.reviewStatus === "remediation_required",
    );

  const queueSlots =
    canonicalReviewFixtureProjection.reviewQueue.map(
      (slot, index) => {
        const source =
          pending[index] ?? null;

        if (!source) {
          return {
            ...slot,
            id:
              `canonical-review-empty-${index + 1}`,
            capsuleId:
              null,
            title:
              "No additional package awaiting review",
            domain:
              "No pending package",
            authority:
              "—",
            reviewers:
              "—",
            conflict:
              "—",
            readiness:
              0,
            state:
              "No active review",
            tone:
              "amber" as const,
          };
        }

        return {
          ...slot,
          id:
            source.id,
          capsuleId:
            source.id,
          title:
            source.items[0]?.title ??
            source.id,
          domain:
            source.scope ??
            "Scope unavailable",
          authority:
            source.authority ??
            "Authority unavailable",
          reviewers:
            "—",
          conflict:
            "—",
          readiness:
            0,
          state:
            "Awaiting human review",
          tone:
            "amber" as const,
        };
      },
    );

  const focus =
    pending[0] ??
    remediationRequired[0] ??
    approved[0] ??
    rejected[0] ??
    null;

  const authorities =
    canonicalReviewFixtureProjection.authorities.map(
      (slot, index) => {
        if (!focus) {
          return {
            ...slot,
            value:
              "—",
            detail:
              "No persisted review package available.",
          };
        }

        if (index === 0) {
          return {
            ...slot,
            value:
              focus.authority ??
              "—",
            detail:
              "Persisted package authority.",
          };
        }

        if (index === 1) {
          return {
            ...slot,
            value:
              focus.scope ??
              "—",
            detail:
              "Persisted package scope.",
          };
        }

        return {
          ...slot,
          value:
            focus.owner ??
            "—",
          detail:
            "Persisted package owner.",
        };
      },
    );

  const timeline =
    canonicalReviewFixtureProjection.timeline.map(
      (slot, index) => {
        if (!focus) {
          return {
            ...slot,
            id:
              `canonical-review-timeline-empty-${index + 1}`,
            capsuleId:
              "canonical-review-empty",
            label:
              index === 0
                ? "No persisted review state"
                : "—",
            detail:
              "—",
            state:
              "waiting" as const,
          };
        }

        const lifecycle =
          focus.lifecycleHistory[index];

        if (!lifecycle) {
          return {
            ...slot,
            id:
              `${focus.id}-timeline-${index + 1}`,
            capsuleId:
              focus.id,
            label:
              index === 3 &&
              focus.reviewStatus === "pending"
                ? "Human canonical decision pending"
                : "—",
            detail:
              "—",
            state:
              index === 3 &&
              focus.reviewStatus === "pending"
                ? "active" as const
                : "waiting" as const,
          };
        }

        return {
          ...slot,
          id:
            `${focus.id}-${lifecycle.state}-${lifecycle.at}`,
          capsuleId:
            focus.id,
          label:
            lifecycle.state
              .replaceAll("_", " ")
              .replace(/\b\w/g, (character) =>
                character.toUpperCase(),
              ),
          detail:
            lifecycle.reason ??
            new Date(
              lifecycle.at,
            ).toLocaleString(),
          state:
            lifecycle.state ===
            "awaiting_review"
              ? "active" as const
              : "complete" as const,
        };
      },
    );

  return {
    summary: {
      awaitingReview:
        String(
          snapshot.summary.pending,
        ),
      conflicts:
        String(
          snapshot.summary.rejected,
        ),
      reviewersActive:
        "—",
      readyToPublish:
        String(
          snapshot.summary.approved,
        ),
    },

    metrics: {
      reviewQueue:
        String(
          snapshot.summary.pending,
        ),
      requiredReviewers:
        "—",
      pendingDecisions:
        String(
          snapshot.summary.pending,
        ),
      publicationReadiness:
        "—",
      priorityReviews:
        snapshot.summary.pending === 1
          ? "1 priority review"
          : `${snapshot.summary.pending} priority reviews`,
    },

    reviewQueue:
      queueSlots,

    timeline,

    authorities,
  } as const;
}
