import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import {
  adaptCanonicalKnowledgeToOrganizationalMemoryRecords,
} from "./CanonicalKnowledgeOrganizationalMemoryAdapter.js";

import type {
  OrganizationalMemoryGeneralizationDeclaration,
} from "./CanonicalKnowledgeOrganizationalMemoryAdapter.js";

import type {
  OrganizationalMemoryRecord,
} from "./OrganizationalMemoryRecord.js";

import {
  validateOrganizationalMemoryPipelineResult,
} from "./OrganizationalMemoryValidation.js";

export interface OrganizationalMemoryPersistence {
  saveAll(
    records:
      readonly OrganizationalMemoryRecord[],
  ): void;
}

export interface GovernedCanonicalMemoryAdaptationInput {
  organizationId:
    string;

  projectId?:
    string;

  teamId?:
    string;

  items:
    readonly CanonicalKnowledgeItem[];

  generalization:
    OrganizationalMemoryGeneralizationDeclaration;
}

export interface GovernedCanonicalMemoryAdaptationResult {
  records:
    OrganizationalMemoryRecord[];
}

function assertGovernedRecord(
  record:
    OrganizationalMemoryRecord,
): void {
  const governance =
    record.governance;

  if (
    !governance
  ) {
    throw new Error(
      "organizational_memory_governance_missing",
    );
  }

  if (
    governance.trust.canonical !==
    true
  ) {
    throw new Error(
      "organizational_memory_canonical_trust_missing",
    );
  }

  if (
    governance.trust.humanApproved !==
    true ||
    !governance.approval ||
    governance.approval.decision !==
    "approved"
  ) {
    throw new Error(
      "organizational_memory_human_approval_missing",
    );
  }

  if (
    !governance.packageId
  ) {
    throw new Error(
      "organizational_memory_package_reference_missing",
    );
  }

  if (
    governance.privacy.generalized !==
    true
  ) {
    throw new Error(
      "organizational_memory_generalization_required",
    );
  }

  if (
    governance.privacy
      .customerSpecificContentRetained !==
    false
  ) {
    throw new Error(
      "organizational_memory_privacy_boundary_violated",
    );
  }
}

export class GovernedCanonicalMemoryAdaptationService {
  constructor(
    private readonly persistence:
      OrganizationalMemoryPersistence,
  ) {}

  adaptAndPersist(
    input:
      GovernedCanonicalMemoryAdaptationInput,
  ): GovernedCanonicalMemoryAdaptationResult {
    const projected =
      adaptCanonicalKnowledgeToOrganizationalMemoryRecords({
        organizationId:
          input.organizationId,

        projectId:
          input.projectId,

        teamId:
          input.teamId,

        items:
          input.items,

        generalization:
          input.generalization,
      });

    for (
      const record
      of projected
    ) {
      assertGovernedRecord(
        record,
      );
    }

    const validation =
      validateOrganizationalMemoryPipelineResult({
        records:
          projected,

        insights:
          [],
      });

    if (
      !validation.valid
    ) {
      throw new Error(
        `organizational_memory_validation_failed:${
          validation.issues
            .map(
              (issue) =>
                issue.code,
            )
            .join(",")
        }`,
      );
    }

    const validated =
      projected.map(
        (
          record,
        ): OrganizationalMemoryRecord => {
          if (
            !record.governance
          ) {
            throw new Error(
              "organizational_memory_governance_missing",
            );
          }

          return {
            ...record,

            governance: {
              ...record.governance,

              trust: {
                ...record.governance
                  .trust,

                adaptationValidated:
                  true,
              },
            },
          };
        },
      );

    this.persistence.saveAll(
      validated,
    );

    return {
      records:
        validated,
    };
  }
}
