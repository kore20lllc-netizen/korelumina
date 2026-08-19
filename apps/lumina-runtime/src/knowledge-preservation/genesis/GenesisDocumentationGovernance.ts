import {
  createHash,
} from "node:crypto";

import type {
  HistoricalSourceId,
} from "./HistoricalSource.js";

import type {
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

export type GenesisDocumentationGovernanceProjectionId =
  `genesis-document-governance:${string}`;

export type GenesisDocumentGovernanceClass =
  | "canon"
  | "constitution"
  | "blueprint"
  | "decision-record"
  | "architecture"
  | "reconciliation"
  | "specification"
  | "operating-model"
  | "governance"
  | "validation"
  | "certification"
  | "roadmap"
  | "rfc"
  | "audit"
  | "research"
  | "historical"
  | "archive"
  | "documentation";

export type GenesisDocumentAuthorityEffect =
  | "governing"
  | "evidentiary"
  | "planning"
  | "proposal"
  | "historical"
  | "non-governing"
  | "unresolved";

export type GenesisDocumentCurrentAuthority =
  | "governing"
  | "non-governing"
  | "superseded"
  | "historical"
  | "archived"
  | "unresolved";

export type GenesisDocumentHistoricalAuthority =
  | "governing"
  | "non-governing"
  | "historical"
  | "unresolved";

export interface GenesisDocumentEffectivePeriod {
  from:
    string | null;

  to:
    string | null;

  source:
    "declared" |
    "not-declared";
}

export interface GenesisDocumentationGovernanceRecord {
  historicalSourceId:
    HistoricalSourceId;

  sourceChecksum:
    string;

  provenanceLocator:
    string;

  governanceClass:
    GenesisDocumentGovernanceClass;

  declaredAuthorityClass:
    string;

  declaredApprovalState:
    string | null;

  authorityOwner:
    string | null;

  authorityScope:
    string | null;

  authorityVersion:
    string | null;

  effectivePeriod:
    GenesisDocumentEffectivePeriod;

  authorityEffect:
    GenesisDocumentAuthorityEffect;

  historicalAuthority:
    GenesisDocumentHistoricalAuthority;

  currentAuthority:
    GenesisDocumentCurrentAuthority;

  supersedes:
    readonly HistoricalSourceId[];

  conflictsWith:
    readonly HistoricalSourceId[];

  governanceGaps:
    readonly string[];
}

export interface GenesisDocumentationGovernanceSummary {
  documents:
    number;

  governing:
    number;

  evidentiary:
    number;

  planning:
    number;

  proposals:
    number;

  historical:
    number;

  superseded:
    number;

  unresolved:
    number;

  missingScope:
    number;

  missingEffectivePeriod:
    number;
}

export interface GenesisDocumentationGovernanceProjection {
  projectionId:
    GenesisDocumentationGovernanceProjectionId;

  documents:
    readonly GenesisDocumentationGovernanceRecord[];

  summary:
    GenesisDocumentationGovernanceSummary;
}

function normalize(
  value:
    string | undefined,
): string {
  return (
    value ??
    ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[_\s]+/g,
      "-",
    );
}

function stableNormalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.fromEntries(
      Object.keys(
        record,
      )
        .sort()
        .map(
          (
            key,
          ) => [
            key,
            stableNormalize(
              record[key],
            ),
          ],
        ),
    );
  }

  return value;
}

function hash(
  value:
    unknown,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify(
        stableNormalize(
          value,
        ),
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}

function isDocumentation(
  entry:
    GenesisSourceManifestEntry,
): boolean {
  return (
    entry.evidenceType ===
      "document" ||
    entry.evidenceType ===
      "ADR" ||
    entry.evidenceType ===
      "RFC" ||
    entry.evidenceType ===
      "specification" ||
    entry.evidenceType ===
      "roadmap"
  );
}

function governanceClassFor(
  entry:
    GenesisSourceManifestEntry,
): GenesisDocumentGovernanceClass {
  const locator =
    entry.provenanceLocator
      .toLowerCase();

  const status =
    normalize(
      entry.approvalState ??
      (
        typeof entry.metadata
          .status ===
          "string"
          ? entry.metadata.status
          : undefined
      ),
    );

  if (
    locator ===
      "blueprint.md"
  ) {
    return "blueprint";
  }

  if (
    locator.startsWith(
      "docs/canon/",
    )
  ) {
    return "canon";
  }

  if (
    locator.startsWith(
      "docs/constitution/",
    ) ||
    locator.endsWith(
      "/00_platform_constitution.md",
    )
  ) {
    return "constitution";
  }

  if (
    locator.includes(
      "/archive/",
    ) ||
    status ===
      "archived"
  ) {
    return "archive";
  }

  if (
    status ===
      "historical"
  ) {
    return "historical";
  }

  if (
    entry.evidenceType ===
      "ADR"
  ) {
    return "decision-record";
  }

  if (
    entry.evidenceType ===
      "RFC"
  ) {
    return "rfc";
  }

  if (
    locator.includes(
      "/reconciliation/",
    ) ||
    locator.includes(
      "reconciliation",
    )
  ) {
    return "reconciliation";
  }

  if (
    locator.includes(
      "operating_model",
    ) ||
    locator.includes(
      "operating-model",
    )
  ) {
    return "operating-model";
  }

  if (
    locator.startsWith(
      "docs/certification/",
    ) ||
    locator.includes(
      "certification"
    )
  ) {
    return "certification";
  }

  if (
    locator.includes(
      "validation"
    )
  ) {
    return "validation";
  }

  if (
    locator.includes(
      "/audit"
    ) ||
    locator.includes(
      "_audit"
    ) ||
    status ===
      "audit"
  ) {
    return "audit";
  }

  if (
    locator.startsWith(
      "docs/research/",
    )
  ) {
    return "research";
  }

  if (
    locator.startsWith(
      "docs/governance/",
    )
  ) {
    return "governance";
  }

  if (
    entry.evidenceType ===
      "specification"
  ) {
    return "specification";
  }

  if (
    entry.evidenceType ===
      "roadmap"
  ) {
    return "roadmap";
  }

  if (
    entry.sourceType ===
      "architecture-document"
  ) {
    return "architecture";
  }

  return "documentation";
}

function approvalStateFor(
  entry:
    GenesisSourceManifestEntry,
): string {
  const metadataStatus =
    typeof entry.metadata
      .status ===
      "string"
      ? entry.metadata.status
      : undefined;

  return normalize(
    entry.approvalState ??
    metadataStatus,
  );
}

function effectFor(
  governanceClass:
    GenesisDocumentGovernanceClass,

  approvalState:
    string,
): GenesisDocumentAuthorityEffect {
  if (
    governanceClass ===
      "archive" ||
    governanceClass ===
      "historical"
  ) {
    return "historical";
  }

  if (
    governanceClass ===
      "validation" ||
    governanceClass ===
      "certification" ||
    governanceClass ===
      "audit"
  ) {
    return "evidentiary";
  }

  if (
    governanceClass ===
      "roadmap"
  ) {
    return "planning";
  }

  if (
    governanceClass ===
      "rfc" ||
    governanceClass ===
      "research"
  ) {
    return "proposal";
  }

  if (
    approvalState ===
      "canonical" ||
    approvalState ===
      "authoritative" ||
    approvalState ===
      "approved" ||
    approvalState ===
      "active" ||
    approvalState ===
      "frozen"
  ) {
    return "governing";
  }

  if (
    approvalState ===
      "proposed" ||
    approvalState ===
      "draft" ||
    approvalState ===
      "review"
  ) {
    return "non-governing";
  }

  if (
    approvalState ===
      "superseded" ||
    approvalState ===
      "historical" ||
    approvalState ===
      "archived"
  ) {
    return "historical";
  }

  /*
   * "Complete" is deliberately not promoted here.
   *
   * Repository governance explicitly says completion alone
   * does not establish constitutional/document authority.
   */
  return "unresolved";
}

function currentAuthorityFor(
  governanceClass:
    GenesisDocumentGovernanceClass,

  approvalState:
    string,

  effect:
    GenesisDocumentAuthorityEffect,
): GenesisDocumentCurrentAuthority {
  if (
    approvalState ===
      "superseded"
  ) {
    return "superseded";
  }

  if (
    governanceClass ===
      "archive" ||
    approvalState ===
      "archived"
  ) {
    return "archived";
  }

  if (
    governanceClass ===
      "historical" ||
    approvalState ===
      "historical"
  ) {
    return "historical";
  }

  if (
    effect ===
      "governing"
  ) {
    return "governing";
  }

  if (
    effect ===
      "evidentiary" ||
    effect ===
      "planning" ||
    effect ===
      "proposal" ||
    effect ===
      "non-governing"
  ) {
    return "non-governing";
  }

  return "unresolved";
}

function historicalAuthorityFor(
  governanceClass:
    GenesisDocumentGovernanceClass,

  approvalState:
    string,

  effect:
    GenesisDocumentAuthorityEffect,
): GenesisDocumentHistoricalAuthority {
  if (
    governanceClass ===
      "archive" ||
    governanceClass ===
      "historical" ||
    approvalState ===
      "superseded" ||
    approvalState ===
      "historical" ||
    approvalState ===
      "archived"
  ) {
    /*
     * Current metadata does not prove what authority the
     * document had before supersession/archive.
     */
    return "historical";
  }

  if (
    effect ===
      "governing"
  ) {
    return "governing";
  }

  if (
    effect ===
      "evidentiary" ||
    effect ===
      "planning" ||
    effect ===
      "proposal" ||
    effect ===
      "non-governing"
  ) {
    return "non-governing";
  }

  return "unresolved";
}

function recordFor(
  entry:
    GenesisSourceManifestEntry,
): GenesisDocumentationGovernanceRecord {
  const governanceClass =
    governanceClassFor(
      entry,
    );

  const approvalState =
    approvalStateFor(
      entry,
    );

  const authorityEffect =
    effectFor(
      governanceClass,
      approvalState,
    );

  const effectivePeriod:
    GenesisDocumentEffectivePeriod = {
      from:
        entry.effectiveFrom ??
        null,

      to:
        entry.effectiveTo ??
        null,

      source:
        entry.effectiveFrom ||
        entry.effectiveTo
          ? "declared"
          : "not-declared",
    };

  const governanceGaps:
    string[] =
      [];

  if (
    !approvalState
  ) {
    governanceGaps.push(
      "approval-state-not-declared",
    );
  }

  if (
    !entry.authorityScope
  ) {
    governanceGaps.push(
      "authority-scope-not-declared",
    );
  }

  if (
    effectivePeriod.source ===
      "not-declared"
  ) {
    governanceGaps.push(
      "effective-period-not-declared",
    );
  }

  return {
    historicalSourceId:
      entry.historicalSourceId,

    sourceChecksum:
      entry.sourceChecksum,

    provenanceLocator:
      entry.provenanceLocator,

    governanceClass,

    declaredAuthorityClass:
      entry.authorityClass,

    declaredApprovalState:
      approvalState ||
      null,

    authorityOwner:
      entry.authorityOwner ??
      null,

    authorityScope:
      entry.authorityScope ??
      null,

    authorityVersion:
      entry.authorityVersion ??
      null,

    effectivePeriod,

    authorityEffect,

    historicalAuthority:
      historicalAuthorityFor(
        governanceClass,
        approvalState,
        authorityEffect,
      ),

    currentAuthority:
      currentAuthorityFor(
        governanceClass,
        approvalState,
        authorityEffect,
      ),

    supersedes: [
      ...entry.supersedes,
    ].sort(),

    conflictsWith: [
      ...entry.conflictsWith,
    ].sort(),

    governanceGaps:
      governanceGaps.sort(),
  };
}

export function buildGenesisDocumentationGovernanceProjection(
  entries:
    readonly GenesisSourceManifestEntry[],
): GenesisDocumentationGovernanceProjection {
  const documents =
    entries
      .filter(
        isDocumentation,
      )
      .map(
        recordFor,
      )
      .sort(
        (
          left,
          right,
        ) => {
          const sourceOrder =
            left.historicalSourceId
              .localeCompare(
                right.historicalSourceId,
              );

          if (
            sourceOrder !==
              0
          ) {
            return sourceOrder;
          }

          return left.sourceChecksum
            .localeCompare(
              right.sourceChecksum,
            );
        },
      );

  const summary:
    GenesisDocumentationGovernanceSummary = {
      documents:
        documents.length,

      governing:
        documents.filter(
          (
            document,
          ) =>
            document
              .authorityEffect ===
            "governing",
        ).length,

      evidentiary:
        documents.filter(
          (
            document,
          ) =>
            document
              .authorityEffect ===
            "evidentiary",
        ).length,

      planning:
        documents.filter(
          (
            document,
          ) =>
            document
              .authorityEffect ===
            "planning",
        ).length,

      proposals:
        documents.filter(
          (
            document,
          ) =>
            document
              .authorityEffect ===
            "proposal",
        ).length,

      historical:
        documents.filter(
          (
            document,
          ) =>
            document
              .authorityEffect ===
            "historical",
        ).length,

      superseded:
        documents.filter(
          (
            document,
          ) =>
            document
              .currentAuthority ===
            "superseded",
        ).length,

      unresolved:
        documents.filter(
          (
            document,
          ) =>
            document
              .currentAuthority ===
            "unresolved",
        ).length,

      missingScope:
        documents.filter(
          (
            document,
          ) =>
            document
              .authorityScope ===
            null,
        ).length,

      missingEffectivePeriod:
        documents.filter(
          (
            document,
          ) =>
            document
              .effectivePeriod
              .source ===
            "not-declared",
        ).length,
    };

  const projectionId =
    `genesis-document-governance:${hash({
      documents,
      summary,
    })}` as GenesisDocumentationGovernanceProjectionId;

  return {
    projectionId,

    documents,

    summary,
  };
}
