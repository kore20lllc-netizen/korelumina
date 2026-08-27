import type {
  CanonicalKnowledgeItem,
} from "../canonical-knowledge/index.js";

import type {
  KnowledgeContext,
} from "../knowledge-platform/context/KnowledgeContextBuilder.js";

import {
  createInitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";

import type {
  InitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";


function record(
  value:
    unknown,
): Record<string, unknown> | null {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  )
    ? value as Record<string, unknown>
    : null;
}


function requiredString(
  value:
    unknown,
): string | null {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  )
    ? value.trim()
    : null;
}


function stringArray(
  value:
    unknown,
): string[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value.filter(
    (
      item,
    ): item is string =>
      typeof item ===
        "string" &&
      item.trim().length >
        0,
  );
}


export interface GovernedRetrievalEvidenceAssessment {
  itemId:
    string;

  eligible:
    boolean;

  missingRequirements:
    readonly string[];

  evidence:
    InitialCompetencyEvidenceRecord |
    null;
}


function assessCanonicalItem(
  item:
    CanonicalKnowledgeItem,

  observedAt:
    number,
): GovernedRetrievalEvidenceAssessment {
  const metadata =
    record(
      item.metadata,
    ) ??
    {};

  const governance =
    record(
      metadata.governance,
    );

  const provenance =
    governance
      ? record(
          governance.provenance,
        )
      : null;

  const authority =
    requiredString(
      governance?.authority ??
      metadata.authorityClass,
    );

  const owner =
    requiredString(
      governance?.owner ??
      metadata.owner,
    );

  const scope =
    requiredString(
      governance?.scope ??
      metadata.scope,
    );

  const approvalState =
    requiredString(
      governance?.approvalState ??
      metadata.approvalState,
    );

  const reviewDecision =
    requiredString(
      governance?.reviewDecision,
    );

  const provenanceEvidenceIds =
    stringArray(
      provenance?.evidenceIds,
    );

  const provenanceSourceLocations =
    stringArray(
      provenance?.sourceLocations,
    );

  const provenanceContentRefs =
    stringArray(
      provenance?.contentRefs,
    );

  const sourceEvidenceRefs =
    stringArray(
      governance?.sourceEvidenceRefs,
    );

  const missing:
    string[] =
      [];

  if (
    item.status !==
      "canonical"
  ) {
    missing.push(
      "canonical-status",
    );
  }

  if (
    !authority
  ) {
    missing.push(
      "authority",
    );
  }

  if (
    !owner
  ) {
    missing.push(
      "owner",
    );
  }

  if (
    !scope
  ) {
    missing.push(
      "scope",
    );
  }

  if (
    approvalState !==
      "approved"
  ) {
    missing.push(
      "approved-state",
    );
  }

  if (
    reviewDecision !==
      "approved"
  ) {
    missing.push(
      "approved-review",
    );
  }

  if (
    !provenance
  ) {
    missing.push(
      "provenance",
    );
  }

  if (
    provenanceEvidenceIds.length ===
      0 &&
    sourceEvidenceRefs.length ===
      0 &&
    item.evidenceRefs.length ===
      0
  ) {
    missing.push(
      "evidence-reference",
    );
  }

  if (
    provenanceSourceLocations.length ===
      0 &&
    provenanceContentRefs.length ===
      0
  ) {
    missing.push(
      "source-provenance",
    );
  }

  const normalizedMissing =
    [
      ...new Set(
        missing,
      ),
    ].sort();

  if (
    normalizedMissing.length >
      0
  ) {
    return {
      itemId:
        item.id,

      eligible:
        false,

      missingRequirements:
        normalizedMissing,

      evidence:
        null,
    };
  }

  const evidence =
    createInitialCompetencyEvidenceRecord({
      evidenceId:
        `competency-evidence:governed-retrieval:${item.id}:${observedAt}`,

      competencyId:
        "governed-retrieval",

      source:
        "canonical-knowledge",

      sourceRef:
        item.id,

      claim:
        [
          "Governed retrieval returned canonical knowledge",
          `with authority ${authority},`,
          `owner ${owner},`,
          `scope ${scope},`,
          "approved review state, and preserved provenance.",
        ].join(
          " ",
        ),

      observedAt,
    });

  return {
    itemId:
      item.id,

    eligible:
      true,

    missingRequirements:
      [],

    evidence,
  };
}


export function deriveGovernedRetrievalCompetencyEvidence(
  context:
    KnowledgeContext,
): readonly GovernedRetrievalEvidenceAssessment[] {
  return context
    .knowledge
    .map(
      item =>
        assessCanonicalItem(
          item,
          context.generatedAt,
        ),
    )
    .sort(
      (
        left,
        right,
      ) =>
        left.itemId.localeCompare(
          right.itemId,
        ),
    );
}
