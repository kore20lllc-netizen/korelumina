import type {
  ChiefAgentReasoningInput,
  ChiefAgentReasoningProvider,
  ChiefAgentReasoningResult,
} from "./ChiefAgentReasoningDestinationAdapter.js";

/*
 * KO-5d (ADR-0041 Decision 9): route Chief Agent reasoning to a primary
 * model and escalate to a stronger one when the primary fails, returns
 * unusable output, or reports low confidence.
 *
 * Self-reported confidence is poorly calibrated, so the threshold is
 * configuration, to be tuned on KoreLumina's own test cases. Every result
 * records both attempts so the routing itself becomes training evidence.
 */

export interface ReasoningAttempt {
  role:
    "primary" | "escalation";

  provider:
    string;

  model:
    string | null;

  confidence:
    number | null;

  error:
    string | null;
}

export type EscalationReason =
  | "primary-failed"
  | "low-confidence";

export class EscalatingChiefAgentReasoningProvider
  implements ChiefAgentReasoningProvider
{
  constructor(
    private readonly primary: {
      name:
        string;

      provider:
        ChiefAgentReasoningProvider;
    },

    private readonly escalation: {
      name:
        string;

      provider:
        ChiefAgentReasoningProvider;
    } | null,

    private readonly confidenceThreshold:
      number,
  ) {}

  async reason(
    input:
      ChiefAgentReasoningInput,
  ): Promise<ChiefAgentReasoningResult> {
    const attempts:
      ReasoningAttempt[] = [];

    let primaryResult:
      ChiefAgentReasoningResult | null = null;

    let primaryError:
      string | null = null;

    try {
      primaryResult =
        await this.primary.provider.reason(
          input,
        );

      attempts.push(
        attemptFrom(
          "primary",
          this.primary.name,
          primaryResult,
        ),
      );
    } catch (error) {
      primaryError =
        messageOf(
          error,
        );

      attempts.push({
        role:
          "primary",
        provider:
          this.primary.name,
        model:
          null,
        confidence:
          null,
        error:
          primaryError,
      });
    }

    const escalationReason:
      EscalationReason | null =
      primaryResult ===
        null
        ? "primary-failed"
        : primaryResult.confidence <
            this.confidenceThreshold
          ? "low-confidence"
          : null;

    if (
      escalationReason ===
        null &&
      primaryResult
    ) {
      return withRouting(
        primaryResult,
        {
          escalated:
            false,
          escalationReason:
            null,
          confidenceThreshold:
            this.confidenceThreshold,
          attempts,
        },
      );
    }

    if (!this.escalation) {
      if (primaryResult) {
        /*
         * No stronger model is configured: the low-confidence answer is
         * returned, marked so a human sees it was not escalated.
         */
        return withRouting(
          primaryResult,
          {
            escalated:
              false,
            escalationReason,
            escalationAvailable:
              false,
            confidenceThreshold:
              this.confidenceThreshold,
            attempts,
          },
        );
      }

      throw new Error(
        primaryError ??
          "chief_agent_reasoning_failed",
      );
    }

    try {
      const escalated =
        await this.escalation.provider.reason(
          input,
        );

      attempts.push(
        attemptFrom(
          "escalation",
          this.escalation.name,
          escalated,
        ),
      );

      return withRouting(
        escalated,
        {
          escalated:
            true,
          escalationReason,
          confidenceThreshold:
            this.confidenceThreshold,
          attempts,
        },
      );
    } catch (error) {
      attempts.push({
        role:
          "escalation",
        provider:
          this.escalation.name,
        model:
          null,
        confidence:
          null,
        error:
          messageOf(
            error,
          ),
      });

      if (primaryResult) {
        return withRouting(
          primaryResult,
          {
            escalated:
              false,
            escalationReason,
            escalationFailed:
              true,
            confidenceThreshold:
              this.confidenceThreshold,
            attempts,
          },
        );
      }

      throw new Error(
        `chief_agent_reasoning_failed: primary=${primaryError}; escalation=${messageOf(error)}`,
      );
    }
  }
}

function messageOf(
  error:
    unknown,
): string {
  return error instanceof Error
    ? error.message
    : String(error);
}

function attemptFrom(
  role:
    ReasoningAttempt["role"],
  provider:
    string,
  result:
    ChiefAgentReasoningResult,
): ReasoningAttempt {
  const model =
    result.metadata?.model;

  return {
    role,
    provider,
    model:
      typeof model ===
        "string"
        ? model
        : null,
    confidence:
      result.confidence,
    error:
      null,
  };
}

function withRouting(
  result:
    ChiefAgentReasoningResult,
  routing:
    Record<string, unknown>,
): ChiefAgentReasoningResult {
  return {
    ...result,
    metadata: {
      ...(result.metadata ?? {}),
      routing,
    },
  };
}
