import {
  ExecutiveDestinationRefusal,
} from "../orchestrator/ExecutiveDispatcher.js";

/*
 * ADR-0041 Decision 3 (KO-5b): the single answer to "may the Chief Agent
 * act operationally now?".
 *
 * Fail-closed: anything other than an ACTIVE activation record, read
 * successfully, refuses operation. Activation records are introduced by
 * KO-5c; until then the record source reports none and the gate answers
 * NOT_ACTIVATED.
 */

export type ChiefAgentActivationState =
  | "ACTIVE"
  | "NOT_ACTIVATED"
  | "SUSPENDED"
  | "REVOKED"
  | "UNAVAILABLE";

export const CHIEF_AGENT_NOT_ACTIVATED_ERROR =
  "chief_agent_not_activated" as const;

export interface ChiefAgentActivationRecordView {
  activationId:
    string;

  state:
    "ACTIVE" | "SUSPENDED" | "REVOKED";

  autonomyLevel:
    string;
}

export interface ChiefAgentActivationRecordSource {
  latest():
    ChiefAgentActivationRecordView | null;
}

export interface ChiefAgentActivationPrerequisite {
  gate:
    string;

  state:
    string;
}

export type ChiefAgentActivationPrerequisiteReader =
  () => readonly ChiefAgentActivationPrerequisite[];

export interface ChiefAgentActivationDecision {
  state:
    ChiefAgentActivationState;

  active:
    boolean;

  reason:
    string;

  activationId:
    string | null;

  autonomyLevel:
    string | null;

  checkedAt:
    number;
}

/*
 * Until KO-5c persists activation records, no record exists.
 */
export const noChiefAgentActivationRecords:
  ChiefAgentActivationRecordSource =
  {
    latest: () =>
      null,
  };

export class ChiefAgentActivationGate {
  constructor(
    private readonly records:
      ChiefAgentActivationRecordSource,

    private readonly prerequisites:
      ChiefAgentActivationPrerequisiteReader =
      () => [],

    private readonly now:
      () => number =
      () => Date.now(),
  ) {}

  evaluate():
    ChiefAgentActivationDecision {
    const checkedAt =
      this.now();

    let record:
      ChiefAgentActivationRecordView | null;

    try {
      record =
        this.records.latest();
    } catch {
      return {
        state:
          "UNAVAILABLE",
        active:
          false,
        reason:
          "Activation state could not be read; the gate refuses until it can.",
        activationId:
          null,
        autonomyLevel:
          null,
        checkedAt,
      };
    }

    if (!record) {
      return {
        state:
          "NOT_ACTIVATED",
        active:
          false,
        reason:
          "No activation has been recorded by the Activation Authority (ADR-0041).",
        activationId:
          null,
        autonomyLevel:
          null,
        checkedAt,
      };
    }

    if (
      record.state !==
      "ACTIVE"
    ) {
      return {
        state:
          record.state,
        active:
          false,
        reason:
          record.state ===
            "SUSPENDED"
            ? "The latest activation record is suspended."
            : "The latest activation record is revoked.",
        activationId:
          record.activationId,
        autonomyLevel:
          record.autonomyLevel,
        checkedAt,
      };
    }

    return {
      state:
        "ACTIVE",
      active:
        true,
      reason:
        "The latest activation record is active.",
      activationId:
        record.activationId,
      autonomyLevel:
        record.autonomyLevel,
      checkedAt,
    };
  }

  /*
   * Prerequisites are reported for information only. They never make the
   * gate ACTIVE; only an activation record does (ADR-0041 Decision 6:
   * drift after activation does not suspend).
   */
  status():
    ChiefAgentActivationDecision & {
      prerequisites:
        readonly ChiefAgentActivationPrerequisite[];
    } {
    let prerequisites:
      readonly ChiefAgentActivationPrerequisite[];

    try {
      prerequisites =
        this.prerequisites();
    } catch {
      prerequisites = [
        {
          gate:
            "prerequisites",
          state:
            "UNAVAILABLE",
        },
      ];
    }

    return {
      ...this.evaluate(),
      prerequisites,
    };
  }
}

/*
 * Wraps a Chief Agent executive handler so it runs only while the gate is
 * ACTIVE. A refusal throws before the handler runs: no model call is made
 * and no decision is created. The dispatcher records it as a "refused"
 * destination; the event still completes and stays on record.
 */
export function requireActiveChiefAgent<C>(
  gate:
    ChiefAgentActivationGate,

  handler:
    (context: C) => void | Promise<void>,
): (context: C) => Promise<void> {
  return async (
    context: C,
  ) => {
    const decision =
      gate.evaluate();

    if (!decision.active) {
      throw new ExecutiveDestinationRefusal(
        CHIEF_AGENT_NOT_ACTIVATED_ERROR,
      );
    }

    await handler(
      context,
    );
  };
}
