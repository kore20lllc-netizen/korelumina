import type {
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

export const GENESIS_HISTORICAL_ADMISSION_GOVERNANCE_POLICY_VERSION =
  "1.0";

export type GenesisHistoricalAdmissionClassification =
  | "historical-evidence-only"
  | "historical-correlation-eligible"
  | "knowledge-seeding-eligible"
  | "requires-governance-review";

export interface GenesisHistoricalAdmissionGovernanceDecision {
  policyVersion:
    typeof GENESIS_HISTORICAL_ADMISSION_GOVERNANCE_POLICY_VERSION;

  classification:
    GenesisHistoricalAdmissionClassification;

  invokeKnowledgeManufacturing:
    boolean;

  correlationEligible:
    boolean;

  reasons:
    readonly string[];
}

const KNOWLEDGE_SEEDING_SOURCE_TYPES =
  new Set<
    GenesisSourceManifestEntry[
      "sourceType"
    ]
  >([
    "ADR",
    "RFC",
    "architecture-document",
    "document",
    "specification",
    "roadmap",
    "milestone",
  ]);

const CORRELATION_SOURCE_TYPES =
  new Set<
    GenesisSourceManifestEntry[
      "sourceType"
    ]
  >([
    "commit",
    "tag",
    "branch",
    "source-file",
    "runtime-event",
    "engineering-execution",
    "issue",
    "pull-request",
    "incident-log",
    "build-output",
  ]);

const GOVERNING_AUTHORITY_CLASSES =
  new Set<string>([
    "blueprint",
    "constitution",
    "constitutional",
    "canonical-document",
    "governance",
  ]);

const APPROVED_STATES =
  new Set<string>([
    "approved",
    "accepted",
    "active",
    "certified",
    "final",
    "ratified",
  ]);

function normalize(
  value:
    string | undefined,
): string | null {
  if (
    !value ||
    !value.trim()
  ) {
    return null;
  }

  return value
    .trim()
    .toLowerCase()
    .replace(
      /[\s_]+/g,
      "-",
    );
}

function unresolvedApprovalState(
  value:
    string | null,
): boolean {
  if (!value) {
    return false;
  }

  return [
    "draft",
    "proposed",
    "pending",
    "review",
    "rejected",
    "blocked",
    "conflicted",
    "needs-review",
  ].some(
    prefix =>
      value ===
        prefix ||
      value.startsWith(
        `${prefix}-`,
      ),
  );
}

function knowledgeManufacturingReadinessIssues(
  source:
    GenesisSourceManifestEntry,
): string[] {
  const issues:
    string[] = [];

  if (
    !source.authorityClass
      ?.trim()
  ) {
    issues.push(
      "Knowledge manufacturing requires an explicit authority class.",
    );
  }

  if (
    !source.authorityOwner
      ?.trim()
  ) {
    issues.push(
      "Knowledge manufacturing requires an explicit authority owner.",
    );
  }

  if (
    !source.authorityScope
      ?.trim()
  ) {
    issues.push(
      "Knowledge manufacturing requires an explicit authority scope.",
    );
  }

  if (
    !source.authorityVersion
      ?.trim()
  ) {
    issues.push(
      "Knowledge manufacturing requires an explicit authority version.",
    );
  }

  if (
    source.evidenceType !==
    "document"
  ) {
    return issues;
  }

  const approvalState =
    normalize(
      source.approvalState,
    );

  /*
   * DocumentationGovernanceValidator requires the literal
   * approved state before a documentation package may enter
   * Canonical Review. Other constitutionally recognized states
   * such as certified/final remain valid historical governance
   * observations, but they are not interchangeable with this
   * downstream manufacturing contract.
   */
  if (
    approvalState !==
    "approved"
  ) {
    issues.push(
      "Documentation Knowledge manufacturing requires explicit approvalState=approved.",
    );
  }

  const sourceLocation =
    source.metadata
      .sourceLocation;

  if (
    typeof sourceLocation !==
      "string" ||
    !sourceLocation.trim()
  ) {
    issues.push(
      "Documentation Knowledge manufacturing requires an explicit source location.",
    );
  }

  return issues;
}

function decision(
  classification:
    GenesisHistoricalAdmissionClassification,

  reasons:
    readonly string[],
): GenesisHistoricalAdmissionGovernanceDecision {
  return {
    policyVersion:
      GENESIS_HISTORICAL_ADMISSION_GOVERNANCE_POLICY_VERSION,

    classification,

    invokeKnowledgeManufacturing:
      classification ===
      "knowledge-seeding-eligible",

    correlationEligible:
      classification ===
        "historical-correlation-eligible" ||
      classification ===
        "knowledge-seeding-eligible",

    reasons:
      [...reasons],
  };
}

export function classifyGenesisHistoricalAdmission(
  source:
    GenesisSourceManifestEntry,
): GenesisHistoricalAdmissionGovernanceDecision {
  if (
    source.replayEligibility !==
    "eligible"
  ) {
    throw new Error(
      "genesis_historical_admission_governance_requires_eligible_source",
    );
  }

  if (
    !source.sourceChecksum
      .trim() ||
    !source.provenanceLocator
      .trim()
  ) {
    throw new Error(
      "genesis_historical_admission_governance_integrity_required",
    );
  }

  const approvalState =
    normalize(
      source.approvalState,
    );

  const authorityClass =
    normalize(
      source.authorityClass,
    );

  if (
    source.conflictsWith
      .length >
    0
  ) {
    return decision(
      "requires-governance-review",
      [
        "Historical Source contains an explicit conflict relationship.",
      ],
    );
  }

  if (
    source.evidenceType ===
    "conversation"
  ) {
    return decision(
      "historical-correlation-eligible",
      [
        "Conversation Evidence is independently acquired historical Evidence and may participate in governed historical correlation.",
        "Conversation Evidence does not authorize automatic interpretive Knowledge manufacturing or canonical promotion.",
      ],
    );
  }

  if (
    unresolvedApprovalState(
      approvalState,
    )
  ) {
    return decision(
      "requires-governance-review",
      [
        `Historical Source carries unresolved governance state ${approvalState}.`,
      ],
    );
  }

  if (
    authorityClass &&
    GOVERNING_AUTHORITY_CLASSES
      .has(
        authorityClass,
      ) &&
    !(
      approvalState &&
      APPROVED_STATES.has(
        approvalState,
      )
    )
  ) {
    return decision(
      "requires-governance-review",
      [
        "Governing historical material lacks an explicit approved governance state.",
      ],
    );
  }

  if (
    KNOWLEDGE_SEEDING_SOURCE_TYPES
      .has(
        source.sourceType,
      ) &&
    approvalState &&
    APPROVED_STATES.has(
      approvalState,
    )
  ) {
    const manufacturingReadinessIssues =
      knowledgeManufacturingReadinessIssues(
        source,
      );

    if (
      manufacturingReadinessIssues
        .length >
      0
    ) {
      return decision(
        "requires-governance-review",
        [
          "Historical semantic source has a recognized approval state but does not satisfy the governed Knowledge manufacturing identity contract.",
          ...manufacturingReadinessIssues,
        ],
      );
    }

    return decision(
      "knowledge-seeding-eligible",
      [
        "Semantic historical source carries an explicit approved governance state.",
        "Knowledge manufacturing remains downstream and non-canonical until governed Canonical Review and promotion.",
      ],
    );
  }

  if (
    source.supersedes.length >
      0 ||
    CORRELATION_SOURCE_TYPES
      .has(
        source.sourceType,
      ) ||
    approvalState !==
      null
  ) {
    return decision(
      "historical-correlation-eligible",
      [
        "Historical Evidence may participate in deterministic or governed historical correlation.",
        "Correlation eligibility does not authorize interpretive Knowledge manufacturing.",
      ],
    );
  }

  return decision(
    "historical-evidence-only",
    [
      "Historical Source is admissible Evidence but has no deterministic basis for automatic downstream Knowledge manufacturing.",
    ],
  );
}
