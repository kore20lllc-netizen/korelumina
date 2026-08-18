import type {
  DriftIncident,
} from "./DriftIncident.js";

export type ExecutiveAlignmentDecision =
  | "allow"
  | "allow-with-review"
  | "block";

export interface ExecutiveAlignmentReport {
  id: string;

  proposalId: string;

  decision:
    ExecutiveAlignmentDecision;

  score: number;

  alignedInvariantIds:
    readonly string[];

  incidents:
    readonly DriftIncident[];

  evaluatedAt: number;
}

export function createExecutiveAlignmentReport(
  input: {
    id: string;

    proposalId: string;

    alignedInvariantIds:
      readonly string[];

    incidents:
      readonly DriftIncident[];

    evaluatedAt?: number;
  },
): ExecutiveAlignmentReport {
  const criticalOrHigh =
    input.incidents.some(
      (incident) =>
        incident.severity ===
          "critical" ||
        incident.severity ===
          "high",
    );

  const decision:
    ExecutiveAlignmentDecision =
      criticalOrHigh
        ? "block"
        : input.incidents.length > 0
          ? "allow-with-review"
          : "allow";

  const penalty =
    input.incidents.reduce(
      (total, incident) => {
        switch (
          incident.severity
        ) {
          case "critical":
            return total + 50;

          case "high":
            return total + 30;

          case "moderate":
            return total + 15;

          case "low":
            return total + 5;
        }
      },
      0,
    );

  return Object.freeze({
    id:
      input.id,

    proposalId:
      input.proposalId,

    decision,

    score:
      Math.max(
        0,
        100 - penalty,
      ),

    alignedInvariantIds:
      Object.freeze([
        ...new Set(
          input.alignedInvariantIds,
        ),
      ]),

    incidents:
      Object.freeze([
        ...input.incidents,
      ]),

    evaluatedAt:
      input.evaluatedAt ??
      Date.now(),
  });
}
