import type {
  ExecutiveReasoning,
} from "../executive/reasoning/index.js";

import {
  createInitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";

import type {
  InitialCompetencyEvidenceRecord,
} from "./InitialCompetencyEvidenceContract.js";


export interface ExplainableGroundingObservation {
  observedAt:
    number;

  sourceRef:
    string;

  reasoning:
    ExecutiveReasoning;
}


export interface ExplainableGroundingEvidenceAssessment {
  reasoningId:
    string;

  eligible:
    boolean;

  missingRequirements:
    readonly string[];

  evidence:
    InitialCompetencyEvidenceRecord |
    null;
}


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


function nonEmptyString(
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
  return Array.isArray(
    value,
  )
    ? value.filter(
        (
          entry,
        ): entry is string =>
          typeof entry ===
            "string" &&
          entry.trim().length >
            0,
      )
    : [];
}


function validTimestamp(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    ) &&
    value >
      0
  );
}


export function deriveExplainableGroundingCompetencyEvidence(
  observation:
    ExplainableGroundingObservation,
): ExplainableGroundingEvidenceAssessment {
  const reasoning =
    observation.reasoning;

  const metadata =
    record(
      reasoning.metadata,
    ) ??
    {};

  const reasoningId =
    nonEmptyString(
      reasoning.id,
    );

  const sourceRef =
    nonEmptyString(
      observation.sourceRef,
    );

  const canonicalKnowledgeIds =
    stringArray(
      metadata.canonicalKnowledgeIds,
    );

  const organizationalMemoryRecordIds =
    stringArray(
      metadata.organizationalMemoryRecordIds,
    );

  const explicitMissingAuthority =
    metadata.missingAuthority ===
      true;

  const explicitMissingKnowledge =
    metadata.missingKnowledge ===
      true;

  const missing:
    string[] =
      [];

  if (
    !reasoningId
  ) {
    missing.push(
      "reasoning-id",
    );
  }

  if (
    reasoning.status !==
      "completed"
  ) {
    missing.push(
      "completed-reasoning",
    );
  }

  if (
    !nonEmptyString(
      reasoning.conclusion,
    )
  ) {
    missing.push(
      "reasoning-conclusion",
    );
  }

  if (
    reasoning.evidence.length ===
      0
  ) {
    missing.push(
      "reasoning-evidence",
    );
  }

  if (
    canonicalKnowledgeIds.length ===
      0 &&
    organizationalMemoryRecordIds.length ===
      0
  ) {
    missing.push(
      "governed-source-grounding",
    );
  }

  if (
    reasoning.assumptions.length ===
      0 &&
    !explicitMissingAuthority &&
    !explicitMissingKnowledge
  ) {
    missing.push(
      "uncertainty-or-authority-disclosure",
    );
  }

  if (
    !sourceRef
  ) {
    missing.push(
      "reasoning-source-ref",
    );
  }

  if (
    !validTimestamp(
      observation.observedAt,
    )
  ) {
    missing.push(
      "observation-time",
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
      0 ||
    !reasoningId ||
    !sourceRef ||
    !validTimestamp(
      observation.observedAt,
    )
  ) {
    return {
      reasoningId:
        reasoningId ??
        "",

      eligible:
        false,

      missingRequirements:
        normalizedMissing,

      evidence:
        null,
    };
  }

  const groundingRefs =
    [
      ...canonicalKnowledgeIds,
      ...organizationalMemoryRecordIds,
    ];

  const disclosures:
    string[] =
      [];

  if (
    reasoning.assumptions.length >
      0
  ) {
    disclosures.push(
      `${reasoning.assumptions.length} explicit assumption(s)`,
    );
  }

  if (
    explicitMissingAuthority
  ) {
    disclosures.push(
      "missing authority disclosed",
    );
  }

  if (
    explicitMissingKnowledge
  ) {
    disclosures.push(
      "missing knowledge disclosed",
    );
  }

  const evidence =
    createInitialCompetencyEvidenceRecord({
      evidenceId:
        `competency-evidence:explainable-grounding:${reasoningId}:${observation.observedAt}`,

      competencyId:
        "explainable-grounding",

      source:
        "canonical-knowledge",

      sourceRef,

      claim:
        [
          `Completed reasoning ${reasoningId}`,
          `was grounded in ${groundingRefs.length} governed source reference(s),`,
          `preserved ${reasoning.evidence.length} explicit evidence citation(s),`,
          "and exposed",
          disclosures.join(
            ", ",
          ),
          "rather than presenting unsupported certainty.",
        ].join(
          " ",
        ),

      observedAt:
        observation.observedAt,
    });

  return {
    reasoningId,

    eligible:
      true,

    missingRequirements:
      [],

    evidence,
  };
}
