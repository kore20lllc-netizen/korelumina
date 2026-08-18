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
  reviewMode:
    | "individual"
    | "batch_candidate"
    | "policy_candidate"
    | "blocked"
    | null;

  policyId:
    string | null;
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
      reviewMode: null,
      policyId: null,
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
      reviewMode: null,
      policyId: null,
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
      reviewMode: null,
      policyId: null,
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

function pendingReviewState(
  source:
    CanonicalReviewSnapshot["packages"][number],
): string {
  switch (
    source.reviewClassification
      ?.mode
  ) {
    case "individual":
      return "Individual human review";

    case "batch_candidate":
      return "Eligible for governed batch review";

    case "policy_candidate":
      return "Eligible for policy-governed review";

    case "blocked":
      return "Review blocked";

    default:
      return "Awaiting human review";
  }
}

export function createCanonicalReviewProjection(
  snapshot: CanonicalReviewSnapshot,
): CanonicalReviewProjection {
  const pending =
    snapshot.packages.filter(
      (item) =>
        item.reviewStatus ===
        "pending",
    );

  const approved =
    snapshot.packages.filter(
      (item) =>
        item.reviewStatus ===
        "approved",
    );

  const rejected =
    snapshot.packages.filter(
      (item) =>
        item.reviewStatus ===
        "rejected",
    );

  const remediationRequired =
    snapshot.packages.filter(
      (item) =>
        item.reviewStatus ===
        "remediation_required",
    );

  const reviewQueue =
    snapshot.packages.map(
      (source):
        CanonicalReviewQueueSlot => {
        const state =
          source.reviewStatus ===
          "pending"
            ? pendingReviewState(
                source,
              )
            : source.reviewStatus ===
                "approved"
              ? "Approved for canonical promotion"
              : source.reviewStatus ===
                  "rejected"
                ? "Rejected"
                : "Remediation required";

        const tone =
          source.reviewStatus ===
          "approved"
            ? "emerald"
            : source.reviewStatus ===
                "rejected"
              ? "rose"
              : "amber";

        return {
          id:
            source.id,

          capsuleId:
            source.id,

          title:
            source.items[0]
              ?.title ??
            source.id,

          domain:
            source.scope ??
            "Scope unavailable",

          authority:
            source.authority ??
            "Authority unavailable",

          reviewers: (() => {
            const reviewHistory =
              source.metadata
                .reviewHistory ??
              [];

            return reviewHistory.length > 0
              ? `${reviewHistory.length} recorded decision${reviewHistory.length === 1 ? "" : "s"}`
              : "Human decision pending";
          })(),

          conflict:
            source.reviewStatus ===
            "rejected"
              ? "Review rejected"
              : source.reviewStatus ===
                  "remediation_required"
                ? "Remediation required"
                : "No recorded review conflict",

          /*
           * Readiness is not yet a governed backend measurement.
           * Keep the numeric field neutral rather than inventing
           * a publication-readiness percentage.
           */
          readiness:
            0,

          state,

          tone,

          reviewMode:
            source.reviewClassification
              ?.mode ??
            null,

          policyId:
            source.reviewClassification
              ?.policyId ??
            null,
        };
      },
    );

  const focus =
    pending[0] ??
    remediationRequired[0] ??
    approved[0] ??
    rejected[0] ??
    null;

  const authorities:
    CanonicalReviewAuthoritySlot[] =
    focus
      ? [
          {
            title:
              "Constitutional authority",

            value:
              focus.authority ??
              "—",

            detail:
              "Persisted Knowledge Package authority.",
          },
          {
            title:
              "Domain scope",

            value:
              focus.scope ??
              "—",

            detail:
              "Persisted Knowledge Package scope.",
          },
          {
            title:
              "Knowledge owner",

            value:
              focus.owner ??
              "—",

            detail:
              "Persisted Knowledge Package owner.",
          },
        ]
      : [
          {
            title:
              "Constitutional authority",

            value:
              "—",

            detail:
              "No persisted review package available.",
          },
          {
            title:
              "Domain scope",

            value:
              "—",

            detail:
              "No persisted review package available.",
          },
          {
            title:
              "Knowledge owner",

            value:
              "—",

            detail:
              "No persisted review package available.",
          },
        ];

  const timeline:
    CanonicalReviewTimelineSlot[] =
    focus
      ? [
          ...focus.lifecycleHistory.map(
            (
              lifecycle,
            ):
              CanonicalReviewTimelineSlot => ({
                id:
                  `${focus.id}-${lifecycle.state}-${lifecycle.at}`,

                capsuleId:
                  focus.id,

                label:
                  lifecycle.state
                    .replaceAll(
                      "_",
                      " ",
                    )
                    .replace(
                      /\b\w/g,
                      (
                        character,
                      ) =>
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
                    ? "active"
                    : "complete",
              }),
          ),

          ...(
            focus.reviewStatus ===
            "pending"
              ? [
                  {
                    id:
                      `${focus.id}-human-decision-pending`,

                    capsuleId:
                      focus.id,

                    label:
                      "Human canonical decision pending",

                    detail:
                      "Explicit review approval is required before canonical promotion.",

                    state:
                      "active" as const,
                  },
                ]
              : []
          ),
        ]
      : [];

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
          snapshot.summary.total,
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
        snapshot.summary.pending ===
        1
          ? "1 priority review"
          : `${snapshot.summary.pending} priority reviews`,
    },

    reviewQueue,

    timeline,

    authorities,
  };
}
