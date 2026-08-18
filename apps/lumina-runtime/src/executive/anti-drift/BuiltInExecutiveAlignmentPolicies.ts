import {
  createDriftIncident,
  type DriftIncident,
} from "./DriftIncident.js";
import type {
  ExecutiveAlignmentPolicy,
  ExecutiveAlignmentPolicyContext,
} from "./ExecutiveAlignmentPolicy.js";

function incidentId(
  proposalId: string,
  policyId: string,
  discriminator: string,
): string {
  return [
    "drift",
    proposalId,
    policyId,
    discriminator,
  ].join(":");
}

export class KnownInvariantPolicy
  implements ExecutiveAlignmentPolicy
{
  readonly id =
    "known-invariant-policy";

  evaluate(
    context:
      ExecutiveAlignmentPolicyContext,
  ): readonly DriftIncident[] {
    const knownIds =
      new Set(
        context.invariants.map(
          (invariant) =>
            invariant.id,
        ),
      );

    return context.proposal
      .invariantIds
      .filter(
        (invariantId) =>
          !knownIds.has(
            invariantId,
          ),
      )
      .map(
        (invariantId) =>
          createDriftIncident({
            id:
              incidentId(
                context.proposal.id,
                this.id,
                invariantId,
              ),

            proposalId:
              context.proposal.id,

            type:
              "unknown-invariant",

            severity:
              "high",

            title:
              "Unknown executive invariant",

            description:
              `The proposal references invariant "${invariantId}", but no canonical invariant with that identifier exists.`,

            invariantId,

            correction:
              "Resolve the invariant against the canonical executive constitution before proceeding.",

            detectedBy:
              this.id,
          }),
      );
  }
}

export class RequiredAuthorityPolicy
  implements ExecutiveAlignmentPolicy
{
  readonly id =
    "required-authority-policy";

  evaluate(
    context:
      ExecutiveAlignmentPolicyContext,
  ): readonly DriftIncident[] {
    const authorityKinds =
      new Set(
        context.proposal
          .authorityReferences
          .map(
            (reference) =>
              reference.kind,
          ),
      );

    const incidents:
      DriftIncident[] = [];

    for (
      const invariant
      of context.invariants
    ) {
      if (
        !context.proposal
          .invariantIds
          .includes(
            invariant.id,
          )
      ) {
        continue;
      }

      for (
        const requiredKind
        of invariant
          .requiredSourceKinds
      ) {
        if (
          authorityKinds.has(
            requiredKind,
          )
        ) {
          continue;
        }

        incidents.push(
          createDriftIncident({
            id:
              incidentId(
                context.proposal.id,
                this.id,
                `${invariant.id}:${requiredKind}`,
              ),

            proposalId:
              context.proposal.id,

            type:
              "missing-authority",

            severity:
              invariant.severity ===
              "critical"
                ? "critical"
                : invariant.severity ===
                    "required"
                  ? "high"
                  : "moderate",

            title:
              "Required authority is missing",

            description:
              `Invariant "${invariant.title}" requires a "${requiredKind}" authority reference.`,

            invariantId:
              invariant.id,

            correction:
              `Attach a verified "${requiredKind}" authority reference before proceeding.`,

            detectedBy:
              this.id,
          }),
        );
      }
    }

    return incidents;
  }
}

export class EvidenceRequiredPolicy
  implements ExecutiveAlignmentPolicy
{
  readonly id =
    "evidence-required-policy";

  evaluate(
    context:
      ExecutiveAlignmentPolicyContext,
  ): readonly DriftIncident[] {
    if (
      context.proposal
        .evidence.length > 0
    ) {
      return [];
    }

    return [
      createDriftIncident({
        id:
          incidentId(
            context.proposal.id,
            this.id,
            "none",
          ),

        proposalId:
          context.proposal.id,

        type:
          "missing-evidence",

        severity:
          context.proposal.risk ===
            "critical"
            ? "critical"
            : context.proposal.risk ===
                "high"
              ? "high"
              : "moderate",

        title:
          "Executive evidence is missing",

        description:
          "The proposal contains no supporting evidence.",

        correction:
          "Attach verifiable evidence or explicitly classify the proposal as an unverified hypothesis.",

        detectedBy:
          this.id,
      }),
    ];
  }
}

export class HumanApprovalPolicy
  implements ExecutiveAlignmentPolicy
{
  readonly id =
    "human-approval-policy";

  evaluate(
    context:
      ExecutiveAlignmentPolicyContext,
  ): readonly DriftIncident[] {
    if (
      !context.proposal
        .requiresHumanApproval ||
      context.proposal
        .humanApprovalId
    ) {
      return [];
    }

    return [
      createDriftIncident({
        id:
          incidentId(
            context.proposal.id,
            this.id,
            "approval",
          ),

        proposalId:
          context.proposal.id,

        type:
          "approval-bypass",

        severity:
          context.proposal.risk ===
            "critical"
            ? "critical"
            : "high",

        title:
          "Required human approval is missing",

        description:
          "The proposal requires explicit human executive approval but has no approval record.",

        invariantId:
          "human-authority-is-final",

        correction:
          "Obtain and attach explicit human executive approval before dispatch or execution.",

        detectedBy:
          this.id,
      }),
    ];
  }
}

export class ExceptionDeclarationPolicy
  implements ExecutiveAlignmentPolicy
{
  readonly id =
    "exception-declaration-policy";

  evaluate(
    context:
      ExecutiveAlignmentPolicyContext,
  ): readonly DriftIncident[] {
    if (
      context.proposal
        .requestedExceptions
        .length === 0
    ) {
      return [];
    }

    return context.proposal
      .requestedExceptions
      .map(
        (
          exception,
          index,
        ) =>
          createDriftIncident({
            id:
              incidentId(
                context.proposal.id,
                this.id,
                String(index),
              ),

            proposalId:
              context.proposal.id,

            type:
              "undeclared-exception",

            severity:
              "high",

            title:
              "Executive exception requires review",

            description:
              exception,

            correction:
              "Route the requested exception through explicit governance review and human approval.",

            detectedBy:
              this.id,
          }),
      );
  }
}

export function createBuiltInExecutiveAlignmentPolicies():
  readonly ExecutiveAlignmentPolicy[] {
  return Object.freeze([
    new KnownInvariantPolicy(),

    new RequiredAuthorityPolicy(),

    new EvidenceRequiredPolicy(),

    new HumanApprovalPolicy(),

    new ExceptionDeclarationPolicy(),
  ]);
}
