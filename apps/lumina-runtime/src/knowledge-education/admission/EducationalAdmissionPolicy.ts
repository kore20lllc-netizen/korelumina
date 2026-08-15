import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import {
  canonicalEducationEvidenceRefs,
  canonicalEducationSource,
  educationMetadataRecord,
  normalizedEducationString,
} from "../normalization/index.js";

function containsSyntheticMarker(
  value:
    string,
): boolean {
  const normalized =
    value
      .trim()
      .toLowerCase();

  const tokens =
    normalized
      .split(
        /[:/_.-]+/,
      )
      .filter(
        Boolean,
      );

  return (
    normalized ===
      "test" ||
    tokens.includes(
      "test",
    ) ||
    tokens.includes(
      "testing",
    ) ||
    normalized.includes(
      "certification",
    ) ||
    normalized.includes(
      "fixture",
    ) ||
    normalized.includes(
      "synthetic",
    ) ||
    normalized.includes(
      "test-candidate",
    )
  );
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
      entry,
    ): entry is string =>
      typeof entry ===
        "string" &&
      entry.trim().length >
        0,
  );
}

function isRecord(
  value:
    unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

export function isEducationallyAdmissible(
  item:
    CanonicalKnowledgeItem,
): boolean {
  if (
    item.status !==
      "canonical"
  ) {
    return false;
  }

  const metadata =
    educationMetadataRecord(
      item,
    );

  const source =
    canonicalEducationSource(
      item,
    );

  const environment =
    normalizedEducationString(
      metadata.environment,
    );

  const purpose =
    normalizedEducationString(
      metadata.purpose,
    );

  const certification =
    normalizedEducationString(
      metadata.certification,
    );

  const approvalState =
    normalizedEducationString(
      metadata.approvalState,
    );

  if (
    environment ===
      "test" ||
    environment ===
      "certification" ||
    purpose ===
      "test" ||
    purpose ===
      "certification" ||
    certification ===
      "true"
  ) {
    return false;
  }

  if (
    approvalState &&
    approvalState !==
      "approved"
  ) {
    return false;
  }

  if (
    containsSyntheticMarker(
      source,
    ) ||
    containsSyntheticMarker(
      item.id,
    ) ||
    canonicalEducationEvidenceRefs(
      item,
    ).some(
      containsSyntheticMarker,
    )
  ) {
    return false;
  }

  if (
    source ===
      "canonical-knowledge"
  ) {
    const educationEligible =
      metadata.educationEligible;

    const explicitlyEligible =
      educationEligible ===
        true ||
      (
        typeof educationEligible ===
          "string" &&
        educationEligible
          .trim()
          .toLowerCase() ===
          "true"
      );

    if (
      !explicitlyEligible
    ) {
      return false;
    }
  }

  const governance =
    isRecord(
      metadata.governance,
    )
      ? metadata.governance
      : null;

  if (
    !governance
  ) {
    return true;
  }

  const reviewDecision =
    normalizedEducationString(
      governance.reviewDecision,
    );

  if (
    reviewDecision !==
      null &&
    reviewDecision !==
      "approved"
  ) {
    return false;
  }

  if (
    stringArray(
      governance.sourceEvidenceRefs,
    ).some(
      containsSyntheticMarker,
    )
  ) {
    return false;
  }

  const provenance =
    isRecord(
      governance.provenance,
    )
      ? governance.provenance
      : null;

  if (
    !provenance
  ) {
    return true;
  }

  return ![
    ...stringArray(
      provenance.evidenceIds,
    ),
    ...stringArray(
      provenance.sources,
    ),
  ].some(
    containsSyntheticMarker,
  );
}
