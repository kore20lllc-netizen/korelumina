import {
  createHash,
} from "node:crypto";

import type {
  EvidenceType,
} from "../evidence/index.js";

import type {
  HistoricalSourceClass,
} from "./HistoricalSource.js";

export type HistoricalSourceReferenceId =
  `genesis-source-ref:${string}`;

export type HistoricalSourceRevisionId =
  `genesis-source-revision:${string}`;

export type HistoricalEventId =
  `genesis-event:${string}`;

export type HistoricalRelationshipId =
  `genesis-relationship:${string}`;

export type EvolutionEpisodeId =
  `genesis-episode:${string}`;

export type EvolutionEpisodeRevisionId =
  `genesis-episode-revision:${string}`;

export type CorrelationConfidence =
  | "explicit"
  | "strong"
  | "probable"
  | "possible"
  | "unresolved";

export type CorrelationEvidenceMode =
  | "explicit-reference"
  | "structural-inference"
  | "temporal-order"
  | "human-validation"
  | "governance-reference"
  | "runtime-observation"
  | "test-observation"
  | "unresolved";

export type HistoricalRelationshipType =
  | "requested"
  | "clarified"
  | "proposed"
  | "approved"
  | "rejected"
  | "corrected"
  | "delegated"
  | "implemented_by"
  | "modified_by"
  | "validated_by"
  | "failed_validation"
  | "replaced_by"
  | "superseded_by"
  | "certified_by"
  | "contradicted_by"
  | "confirmed_by"
  | "derived_from"
  | "related_to"
  | "occurred_before"
  | "caused";

export type HistoricalEventKind =
  | "requirement-stated"
  | "architecture-proposed"
  | "decision-approved"
  | "decision-rejected"
  | "task-delegated"
  | "implementation-committed"
  | "runtime-observed"
  | "build-executed"
  | "test-passed"
  | "test-failed"
  | "visual-validation-passed"
  | "visual-validation-failed"
  | "correction-requested"
  | "replacement-implemented"
  | "document-created"
  | "document-amended"
  | "document-superseded"
  | "release-certified"
  | "historical-attempt"
  | "lesson-recorded"
  | "other";

export type HistoricalAuthorityStatus =
  | "historically-authoritative"
  | "historically-proposed"
  | "historically-rejected"
  | "historically-implemented"
  | "historically-validated"
  | "historically-observed"
  | "unknown";

export type CurrentAuthorityStatus =
  | "currently-authoritative"
  | "currently-implemented"
  | "currently-superseded"
  | "currently-retired"
  | "not-applicable"
  | "unknown";

export interface TemporalAuthority {
  historical: {
    status:
      HistoricalAuthorityStatus;

    authorityClass?:
      string;

    approvalState?:
      string;

    effectiveFrom?:
      number;

    effectiveTo?:
      number;
  };

  current: {
    status:
      CurrentAuthorityStatus;

    authorityClass?:
      string;

    approvalState?:
      string;

    replacedBy?:
      string;
  };
}

export interface HistoricalSourceReferenceIntegrity {
  checksum?:
    string;

  acquisitionState:
    | "available"
    | "acquired"
    | "not-yet-ingested"
    | "unavailable";

  acquiredAt?:
    number;
}

export interface HistoricalSourceReference {
  sourceReferenceId:
    HistoricalSourceReferenceId;

  sourceRevisionId:
    HistoricalSourceRevisionId;

  sourceIdentity:
    string;

  sourceClass:
    HistoricalSourceClass;

  evidenceType:
    EvidenceType;

  sourceRevision?:
    string;

  provenance: {
    locator?:
      string;

    nativeId?:
      string;

    repository?:
      string;

    ref?:
      string;

    sourceReference?:
      string;

    externalSource:
      boolean;
  };

  integrity:
    HistoricalSourceReferenceIntegrity;

  metadata:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}

export interface HistoricalEvent {
  eventId:
    HistoricalEventId;

  kind:
    HistoricalEventKind;

  observationKey:
    string;

  occurredAt:
    number;

  sourceReferenceIds:
    readonly HistoricalSourceReferenceId[];

  sourceRevisionIds:
    readonly HistoricalSourceRevisionId[];

  revisesEventId?:
    HistoricalEventId;

  summary?:
    string;

  temporalAuthority:
    TemporalAuthority;

  metadata:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}

export interface CorrelationEvidence {
  mode:
    CorrelationEvidenceMode;

  confidence:
    CorrelationConfidence;

  sourceReferenceIds:
    readonly HistoricalSourceReferenceId[];

  assertions:
    readonly string[];

  rationale?:
    string;
}

export interface HistoricalNodeReference {
  kind:
    "source" |
    "event";

  id:
    HistoricalSourceReferenceId |
    HistoricalEventId;
}

export interface HistoricalRelationship {
  relationshipId:
    HistoricalRelationshipId;

  from:
    HistoricalNodeReference;

  to:
    HistoricalNodeReference;

  type:
    HistoricalRelationshipType;

  causal:
    boolean;

  confidence:
    CorrelationConfidence;

  evidence:
    CorrelationEvidence;
}

export type EvolutionEpisodeLifecycle =
  | "candidate"
  | "correlating"
  | "correlated"
  | "conflicted"
  | "incomplete"
  | "validated"
  | "superseded"
  | "archived";

export type ExternalContextStatus =
  | "complete"
  | "pending"
  | "not-required";

export interface EvolutionEpisode {
  episodeId:
    EvolutionEpisodeId;

  revisionId:
    EvolutionEpisodeRevisionId;

  episodeKey:
    string;

  title:
    string;

  lifecycle:
    EvolutionEpisodeLifecycle;

  eventIds:
    readonly HistoricalEventId[];

  relationshipIds:
    readonly HistoricalRelationshipId[];

  sourceReferenceIds:
    readonly HistoricalSourceReferenceId[];

  externalContext:
    ExternalContextStatus;

  temporalAuthority:
    TemporalAuthority;

  lineage: {
    previousRevisionId?:
      EvolutionEpisodeRevisionId;

    mergedFrom:
      readonly EvolutionEpisodeId[];

    splitFrom?:
      EvolutionEpisodeId;

    supersedes:
      readonly EvolutionEpisodeId[];
  };

  metadata:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}

export interface GenesisHistoricalCorrelationState {
  sourceReferences:
    readonly HistoricalSourceReference[];

  events:
    readonly HistoricalEvent[];

  relationships:
    readonly HistoricalRelationship[];

  episodes:
    readonly EvolutionEpisode[];
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

function hashIdentity(
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

function sortedUnique<
  T extends string,
>(
  values:
    readonly T[],
): readonly T[] {
  return [
    ...new Set(
      values,
    ),
  ].sort();
}

export function createHistoricalSourceReference(
  input:
    Omit<
      HistoricalSourceReference,
      | "sourceReferenceId"
      | "sourceRevisionId"
    >,
): HistoricalSourceReference {
  const sourceReferenceId =
    `genesis-source-ref:${hashIdentity({
      sourceIdentity:
        input.sourceIdentity,

      sourceClass:
        input.sourceClass,

      evidenceType:
        input.evidenceType,
    })}` as HistoricalSourceReferenceId;

  const sourceRevisionId =
    `genesis-source-revision:${hashIdentity({
      sourceReferenceId,

      sourceRevision:
        input.sourceRevision ??
        null,

      checksum:
        input.integrity
          .checksum ??
        null,

      locator:
        input.provenance
          .locator ??
        null,
    })}` as HistoricalSourceRevisionId;

  return {
    ...input,
    sourceReferenceId,
    sourceRevisionId,
  };
}

export function createHistoricalEvent(
  input:
    Omit<
      HistoricalEvent,
      "eventId"
    >,
): HistoricalEvent {
  const sourceReferenceIds =
    sortedUnique(
      input.sourceReferenceIds,
    );

  const sourceRevisionIds =
    sortedUnique(
      input.sourceRevisionIds,
    );

  const eventId =
    `genesis-event:${hashIdentity({
      kind:
        input.kind,

      observationKey:
        input.observationKey,

      occurredAt:
        input.occurredAt,

      sourceReferenceIds,

      sourceRevisionIds,
    })}` as HistoricalEventId;

  return {
    ...input,
    eventId,
    sourceReferenceIds,
    sourceRevisionIds,
  };
}

export function createHistoricalRelationship(
  input:
    Omit<
      HistoricalRelationship,
      "relationshipId"
    >,
): HistoricalRelationship {
  if (
    input.evidence
      .assertions.length ===
      0
  ) {
    throw new Error(
      "genesis_correlation_evidence_required",
    );
  }

  if (
    input.confidence !==
    input.evidence
      .confidence
  ) {
    throw new Error(
      "genesis_correlation_confidence_mismatch",
    );
  }

  if (
    input.type ===
      "occurred_before" &&
    input.causal
  ) {
    throw new Error(
      "genesis_chronology_cannot_be_causal",
    );
  }

  if (
    input.type ===
      "caused" &&
    input.confidence !==
      "explicit" &&
    input.confidence !==
      "strong"
  ) {
    throw new Error(
      "genesis_causality_evidence_insufficient",
    );
  }

  const relationshipId =
    `genesis-relationship:${hashIdentity({
      from:
        input.from,

      to:
        input.to,

      type:
        input.type,

      causal:
        input.causal,

      confidence:
        input.confidence,

      evidence:
        input.evidence,
    })}` as HistoricalRelationshipId;

  return {
    ...input,
    relationshipId,
  };
}

export function createChronologicalRelationship(
  input: {
    fromEventId:
      HistoricalEventId;

    toEventId:
      HistoricalEventId;

    sourceReferenceIds:
      readonly HistoricalSourceReferenceId[];

    assertion:
      string;
  },
): HistoricalRelationship {
  return createHistoricalRelationship({
    from: {
      kind:
        "event",

      id:
        input.fromEventId,
    },

    to: {
      kind:
        "event",

      id:
        input.toEventId,
    },

    type:
      "occurred_before",

    causal:
      false,

    confidence:
      "explicit",

    evidence: {
      mode:
        "temporal-order",

      confidence:
        "explicit",

      sourceReferenceIds:
        sortedUnique(
          input.sourceReferenceIds,
        ),

      assertions: [
        input.assertion,
      ],
    },
  });
}

export function createEvolutionEpisode(
  input:
    Omit<
      EvolutionEpisode,
      | "episodeId"
      | "revisionId"
    >,
): EvolutionEpisode {
  const episodeId =
    `genesis-episode:${hashIdentity({
      episodeKey:
        input.episodeKey,
    })}` as EvolutionEpisodeId;

  const eventIds =
    sortedUnique(
      input.eventIds,
    );

  const relationshipIds =
    sortedUnique(
      input.relationshipIds,
    );

  const sourceReferenceIds =
    sortedUnique(
      input.sourceReferenceIds,
    );

  const revisionId =
    `genesis-episode-revision:${hashIdentity({
      episodeId,

      lifecycle:
        input.lifecycle,

      eventIds,

      relationshipIds,

      sourceReferenceIds,

      externalContext:
        input.externalContext,

      temporalAuthority:
        input.temporalAuthority,

      lineage:
        input.lineage,
    })}` as EvolutionEpisodeRevisionId;

  return {
    ...input,
    episodeId,
    revisionId,
    eventIds,
    relationshipIds,
    sourceReferenceIds,
  };
}


export function reviseEvolutionEpisode(
  existing:
    EvolutionEpisode,

  revision:
    Omit<
      EvolutionEpisode,
      | "episodeId"
      | "revisionId"
      | "episodeKey"
      | "lineage"
    > & {
      lineage?:
        Omit<
          EvolutionEpisode["lineage"],
          "previousRevisionId"
        >;
    },
): EvolutionEpisode {
  return createEvolutionEpisode({
    ...revision,

    episodeKey:
      existing.episodeKey,

    lineage: {
      previousRevisionId:
        existing.revisionId,

      mergedFrom:
        revision.lineage
          ?.mergedFrom ??
        existing.lineage
          .mergedFrom,

      splitFrom:
        revision.lineage
          ?.splitFrom ??
        existing.lineage
          .splitFrom,

      supersedes:
        revision.lineage
          ?.supersedes ??
        existing.lineage
          .supersedes,
    },
  });
}

function mergeByIdentity<
  T,
>(
  existing:
    readonly T[],

  incoming:
    readonly T[],

  identity:
    (
      value:
        T,
    ) => string,
): readonly T[] {
  const merged =
    new Map<
      string,
      T
    >();

  for (
    const value
    of existing
  ) {
    merged.set(
      identity(
        value,
      ),
      value,
    );
  }

  for (
    const value
    of incoming
  ) {
    merged.set(
      identity(
        value,
      ),
      value,
    );
  }

  return [
    ...merged.values(),
  ].sort(
    (
      left,
      right,
    ) =>
      identity(
        left,
      ).localeCompare(
        identity(
          right,
        ),
      ),
  );
}

export function mergeGenesisHistoricalCorrelationState(
  existing:
    GenesisHistoricalCorrelationState,

  incoming:
    GenesisHistoricalCorrelationState,
): GenesisHistoricalCorrelationState {
  return {
    sourceReferences:
      mergeByIdentity(
        existing
          .sourceReferences,

        incoming
          .sourceReferences,

        (
          value,
        ) =>
          value
            .sourceRevisionId,
      ),

    events:
      mergeByIdentity(
        existing.events,
        incoming.events,
        (
          value,
        ) =>
          value.eventId,
      ),

    relationships:
      mergeByIdentity(
        existing
          .relationships,

        incoming
          .relationships,

        (
          value,
        ) =>
          value
            .relationshipId,
      ),

    episodes:
      mergeByIdentity(
        existing.episodes,
        incoming.episodes,
        (
          value,
        ) =>
          value.revisionId,
      ),
  };
}

export const EMPTY_GENESIS_HISTORICAL_CORRELATION_STATE:
  GenesisHistoricalCorrelationState = {
    sourceReferences:
      [],

    events:
      [],

    relationships:
      [],

    episodes:
      [],
  };
