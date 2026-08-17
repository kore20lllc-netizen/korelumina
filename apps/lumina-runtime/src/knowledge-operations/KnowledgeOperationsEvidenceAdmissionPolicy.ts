import path from "node:path";
import fs from "node:fs";

import type {
  KnowledgeManufacturingRun,
} from "../knowledge-preservation/manufacturing/index.js";

import type {
  KnowledgePackage,
} from "../knowledge-preservation/package/index.js";

const NON_PRODUCTION_MARKER =
  /(?:^|[/_.:\-\s])(?:test|tests|fixture|fixtures|mock|mocks|synthetic|smoke|certification|certify|example|sample|demo)(?:$|[/_.:\-\s])/i;

function strings(
  value:
    unknown,
): string[] {
  if (
    typeof value ===
    "string"
  ) {
    return value.trim()
      ? [
          value.trim(),
        ]
      : [];
  }

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

function unique(
  values:
    readonly string[],
): string[] {
  return [
    ...new Set(
      values,
    ),
  ];
}

function sourceRefs(
  knowledgePackage:
    KnowledgePackage,
): string[] {
  return unique([
    ...strings(
      knowledgePackage
        .provenance
        ?.sourceLocations,
    ),

    ...strings(
      knowledgePackage
        .provenance
        ?.contentRefs,
    ),

    ...knowledgePackage.items.flatMap(
      (item) => [
        ...strings(
          item.metadata
            ?.sourceLocation,
        ),

        ...strings(
          item.metadata
            ?.contentRef,
        ),
      ],
    ),
  ]);
}

function sourceLabels(
  knowledgePackage:
    KnowledgePackage,
): string[] {
  return unique([
    knowledgePackage.id,

    ...strings(
      knowledgePackage
        .provenance
        ?.sources,
    ),

    ...sourceRefs(
      knowledgePackage,
    ),

    ...knowledgePackage.items.flatMap(
      (item) => [
        item.id,
        item.title,

        ...strings(
          item.metadata
            ?.source,
        ),
      ],
    ),
  ]);
}

function localSourceExists(
  value:
    string,

  repositoryRoot:
    string,
): boolean {
  const normalized =
    value.trim();

  if (
    !normalized
  ) {
    return false;
  }

  if (
    normalized.startsWith(
      "http://",
    ) ||
    normalized.startsWith(
      "https://",
    ) ||
    normalized.startsWith(
      "git://",
    )
  ) {
    return true;
  }

  const withoutFileScheme =
    normalized.startsWith(
      "file://",
    )
      ? normalized.slice(
          "file://".length,
        )
      : normalized;

  const candidate =
    path.isAbsolute(
      withoutFileScheme,
    )
      ? withoutFileScheme
      : path.join(
          repositoryRoot,
          withoutFileScheme,
        );

  return fs.existsSync(
    candidate,
  );
}

export interface KnowledgeOperationsEvidenceAdmissionDecision {
  admitted:
    boolean;

  reasons:
    string[];
}

export function evaluateKnowledgeOperationsEvidenceAdmission(
  input: {
    evidenceId:
      string;

    run:
      KnowledgeManufacturingRun | undefined;

    knowledgePackage:
      KnowledgePackage | undefined;

    repositoryRoot:
      string;
  },
): KnowledgeOperationsEvidenceAdmissionDecision {
  const reasons:
    string[] = [];

  const {
    evidenceId,
    run,
    knowledgePackage,
    repositoryRoot,
  } = input;

  if (
    !knowledgePackage
  ) {
    reasons.push(
      "package_missing",
    );
  }

  if (
    run &&
    run.status ===
      "failed"
  ) {
    reasons.push(
      "manufacturing_failed",
    );
  }

  if (
    knowledgePackage
  ) {
    const matchingItems =
      knowledgePackage.items.filter(
        (item) =>
          item.evidenceRefs.includes(
            evidenceId,
          ),
      );

    const evidenceTypes =
      unique(
        matchingItems
          .map(
            (item) =>
              item.compiler
                ?.evidenceSourceType,
          )
          .filter(
            (
              value,
            ): value is NonNullable<
              typeof value
            > =>
              value !==
              undefined,
          ),
      );

    if (
      evidenceTypes.length ===
        0
    ) {
      reasons.push(
        "evidence_type_missing",
      );
    }

    const labels =
      sourceLabels(
        knowledgePackage,
      );

    if (
      labels.some(
        (value) =>
          NON_PRODUCTION_MARKER.test(
            value,
          ),
      )
    ) {
      reasons.push(
        "non_production_marker",
      );
    }

    const refs =
      sourceRefs(
        knowledgePackage,
      );

    if (
      refs.length ===
        0
    ) {
      reasons.push(
        "provenance_missing",
      );
    } else if (
      refs.every(
        (ref) =>
          !localSourceExists(
            ref,
            repositoryRoot,
          ),
      )
    ) {
      reasons.push(
        "source_unresolvable",
      );
    }
  }

  return {
    admitted:
      reasons.length ===
      0,

    reasons,
  };
}
