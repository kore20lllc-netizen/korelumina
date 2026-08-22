import type {
  KnowledgePackage,
} from "../package/index.js";

import {
  KnowledgePackageService,
} from "../package/index.js";

import type {
  BindCanonicalReviewPolicyResult,
  CanonicalReviewPolicyExecutionResult,
} from "../review/index.js";

import {
  CanonicalReviewPolicyBindingService,
  CanonicalReviewPolicyExecutionService,
  loadCanonicalReviewPolicy,
} from "../review/index.js";

import type {
  AutonomousGovernedCanonicalPromotionResult,
} from "../promotion/index.js";

import {
  AutonomousGovernedCanonicalPromotionExecutor,
} from "../promotion/index.js";

export interface AutonomousGovernanceCycleInput {
  policyId:
    string;

  policyVersion:
    string;

  actorId:
    string;

  executedAt?:
    number;
}

export type GovernanceBindingDisposition =
  | "bound"
  | "already_bound"
  | "not_applicable"
  | "exception";

export interface AutonomousGovernanceBindingResult {
  packageId:
    string;

  packageVersion:
    string | null;

  disposition:
    GovernanceBindingDisposition;

  reason?:
    string;
}

export interface AutonomousGovernanceCycleResult {
  policyId:
    string;

  policyVersion:
    string;

  actorId:
    string;

  executedAt:
    number;

  discovered:
    number;

  binding: {
    attempted:
      number;

    bound:
      number;

    alreadyBound:
      number;

    notApplicable:
      number;

    exceptions:
      number;

    packages:
      AutonomousGovernanceBindingResult[];
  };

  review:
    CanonicalReviewPolicyExecutionResult;

  promotion:
    AutonomousGovernedCanonicalPromotionResult;
}

export interface KnowledgePackageReaderPort {
  list():
    KnowledgePackage[];
}

export interface CanonicalReviewPolicyBindingPort {
  bind(
    input: {
      packageId:
        string;

      policyId:
        string;

      policyVersion:
        string;

      boundBy:
        string;

      boundAt?:
        number;
    },
  ):
    BindCanonicalReviewPolicyResult;
}

export interface CanonicalReviewPolicyExecutionPort {
  execute(
    input: {
      policyId:
        string;

      policyVersion:
        string;

      actorId:
        string;

      executedAt?:
        number;
    },
  ):
    CanonicalReviewPolicyExecutionResult;
}

export interface AutonomousPromotionPort {
  execute(
    input: {
      policyId:
        string;

      policyVersion:
        string;

      actorId:
        string;

      executedAt?:
        number;
    },
  ):
    AutonomousGovernedCanonicalPromotionResult;
}

function required(
  value:
    string,

  field:
    string,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `autonomous_governance_cycle_${field}_required`,
    );
  }

  return normalized;
}

function existingPolicyReference(
  knowledgePackage:
    KnowledgePackage,
): {
  policyId:
    string;

  policyVersion:
    string;
} | null {
  const raw =
    knowledgePackage
      .metadata
      .canonicalReviewPolicy;

  if (
    typeof raw !==
      "object" ||
    raw ===
      null
  ) {
    return null;
  }

  const value =
    raw as Record<
      string,
      unknown
    >;

  if (
    typeof value.policyId !==
      "string" ||
    typeof value.policyVersion !==
      "string"
  ) {
    return null;
  }

  return {
    policyId:
      value.policyId,

    policyVersion:
      value.policyVersion,
  };
}

function isReviewCandidate(
  knowledgePackage:
    KnowledgePackage,
): boolean {
  return (
    knowledgePackage.state ===
      "awaiting_review" &&
    knowledgePackage
      .approvalState ===
      "pending_review"
  );
}

export class AutonomousGovernanceCycleOrchestrator {
  constructor(
    private readonly packageReader:
      KnowledgePackageReaderPort =
        new KnowledgePackageService(),

    private readonly bindingService:
      CanonicalReviewPolicyBindingPort =
        new CanonicalReviewPolicyBindingService(),

    private readonly policyExecutionService:
      CanonicalReviewPolicyExecutionPort =
        new CanonicalReviewPolicyExecutionService(),

    private readonly promotionExecutor:
      AutonomousPromotionPort =
        new AutonomousGovernedCanonicalPromotionExecutor(),
  ) {}

  execute(
    input:
      AutonomousGovernanceCycleInput,
  ):
    AutonomousGovernanceCycleResult {
    const policyId =
      required(
        input.policyId,
        "policy_id",
      );

    const policyVersion =
      required(
        input.policyVersion,
        "policy_version",
      );

    const actorId =
      required(
        input.actorId,
        "actor_id",
      );

    const executedAt =
      input.executedAt ??
      Date.now();

    const policy =
      loadCanonicalReviewPolicy(
        policyId,
        policyVersion,
      );

    if (!policy) {
      throw new Error(
        `autonomous_governance_cycle_policy_not_found:${policyId}@${policyVersion}`,
      );
    }

    if (
      policy.status !==
        "active"
    ) {
      throw new Error(
        `autonomous_governance_cycle_policy_not_active:${policy.status}`,
      );
    }

    const discovered =
      this.packageReader
        .list()
        .filter(
          isReviewCandidate,
        )
        .sort(
          (
            left,
            right,
          ) =>
            left.id
              .localeCompare(
                right.id,
              ),
        );

    const bindingResults:
      AutonomousGovernanceBindingResult[] =
        [];

    for (
      const knowledgePackage
      of discovered
    ) {
      const base = {
        packageId:
          knowledgePackage.id,

        packageVersion:
          knowledgePackage.version,
      };

      if (
        knowledgePackage
          .authority ===
          "constitutional"
      ) {
        bindingResults.push({
          ...base,

          disposition:
            "not_applicable",

          reason:
            "constitutional_authority_requires_individual_review",
        });

        continue;
      }

      const existing =
        existingPolicyReference(
          knowledgePackage,
        );

      if (
        existing &&
        (
          existing.policyId !==
            policyId ||
          existing.policyVersion !==
            policyVersion
        )
      ) {
        bindingResults.push({
          ...base,

          disposition:
            "not_applicable",

          reason:
            `package_bound_to_other_policy:${existing.policyId}@${existing.policyVersion}`,
        });

        continue;
      }

      if (
        knowledgePackage
          .authority !==
          policy.authority ||
        knowledgePackage
          .scope !==
          policy.scope
      ) {
        bindingResults.push({
          ...base,

          disposition:
            "not_applicable",

          reason:
            "policy_authority_or_scope_mismatch",
        });

        continue;
      }

      try {
        const bound =
          this.bindingService
            .bind({
              packageId:
                knowledgePackage.id,

              policyId,
              policyVersion,

              boundBy:
                actorId,

              boundAt:
                executedAt,
            });

        bindingResults.push({
          ...base,

          disposition:
            bound.disposition,
        });
      } catch (
        error
      ) {
        bindingResults.push({
          ...base,

          disposition:
            "exception",

          reason:
            error instanceof
              Error
              ? error.message
              : String(
                  error,
                ),
        });
      }
    }

    /*
     * Review owns approval authority.
     * The orchestrator supplies only mechanical execution identity.
     */
    const review =
      this.policyExecutionService
        .execute({
          policyId,
          policyVersion,
          actorId,
          executedAt,
        });

    /*
     * Promotion owns canonicalization and lineage.
     * No canonical record construction belongs here.
     */
    const promotion =
      this.promotionExecutor
        .execute({
          policyId,
          policyVersion,
          actorId,
          executedAt,
        });

    return {
      policyId,
      policyVersion,
      actorId,
      executedAt,

      discovered:
        discovered.length,

      binding: {
        attempted:
          bindingResults
            .filter(
              (item) =>
                item.disposition ===
                  "bound" ||
                item.disposition ===
                  "already_bound" ||
                item.disposition ===
                  "exception",
            )
            .length,

        bound:
          bindingResults
            .filter(
              (item) =>
                item.disposition ===
                  "bound",
            )
            .length,

        alreadyBound:
          bindingResults
            .filter(
              (item) =>
                item.disposition ===
                  "already_bound",
            )
            .length,

        notApplicable:
          bindingResults
            .filter(
              (item) =>
                item.disposition ===
                  "not_applicable",
            )
            .length,

        exceptions:
          bindingResults
            .filter(
              (item) =>
                item.disposition ===
                  "exception",
            )
            .length,

        packages:
          bindingResults,
      },

      review,
      promotion,
    };
  }
}
