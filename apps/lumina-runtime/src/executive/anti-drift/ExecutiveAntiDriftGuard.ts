import type {
  ExecutiveActionProposal,
} from "./ExecutiveActionProposal.js";
import {
  createExecutiveAlignmentReport,
  type ExecutiveAlignmentReport,
} from "./ExecutiveAlignmentReport.js";
import type {
  ExecutiveAlignmentPolicy,
} from "./ExecutiveAlignmentPolicy.js";
import type {
  ExecutiveInvariant,
} from "./ExecutiveInvariant.js";

export interface ExecutiveAntiDriftGuardDependencies {
  invariants:
    readonly ExecutiveInvariant[];

  policies:
    readonly ExecutiveAlignmentPolicy[];
}

export class ExecutiveAntiDriftGuard {
  private readonly invariantById:
    ReadonlyMap<
      string,
      ExecutiveInvariant
    >;

  constructor(
    private readonly dependencies:
      ExecutiveAntiDriftGuardDependencies,
  ) {
    this.invariantById =
      new Map(
        dependencies.invariants.map(
          (invariant) => [
            invariant.id,
            invariant,
          ],
        ),
      );
  }

  evaluate(
    proposal:
      ExecutiveActionProposal,
  ): ExecutiveAlignmentReport {
    const applicableInvariants =
      proposal.invariantIds
        .map(
          (invariantId) =>
            this.invariantById.get(
              invariantId,
            ),
        )
        .filter(
          (
            invariant,
          ): invariant is ExecutiveInvariant =>
            Boolean(invariant),
        );

    const incidents =
      this.dependencies
        .policies
        .flatMap(
          (policy) =>
            policy.evaluate({
              proposal,

              invariants:
                this.dependencies
                  .invariants,
            }),
        );

    return createExecutiveAlignmentReport({
      id:
        `alignment:${proposal.id}`,

      proposalId:
        proposal.id,

      alignedInvariantIds:
        applicableInvariants
          .map(
            (invariant) =>
              invariant.id,
          )
          .filter(
            (invariantId) =>
              !incidents.some(
                (incident) =>
                  incident.invariantId ===
                  invariantId,
              ),
          ),

      incidents,
    });
  }

  assertAligned(
    proposal:
      ExecutiveActionProposal,
  ): ExecutiveAlignmentReport {
    const report =
      this.evaluate(
        proposal,
      );

    if (
      report.decision ===
      "block"
    ) {
      const summary =
        report.incidents
          .map(
            (incident) =>
              `${incident.title}: ${incident.description}`,
          )
          .join(" | ");

      throw new Error(
        `Executive proposal "${proposal.id}" was blocked by anti-drift governance. ${summary}`,
      );
    }

    return report;
  }

  getInvariants():
    readonly ExecutiveInvariant[] {
    return this.dependencies
      .invariants;
  }
}
