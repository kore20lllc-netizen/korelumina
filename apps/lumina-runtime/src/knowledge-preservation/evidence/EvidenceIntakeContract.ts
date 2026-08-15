import type {
  EvidenceItem,
  EvidenceType,
} from "./EvidenceItem.js";

export const evidenceTypes:
  readonly EvidenceType[] = [
    "conversation",
    "commit",
    "tag",
    "branch",
    "ADR",
    "RFC",
    "document",
    "source-file",
    "runtime-event",
    "engineering-execution",
    "issue",
    "pull-request",
    "specification",
    "roadmap",
    "milestone",
    "build-output",
    "incident-log",
  ];

const evidenceTypeSet =
  new Set<string>(
    evidenceTypes,
  );

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

function requireNonEmptyString(
  value:
    unknown,

  field:
    string,
): string {
  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new Error(
      `evidence_intake_invalid:${field}`,
    );
  }

  return value;
}

function requireTimestamp(
  value:
    unknown,

  field:
    string,
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    ) ||
    value < 0
  ) {
    throw new Error(
      `evidence_intake_invalid:${field}`,
    );
  }

  return value;
}

function assertRelationships(
  value:
    unknown,
): asserts value is Record<
  string,
  string[]
> {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "evidence_intake_invalid:relationships",
    );
  }

  for (
    const [
      relationship,
      refs,
    ]
    of Object.entries(
      value,
    )
  ) {
    requireNonEmptyString(
      relationship,
      "relationships.key",
    );

    if (
      !Array.isArray(
        refs,
      ) ||
      refs.some(
        (ref) =>
          typeof ref !==
            "string" ||
          ref.trim().length ===
            0,
      )
    ) {
      throw new Error(
        `evidence_intake_invalid:relationships.${relationship}`,
      );
    }
  }
}

export function assertValidEvidenceItem(
  value:
    unknown,
): asserts value is EvidenceItem {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "evidence_intake_invalid:object",
    );
  }

  requireNonEmptyString(
    value.id,
    "id",
  );

  const type =
    requireNonEmptyString(
      value.type,
      "type",
    );

  if (
    !evidenceTypeSet.has(
      type,
    )
  ) {
    throw new Error(
      "evidence_intake_invalid:type",
    );
  }

  requireNonEmptyString(
    value.title,
    "title",
  );

  requireNonEmptyString(
    value.source,
    "source",
  );

  const capturedAt =
    requireTimestamp(
      value.capturedAt,
      "capturedAt",
    );

  const observedAt =
    requireTimestamp(
      value.observedAt,
      "observedAt",
    );

  /*
   * Evidence may be captured after it was observed, but an
   * observation cannot occur after its stated capture time.
   */
  if (
    observedAt >
    capturedAt
  ) {
    throw new Error(
      "evidence_intake_invalid:temporal_order",
    );
  }

  requireNonEmptyString(
    value.contentRef,
    "contentRef",
  );

  if (
    value.checksum !==
      undefined
  ) {
    requireNonEmptyString(
      value.checksum,
      "checksum",
    );
  }

  if (
    !isRecord(
      value.metadata,
    )
  ) {
    throw new Error(
      "evidence_intake_invalid:metadata",
    );
  }

  assertRelationships(
    value.relationships,
  );
}
