import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

export function isEducationRecord(
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

export function educationMetadataRecord(
  item:
    CanonicalKnowledgeItem,
): Record<
  string,
  unknown
> {
  return isEducationRecord(
    item.metadata,
  )
    ? item.metadata
    : {};
}

export function educationMetadataString(
  item:
    CanonicalKnowledgeItem,

  key:
    string,
): string | null {
  const value =
    educationMetadataRecord(
      item,
    )[
      key
    ];

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  )
    ? value
    : null;
}

export function educationMetadataStrings(
  item:
    CanonicalKnowledgeItem,

  key:
    string,
): string[] {
  const value =
    educationMetadataRecord(
      item,
    )[
      key
    ];

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

export function canonicalEducationSource(
  item:
    CanonicalKnowledgeItem,
): string {
  return (
    educationMetadataString(
      item,
      "source",
    ) ??
    "canonical-knowledge"
  );
}

export function canonicalEducationEvidenceRefs(
  item:
    CanonicalKnowledgeItem,
): string[] {
  if (
    !Array.isArray(
      item.evidenceRefs,
    )
  ) {
    return [];
  }

  return item.evidenceRefs.filter(
    (
      ref,
    ): ref is string =>
      typeof ref ===
        "string" &&
      ref.trim().length >
        0,
  );
}

export function canonicalEducationRelationshipRefs(
  item:
    CanonicalKnowledgeItem,
): string[] {
  if (
    !isEducationRecord(
      item.relationships,
    )
  ) {
    return [];
  }

  return [
    ...new Set(
      Object.values(
        item.relationships,
      )
        .filter(
          Array.isArray,
        )
        .flat()
        .filter(
          (
            ref,
          ): ref is string =>
            typeof ref ===
              "string" &&
            ref.trim().length >
              0,
        ),
    ),
  ];
}

export function canonicalEducationUpdatedAt(
  item:
    CanonicalKnowledgeItem,
): number {
  if (
    typeof item.updatedAt ===
      "number" &&
    Number.isFinite(
      item.updatedAt,
    ) &&
    item.updatedAt >
      0
  ) {
    return item.updatedAt;
  }

  if (
    typeof item.createdAt ===
      "number" &&
    Number.isFinite(
      item.createdAt,
    ) &&
    item.createdAt >
      0
  ) {
    return item.createdAt;
  }

  return 0;
}

export function canonicalEducationCandidateType(
  item:
    CanonicalKnowledgeItem,
): string {
  return (
    typeof item.type ===
      "string" &&
    item.type.trim().length >
      0
  )
    ? item.type
    : "CandidateArtifact";
}

export function normalizedEducationString(
  value:
    unknown,
): string | null {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  )
    ? value
        .trim()
        .toLowerCase()
    : null;
}

function normalizedStringArray(
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

export function canonicalEducationSourceRefs(
  item:
    CanonicalKnowledgeItem,
): string[] {
  const metadata =
    educationMetadataRecord(
      item,
    );

  const direct = [
    ...educationMetadataStrings(
      item,
      "sourceLocations",
    ),

    ...educationMetadataStrings(
      item,
      "contentRefs",
    ),
  ];

  const contentRef =
    educationMetadataString(
      item,
      "contentRef",
    );

  const sourceLocation =
    educationMetadataString(
      item,
      "sourceLocation",
    );

  if (
    contentRef
  ) {
    direct.push(
      contentRef,
    );
  }

  if (
    sourceLocation
  ) {
    direct.push(
      sourceLocation,
    );
  }

  const governance =
    isEducationRecord(
      metadata.governance,
    )
      ? metadata.governance
      : null;

  const provenance =
    governance &&
    isEducationRecord(
      governance.provenance,
    )
      ? governance.provenance
      : null;

  const governedRefs =
    provenance
      ? [
          ...normalizedStringArray(
            provenance.sourceLocations,
          ),

          ...normalizedStringArray(
            provenance.contentRefs,
          ),
        ]
      : [];

  return [
    ...new Set(
      [
        ...direct,
        ...governedRefs,
      ]
        .map(
          (value) =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  ];
}
