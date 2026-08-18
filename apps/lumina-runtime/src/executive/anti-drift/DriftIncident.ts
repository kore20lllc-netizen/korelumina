export type DriftIncidentSeverity =
  | "low"
  | "moderate"
  | "high"
  | "critical";

export type DriftIncidentType =
  | "missing-authority"
  | "missing-evidence"
  | "constitutional-conflict"
  | "architectural-conflict"
  | "runtime-truth-violation"
  | "approval-bypass"
  | "undeclared-exception"
  | "unknown-invariant"
  | "policy-rejection";

export interface DriftIncident {
  id: string;

  proposalId: string;

  type:
    DriftIncidentType;

  severity:
    DriftIncidentSeverity;

  title: string;

  description: string;

  invariantId?: string;

  correction: string;

  detectedBy: string;

  detectedAt: number;
}

export function createDriftIncident(
  input:
    Omit<
      DriftIncident,
      "detectedAt"
    > & {
      detectedAt?: number;
    },
): DriftIncident {
  return Object.freeze({
    ...input,

    detectedAt:
      input.detectedAt ??
      Date.now(),
  });
}
