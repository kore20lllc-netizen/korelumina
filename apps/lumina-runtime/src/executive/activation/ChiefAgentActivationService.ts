import {
  CHIEF_AGENT_AUTONOMY_LEVELS,
  createChiefAgentActivationRecord,
  type ChiefAgentActivationAction,
  type ChiefAgentActivationBindings,
  type ChiefAgentActivationRecord,
  type ChiefAgentAutonomyLevel,
} from "./ChiefAgentActivationRecord.js";

import type {
  ChiefAgentActivationPrerequisite,
  ChiefAgentActivationPrerequisiteReader,
} from "./ChiefAgentActivationGate.js";

import type {
  FileChiefAgentActivationStore,
} from "./ChiefAgentActivationPersistence.js";

/*
 * ADR-0041 Decisions 1, 2, 4 and 7 (KO-5c): the Activation Authority's
 * decisions. Every decision previews unless explicitly confirmed, and is
 * refused with plain reasons when its rules are not met.
 */

export const REQUIRED_ACTIVATION_PREREQUISITES =
  [
    "day-zero-certification",
    "educational-corpus-certification",
    "initial-competency-certification",
    "initial-competency-human-acceptance",
    "production-workspace-authorization",
  ] as const;

export interface ChiefAgentActivationDecisionRequest {
  action:
    unknown;

  decidedBy:
    unknown;

  reason:
    unknown;

  autonomyLevel?:
    unknown;

  confirm?:
    unknown;
}

export type ChiefAgentActivationDecisionOutcome =
  | {
      outcome:
        "PREVIEW";

      record:
        ChiefAgentActivationRecord;
    }
  | {
      outcome:
        "RECORDED";

      record:
        ChiefAgentActivationRecord;
    }
  | {
      outcome:
        "REFUSED";

      reasons:
        string[];
    };

const ACTIONS:
  readonly ChiefAgentActivationAction[] =
  [
    "ACTIVATE",
    "SUSPEND",
    "RESUME",
    "REVOKE",
  ];

export function isAgentActor(
  actorId:
    string,
): boolean {
  const normalized =
    actorId
      .trim()
      .toLowerCase();

  return (
    normalized === "chief-agent" ||
    normalized.startsWith("agent:") ||
    normalized.endsWith("-agent")
  );
}

function prerequisiteById(
  prerequisites:
    readonly ChiefAgentActivationPrerequisite[],
  gate:
    string,
): ChiefAgentActivationPrerequisite | undefined {
  return prerequisites.find(
    (prerequisite) =>
      prerequisite.gate ===
      gate,
  );
}

export class ChiefAgentActivationService {
  constructor(
    private readonly store:
      FileChiefAgentActivationStore,

    private readonly prerequisites:
      ChiefAgentActivationPrerequisiteReader,

    private readonly now:
      () => number =
      () => Date.now(),
  ) {}

  history():
    ChiefAgentActivationRecord[] {
    return this.store.list();
  }

  decide(
    request:
      ChiefAgentActivationDecisionRequest,
  ): ChiefAgentActivationDecisionOutcome {
    const reasons:
      string[] = [];

    const action =
      typeof request.action ===
        "string"
        ? request.action
            .trim()
            .toUpperCase()
        : "";

    const decidedBy =
      typeof request.decidedBy ===
        "string"
        ? request.decidedBy.trim()
        : "";

    const reason =
      typeof request.reason ===
        "string"
        ? request.reason.trim()
        : "";

    if (
      !ACTIONS.includes(
        action as ChiefAgentActivationAction,
      )
    ) {
      reasons.push(
        "action-must-be-ACTIVATE-SUSPEND-RESUME-or-REVOKE",
      );
    }

    if (!decidedBy) {
      reasons.push(
        "decided-by-required",
      );
    } else if (
      isAgentActor(
        decidedBy,
      )
    ) {
      reasons.push(
        "activation-decisions-require-a-human-actor",
      );
    }

    if (
      reason.length <
      10
    ) {
      reasons.push(
        "reason-required",
      );
    }

    if (
      reasons.length >
      0
    ) {
      return {
        outcome:
          "REFUSED",
        reasons,
      };
    }

    const typedAction =
      action as ChiefAgentActivationAction;

    const latest =
      this.store.latestRecord();

    /*
     * Certification reads are expensive (each rebuilds its candidate).
     * Only ACTIVATE and RESUME need them; SUSPEND and REVOKE must stay
     * instant, because suspension is the owner's emergency stop.
     */
    const prerequisites =
      typedAction ===
        "ACTIVATE" ||
      typedAction ===
        "RESUME"
        ? this.prerequisites()
        : [];

    let autonomyLevel:
      ChiefAgentAutonomyLevel;

    let bindings:
      ChiefAgentActivationBindings;

    switch (typedAction) {
      case "ACTIVATE": {
        if (
          latest &&
          latest.state !==
            "REVOKED"
        ) {
          reasons.push(
            `already-${latest.state.toLowerCase()}`,
          );
        }

        const requested =
          request.autonomyLevel ??
          "PROPOSE_ONLY";

        if (
          !CHIEF_AGENT_AUTONOMY_LEVELS.includes(
            requested as ChiefAgentAutonomyLevel,
          )
        ) {
          reasons.push(
            "autonomy-level-must-be-PROPOSE_ONLY",
          );
        }

        for (
          const gate
          of REQUIRED_ACTIVATION_PREREQUISITES
        ) {
          const prerequisite =
            prerequisiteById(
              prerequisites,
              gate,
            );

          if (
            !prerequisite ||
            prerequisite.state !==
              "VALID" ||
            !prerequisite.id
          ) {
            reasons.push(
              `${gate}-must-be-valid`,
            );
          }
        }

        if (
          reasons.length >
          0
        ) {
          return {
            outcome:
              "REFUSED",
            reasons,
          };
        }

        autonomyLevel =
          requested as ChiefAgentAutonomyLevel;

        bindings = {
          dayZeroCertificationId:
            prerequisiteById(prerequisites, "day-zero-certification")!.id!,
          educationalCorpusCertificationId:
            prerequisiteById(prerequisites, "educational-corpus-certification")!.id!,
          initialCompetencyCertificationId:
            prerequisiteById(prerequisites, "initial-competency-certification")!.id!,
          initialCompetencyHumanAcceptanceId:
            prerequisiteById(prerequisites, "initial-competency-human-acceptance")!.id!,
          productionWorkspaceAuthorizationId:
            prerequisiteById(prerequisites, "production-workspace-authorization")!.id!,
        };

        break;
      }

      case "SUSPEND":
      case "RESUME":
      case "REVOKE": {
        const allowedFrom =
          typedAction ===
            "SUSPEND"
            ? ["ACTIVE"]
            : typedAction ===
                "RESUME"
              ? ["SUSPENDED"]
              : ["ACTIVE", "SUSPENDED"];

        if (
          !latest ||
          !allowedFrom.includes(
            latest.state,
          )
        ) {
          reasons.push(
            `${typedAction.toLowerCase()}-requires-${allowedFrom.join("-or-").toLowerCase()}-activation`,
          );
        }

        /*
         * Resume tolerates curriculum drift (ADR-0041 Decision 6) but not
         * invalidation: a blocked or unreadable prerequisite refuses it.
         */
        if (
          typedAction ===
          "RESUME"
        ) {
          for (
            const gate
            of REQUIRED_ACTIVATION_PREREQUISITES
          ) {
            const prerequisite =
              prerequisiteById(
                prerequisites,
                gate,
              );

            if (
              !prerequisite ||
              prerequisite.state ===
                "BLOCKED" ||
              prerequisite.state ===
                "UNAVAILABLE"
            ) {
              reasons.push(
                `${gate}-is-not-usable`,
              );
            }
          }
        }

        if (
          reasons.length >
            0 ||
          !latest
        ) {
          return {
            outcome:
              "REFUSED",
            reasons,
          };
        }

        autonomyLevel =
          latest.autonomyLevel;

        bindings =
          latest.bindings;

        break;
      }
    }

    const record =
      createChiefAgentActivationRecord({
        sequence:
          (latest?.sequence ?? 0) + 1,

        previousRecordId:
          latest?.recordId ?? null,

        activationId:
          typedAction ===
            "ACTIVATE"
            ? null
            : latest?.activationId ?? null,

        action:
          typedAction,

        autonomyLevel,

        bindings,

        decidedBy,

        decidedAt:
          this.now(),

        reason,
      });

    if (
      request.confirm !==
      true
    ) {
      return {
        outcome:
          "PREVIEW",
        record,
      };
    }

    this.store.append(
      record,
    );

    return {
      outcome:
        "RECORDED",
      record,
    };
  }
}
