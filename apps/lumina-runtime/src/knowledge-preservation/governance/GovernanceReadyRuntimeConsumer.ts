import type {
  KnowledgePackage,
} from "../package/index.js";

import {
  KnowledgePackageService,
} from "../package/index.js";

import type {
  CanonicalReviewPolicyAuthority,
} from "../review/index.js";

import {
  listCanonicalReviewPolicies,
} from "../review/index.js";

import type {
  GovernanceReadySignal,
  GovernanceReadySignalPublisher,
} from "./GovernanceReadySignal.js";

import type {
  AutonomousGovernanceCycleInput,
  AutonomousGovernanceCycleResult,
} from "./AutonomousGovernanceCycleOrchestrator.js";

import {
  AutonomousGovernanceCycleOrchestrator,
} from "./AutonomousGovernanceCycleOrchestrator.js";

export type GovernanceReadyConsumptionDisposition =
  | "executed"
  | "no_policy"
  | "individual_review"
  | "stale_signal"
  | "not_ready"
  | "exception";

export interface GovernanceReadyConsumptionResult {
  signal:
    GovernanceReadySignal;

  disposition:
    GovernanceReadyConsumptionDisposition;

  policyId?:
    string;

  policyVersion?:
    string;

  cycle?:
    AutonomousGovernanceCycleResult;

  reason?:
    string;
}

export interface GovernanceReadyPackageReader {
  get(
    packageId:
      string,
  ):
    KnowledgePackage |
    undefined;
}

export interface GovernanceReadyPolicyReader {
  list():
    CanonicalReviewPolicyAuthority[];
}

export interface GovernanceReadyCyclePort {
  execute(
    input:
      AutonomousGovernanceCycleInput,
  ):
    AutonomousGovernanceCycleResult;
}

const persistedPolicyReader:
  GovernanceReadyPolicyReader = {
    list:
      () =>
        listCanonicalReviewPolicies(),
  };

function matchingActivePolicies(
  knowledgePackage:
    KnowledgePackage,

  policies:
    CanonicalReviewPolicyAuthority[],
):
  CanonicalReviewPolicyAuthority[] {
  return policies
    .filter(
      (policy) =>
        policy.status ===
          "active" &&
        policy.authority ===
          knowledgePackage.authority &&
        policy.scope ===
          knowledgePackage.scope &&
        !policy.rules
          .excludedAuthorities
          .includes(
            knowledgePackage.authority ??
              "",
          ),
    )
    .sort(
      (
        left,
        right,
      ) => {
        const idOrder =
          left.id.localeCompare(
            right.id,
          );

        if (
          idOrder !==
          0
        ) {
          return idOrder;
        }

        return left.version
          .localeCompare(
            right.version,
          );
      },
    );
}

export class GovernanceReadyRuntimeConsumer
implements GovernanceReadySignalPublisher {
  private readonly results:
    GovernanceReadyConsumptionResult[] =
      [];

  constructor(
    private readonly packageReader:
      GovernanceReadyPackageReader =
        new KnowledgePackageService(),

    private readonly policyReader:
      GovernanceReadyPolicyReader =
        persistedPolicyReader,

    private readonly cycle:
      GovernanceReadyCyclePort =
        new AutonomousGovernanceCycleOrchestrator(),

    private readonly actorId:
      string =
        "runtime:autonomous-governance",
  ) {}

  publish(
    signal:
      GovernanceReadySignal,
  ): void {
    this.results.push(
      this.consume(
        signal,
      ),
    );
  }

  consume(
    signal:
      GovernanceReadySignal,
  ):
    GovernanceReadyConsumptionResult {
    const knowledgePackage =
      this.packageReader.get(
        signal.packageId,
      );

    if (
      !knowledgePackage
    ) {
      return {
        signal,

        disposition:
          "exception",

        reason:
          "governance_ready_package_not_found",
      };
    }

    if (
      knowledgePackage.version !==
        signal.packageVersion
    ) {
      return {
        signal,

        disposition:
          "stale_signal",

        reason:
          "governance_ready_package_version_mismatch",
      };
    }

    if (
      knowledgePackage.state !==
        "awaiting_review" ||
      knowledgePackage
        .approvalState !==
        "pending_review"
    ) {
      return {
        signal,

        disposition:
          "not_ready",

        reason:
          "governance_ready_package_not_awaiting_review",
      };
    }

    if (
      knowledgePackage.authority ===
        "constitutional"
    ) {
      return {
        signal,

        disposition:
          "individual_review",

        reason:
          "constitutional_authority_requires_individual_review",
      };
    }

    if (
      !knowledgePackage.authority ||
      !knowledgePackage.scope
    ) {
      return {
        signal,

        disposition:
          "exception",

        reason:
          "governance_ready_governance_identity_incomplete",
      };
    }

    const matches =
      matchingActivePolicies(
        knowledgePackage,
        this.policyReader.list(),
      );

    if (
      matches.length ===
        0
    ) {
      return {
        signal,

        disposition:
          "no_policy",

        reason:
          "governance_ready_no_active_policy",
      };
    }

    if (
      matches.length >
        1
    ) {
      return {
        signal,

        disposition:
          "exception",

        reason:
          [
            "governance_ready_ambiguous_active_policy",
            ...matches.map(
              (policy) =>
                `${policy.id}@${policy.version}`,
            ),
          ].join(
            ":",
          ),
      };
    }

    const policy =
      matches[0];

    if (!policy) {
      throw new Error(
        "governance_ready_policy_resolution_invariant_failed",
      );
    }

    try {
      const cycle =
        this.cycle.execute({
          policyId:
            policy.id,

          policyVersion:
            policy.version,

          actorId:
            this.actorId,

          executedAt:
            signal.emittedAt,
        });

      return {
        signal,

        disposition:
          "executed",

        policyId:
          policy.id,

        policyVersion:
          policy.version,

        cycle,
      };
    } catch (
      error
    ) {
      return {
        signal,

        disposition:
          "exception",

        policyId:
          policy.id,

        policyVersion:
          policy.version,

        reason:
          error instanceof
            Error
            ? error.message
            : String(
                error,
              ),
      };
    }
  }

  listResults():
    readonly GovernanceReadyConsumptionResult[] {
    return [
      ...this.results,
    ];
  }
}
