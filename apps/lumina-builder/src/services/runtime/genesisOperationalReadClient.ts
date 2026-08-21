import {
  assertGenesisReplayId,
} from "./genesisReplayReadClient.js";

import type {
  GenesisReplayId,
} from "./genesisReplayReadClient.js";

export type GenesisOperationalProjectionId =
  `genesis-operational:${string}`;


export type GenesisHistoricalSourceReferenceId =
  `genesis-source-ref:${string}`;

export type GenesisHistoricalSourceRevisionId =
  `genesis-source-revision:${string}`;

export type GenesisHistoricalEventId =
  `genesis-event:${string}`;

export type GenesisHistoricalRelationshipId =
  `genesis-relationship:${string}`;

export type GenesisEvolutionEpisodeId =
  `genesis-episode:${string}`;

export type GenesisEvolutionEpisodeRevisionId =
  `genesis-episode-revision:${string}`;

export type GenesisCorrelationConfidence =
  | "explicit"
  | "strong"
  | "probable"
  | "possible"
  | "unresolved";

export type GenesisHistoricalSourceClass =
  | "ADR"
  | "RFC"
  | "architecture-document"
  | "document"
  | "specification"
  | "roadmap"
  | "source-file"
  | "commit"
  | "tag"
  | "branch"
  | "runtime-event"
  | "conversation"
  | "engineering-execution"
  | "issue"
  | "pull-request"
  | "incident-log"
  | "build-output"
  | "milestone";

export type GenesisHistoricalEventKind =
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

export type GenesisHistoricalAuthorityStatus =
  | "historically-authoritative"
  | "historically-proposed"
  | "historically-rejected"
  | "historically-implemented"
  | "historically-validated"
  | "historically-observed"
  | "unknown";

export type GenesisCurrentAuthorityStatus =
  | "currently-authoritative"
  | "currently-implemented"
  | "currently-superseded"
  | "currently-retired"
  | "not-applicable"
  | "unknown";

export interface GenesisTemporalAuthority {
  historical: {
    status:
      GenesisHistoricalAuthorityStatus;

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
      GenesisCurrentAuthorityStatus;

    authorityClass?:
      string;

    approvalState?:
      string;

    replacedBy?:
      string;
  };
}

export interface GenesisCorpusSourceRecord {
  sourceReferenceId:
    GenesisHistoricalSourceReferenceId;

  sourceRevisionId:
    GenesisHistoricalSourceRevisionId;

  sourceIdentity:
    string;

  sourceClass:
    GenesisHistoricalSourceClass;

  evidenceType:
    string;

  externalSource:
    boolean;

  acquisitionState:
    | "available"
    | "acquired"
    | "not-yet-ingested"
    | "unavailable";

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

  eventIds:
    readonly GenesisHistoricalEventId[];

  episodeIds:
    readonly GenesisEvolutionEpisodeId[];

  metadata:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}

export interface GenesisHistoricalEventRecord {
  eventId:
    GenesisHistoricalEventId;

  kind:
    GenesisHistoricalEventKind;

  observationKey:
    string;

  occurredAt:
    number;

  sourceReferenceIds:
    readonly GenesisHistoricalSourceReferenceId[];

  sourceRevisionIds:
    readonly GenesisHistoricalSourceRevisionId[];

  revisesEventId?:
    GenesisHistoricalEventId;

  summary?:
    string;

  temporalAuthority:
    GenesisTemporalAuthority;

  metadata:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}

export type GenesisHistoricalRelationshipType =
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

export interface GenesisHistoricalRelationshipRecord {
  relationshipId:
    GenesisHistoricalRelationshipId;

  from: {
    kind:
      "source" | "event";

    id:
      GenesisHistoricalSourceReferenceId |
      GenesisHistoricalEventId;
  };

  to: {
    kind:
      "source" | "event";

    id:
      GenesisHistoricalSourceReferenceId |
      GenesisHistoricalEventId;
  };

  type:
    GenesisHistoricalRelationshipType;

  causal:
    boolean;

  confidence:
    GenesisCorrelationConfidence;

  evidence: {
    mode:
      string;

    confidence:
      GenesisCorrelationConfidence;

    sourceReferenceIds:
      readonly GenesisHistoricalSourceReferenceId[];

    assertions:
      readonly string[];

    rationale?:
      string;
  };
}

export type GenesisEvolutionEpisodeLifecycle =
  | "candidate"
  | "correlating"
  | "correlated"
  | "conflicted"
  | "incomplete"
  | "validated"
  | "superseded"
  | "archived";

export interface GenesisEvolutionEpisodeRecord {
  episodeId:
    GenesisEvolutionEpisodeId;

  revisionId:
    GenesisEvolutionEpisodeRevisionId;

  episodeKey:
    string;

  title:
    string;

  lifecycle:
    GenesisEvolutionEpisodeLifecycle;

  eventIds:
    readonly GenesisHistoricalEventId[];

  relationshipIds:
    readonly GenesisHistoricalRelationshipId[];

  sourceReferenceIds:
    readonly GenesisHistoricalSourceReferenceId[];

  externalContext:
    "complete" |
    "pending" |
    "not-required";

  temporalAuthority:
    GenesisTemporalAuthority;

  lineage: {
    previousRevisionId?:
      GenesisEvolutionEpisodeRevisionId;

    mergedFrom:
      readonly GenesisEvolutionEpisodeId[];

    splitFrom?:
      GenesisEvolutionEpisodeId;

    supersedes:
      readonly GenesisEvolutionEpisodeId[];
  };

  metadata:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}
export type GenesisReadinessOverall =
  | "incomplete"
  | "blocked"
  | "ready";

export type GenesisReadinessDimensionState =
  | "complete"
  | "partial"
  | "blocked"
  | "unavailable"
  | "not-evaluated";

export type GenesisConversationSourceSupportClassification =
  | "SUPPORTED AND INGESTIBLE"
  | "SUPPORTED BUT REQUIRES COMPILER COMPLETION"
  | "SOURCE ACCESS BLOCKED"
  | "ARCHITECTURALLY UNDEFINED";

export interface GenesisOperationalCorpusSummary {
  projectionId:
    string;

  sourceSummary: {
    uniqueSources:
      number;

    sourceRevisions:
      number;

    byClass:
      Readonly<
        Record<
          string,
          number | undefined
        >
      >;
  };

  evolutionSummary: {
    historicalEvents:
      number;

    relationships:
      number;

    evolutionEpisodes:
      number;

    conflictedEpisodes:
      number;

    incompleteEpisodes:
      number;

    validatedEpisodes:
      number;

    unresolvedRelationships:
      number;
  };

  knowledgeLifecycle: {
    admittedEvidence:
      number;

    manufacturingLinkedEvidence:
      number;

    ambiguousManufacturingLinks:
      number;

    packages:
      number;

    canonicalKnowledge:
      number;
  };

  externalContext: {
    pendingEpisodes:
      number;

    notYetIngestedConversationSources:
      number;

    externalSourceReferences:
      number;

    complete:
      boolean;
  };

  replays:
    readonly unknown[];

  sources:
    readonly GenesisCorpusSourceRecord[];

  events:
    readonly GenesisHistoricalEventRecord[];

  relationships:
    readonly GenesisHistoricalRelationshipRecord[];

  episodes:
    readonly GenesisEvolutionEpisodeRecord[];
}

export type GenesisTemporalChronologyProjectionId =
  `genesis-chronology:${string}`;

export type GenesisTemporalChronologyEntryId =
  `genesis-chronology-entry:${string}`;

export interface GenesisTemporalChronologyEntry {
  chronologyEntryId:
    GenesisTemporalChronologyEntryId;

  position:
    number;

  eventId:
    GenesisHistoricalEventId;

  occurredAt:
    number;

  kind:
    GenesisHistoricalEventKind;

  summary:
    string | null;

  sourceReferenceIds:
    readonly GenesisHistoricalSourceReferenceId[];

  sourceRevisionIds:
    readonly GenesisHistoricalSourceRevisionId[];

  episodeIds:
    readonly GenesisEvolutionEpisodeId[];

  incomingRelationshipIds:
    readonly GenesisHistoricalRelationshipId[];

  outgoingRelationshipIds:
    readonly GenesisHistoricalRelationshipId[];

  chronologicalPredecessorEventIds:
    readonly GenesisHistoricalEventId[];

  chronologicalSuccessorEventIds:
    readonly GenesisHistoricalEventId[];

  temporalAuthority:
    GenesisTemporalAuthority;

  revisesEventId:
    GenesisHistoricalEventId | null;

  metadata:
    Readonly<
      Record<
        string,
        unknown
      >
    >;
}

export interface GenesisTemporalChronologyEqualTimestampGroup {
  occurredAt:
    number;

  eventIds:
    readonly GenesisHistoricalEventId[];
}

export interface GenesisTemporalChronologyAuthoritySummary {
  historicallyAuthoritative:
    number;

  historicallyProposed:
    number;

  historicallyRejected:
    number;

  historicallyImplemented:
    number;

  historicallyValidated:
    number;

  historicallyObserved:
    number;

  historicalUnknown:
    number;

  currentlyAuthoritative:
    number;

  currentlyImplemented:
    number;

  currentlySuperseded:
    number;

  currentlyRetired:
    number;

  currentNotApplicable:
    number;

  currentUnknown:
    number;
}

export interface GenesisOperationalChronologySummary {
  projectionId:
    GenesisTemporalChronologyProjectionId;

  corpusProjectionId:
    string;

  entries:
    readonly GenesisTemporalChronologyEntry[];

  authority:
    GenesisTemporalChronologyAuthoritySummary;

  coverage: {
    totalEvents:
      number;

    earliestOccurredAt:
      number | null;

    latestOccurredAt:
      number | null;

    equalTimestampGroups:
      readonly GenesisTemporalChronologyEqualTimestampGroup[];

    sourceRevisionsWithoutHistoricalEvents:
      readonly GenesisHistoricalSourceRevisionId[];

    episodesWithExternalContextPending:
      readonly GenesisEvolutionEpisodeId[];

    conflictedEpisodes:
      readonly GenesisEvolutionEpisodeId[];

    unresolvedRelationshipIds:
      readonly GenesisHistoricalRelationshipId[];

    complete:
      boolean;
  };
}

export interface GenesisOperationalDocumentationGovernanceSummary {
  projectionId:
    string;

  documents:
    readonly unknown[];

  summary: {
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
  };
}

export type GenesisHistoricalKnowledgeLineageStatus =
  | "correlated"
  | "source-reference-missing"
  | "ambiguous-source-reference";

export interface GenesisHistoricalKnowledgeLineageRecord {
  historicalSourceId:
    string;

  evidenceId:
    string;

  status:
    GenesisHistoricalKnowledgeLineageStatus;

  sourceReferenceIds:
    readonly GenesisHistoricalSourceReferenceId[];

  eventIds:
    readonly GenesisHistoricalEventId[];

  episodeIds:
    readonly GenesisEvolutionEpisodeId[];
}

export interface GenesisHistoricalKnowledgeLineageProjection {
  projectionId:
    `genesis-historical-knowledge-lineage:${string}`;

  corpusProjectionId:
    string;

  records:
    readonly GenesisHistoricalKnowledgeLineageRecord[];

  summary: {
    admittedEvidence:
      number;

    correlated:
      number;

    sourceReferenceMissing:
      number;

    ambiguousSourceReference:
      number;
  };
}

export type GenesisLifecycleCorrelationStatus =
  | "correlated"
  | "not-correlated"
  | "ambiguous";

export type GenesisLifecycleStageState =
  | "not-reached"
  | "entered"
  | "processing"
  | "completed"
  | "awaiting-human-review"
  | "approved"
  | "published"
  | "blocked"
  | "failed";

export interface GenesisLifecycleStageProjection {
  state:
    GenesisLifecycleStageState;

  events:
    readonly unknown[];
}

export interface GenesisKnowledgeLifecycleRecord {
  evidenceId:
    string;

  manufacturingCorrelation:
    GenesisLifecycleCorrelationStatus;

  manufacturingRunId:
    string | null;

  matchingManufacturingRunIds:
    readonly string[];

  manufacturingStatus:
    string | null;

  currentStage:
    string | null;

  knowledgeIR:
    GenesisLifecycleStageProjection;

  validation:
    GenesisLifecycleStageProjection;

  packageAssembly:
    GenesisLifecycleStageProjection;

  canonicalReview:
    GenesisLifecycleStageProjection;

  canonicalKnowledge:
    GenesisLifecycleStageProjection;

  packageId:
    string | null;

  canonicalKnowledgeIds:
    readonly string[];

  organizationalMemory:
    readonly {
      status:
        GenesisLifecycleCorrelationStatus;

      memoryRecordIds:
        readonly string[];

      adaptationValidated:
        boolean | null;
    }[];

  educationalEligibility: {
    status:
      "not-evaluated";

    eligible:
      null;
  };
}

export interface GenesisOperationalKnowledgeLifecycleSummary {
  projectionId:
    string;

  corpusProjectionId:
    string;

  records:
    readonly GenesisKnowledgeLifecycleRecord[];

  summary: {
    admittedEvidence:
      number;

    manufacturingCorrelated:
      number;

    manufacturingAmbiguous:
      number;

    manufacturingUncorrelated:
      number;

    knowledgeIRReached:
      number;

    validated:
      number;

    packaged:
      number;

    awaitingCanonicalReview:
      number;

    canonical:
      number;

    memoryCorrelatedCanonicalItems:
      number;

    memoryAdaptationValidated:
      number;

    educationalEligibilityEvaluated:
      number;
  };
}

export interface GenesisOperationalReadinessSummary {
  projectionId:
    string;

  policyId:
    string;

  overall:
    GenesisReadinessOverall;

  sources: {
    state:
      GenesisReadinessDimensionState;

    discoveredSourceRevisions:
      number;

    requiredSourceClasses:
      readonly string[];

    presentRequiredSourceClasses:
      readonly string[];

    missingRequiredSourceClasses:
      readonly string[];

    externalSourceReferences:
      number;

    pendingExternalContextEpisodes:
      number;

    notYetIngestedConversationSources:
      number;
  };

  replay: {
    state:
      GenesisReadinessDimensionState;

    replayCount:
      number;

    completedReplays:
      number;

    blockedReplays:
      number;

    failedReplays:
      number;

    runningReplays:
      number;

    pendingReplays:
      number;

    manifestSources:
      number;

    sourcesReplayed:
      number | null;

    sourcesReplayedMeasurement:
      "unavailable";
  };

  knowledge: {
    state:
      GenesisReadinessDimensionState;

    evidenceAdmitted:
      number;

    manufacturingCorrelated:
      number;

    manufacturingAmbiguous:
      number;

    manufacturingUncorrelated:
      number;

    knowledgeIRReached:
      number;

    validated:
      number;

    packaged:
      number;

    awaitingCanonicalReview:
      number;

    canonical:
      number;

    memoryCorrelatedCanonicalItems:
      number;

    memoryAdaptationValidated:
      number;

    failed:
      number;

    blocked:
      number;

    educationalEligibilityEvaluated:
      number;
  };

  chronology: {
    state:
      GenesisReadinessDimensionState;

    historicalEvents:
      number;

    earliestOccurredAt:
      number | null;

    latestOccurredAt:
      number | null;

    sourceRevisionsWithoutHistoricalEvents:
      number;

    externalContextPendingEpisodes:
      number;

    conflictedEpisodes:
      number;

    unresolvedRelationships:
      number;
  };

  authority: {
    state:
      GenesisReadinessDimensionState;

    documents:
      number;

    governing:
      number;

    unresolved:
      number;

    missingScope:
      number;

    missingEffectivePeriod:
      number;
  };

  education: {
    state:
      "not-evaluated";

    eligibleRecords:
      null;

    reason:
      string;
  };

  blockers:
    readonly {
      code:
        string;

      count:
        number;

      detail:
        string;
    }[];

  completionPercentage:
    null;
}

export interface GenesisOperationalConversationSourceSummary {
  projectionId:
    string;

  classification:
    GenesisConversationSourceSupportClassification;

  compiler: {
    available:
      boolean;

    compilerName:
      string | null;

    evidenceType:
      "conversation";

    governedKnowledgePathAvailable:
      boolean;
  };

  acquisition: {
    available:
      boolean;

    state:
      "not-yet-ingested" |
      "available" |
      "blocked";

    mechanism:
      string | null;

    blocker:
      string | null;
  };

  externalSourceMarker:
    "EXTERNAL SOURCE — NOT YET INGESTED";

  externalContextMarker:
    "EXTERNAL CONTEXT PENDING";

  repositoryReplayBlocked:
    false;

  conversationEvidenceMayBeSubstitutedByGit:
    false;
}

export interface GenesisOperationalProjection {
  projectionId:
    GenesisOperationalProjectionId;

  replayId:
    GenesisReplayId;

  corpus:
    GenesisOperationalCorpusSummary;

  chronology:
    GenesisOperationalChronologySummary;

  documentationGovernance:
    GenesisOperationalDocumentationGovernanceSummary;

  knowledgeLifecycle:
    GenesisOperationalKnowledgeLifecycleSummary;

  historicalKnowledgeLineage:
    GenesisHistoricalKnowledgeLineageProjection;

  readiness:
    GenesisOperationalReadinessSummary;

  conversationSource:
    GenesisOperationalConversationSourceSummary;
}

export interface GenesisOperationalSuccessResponse {
  ok:
    true;

  projection:
    GenesisOperationalProjection;
}

export interface GenesisOperationalReadClientOptions {
  baseUrl:
    string;

  getHeaders?:
    () => HeadersInit;

  fetchImpl?:
    typeof fetch;
}

export class GenesisOperationalReadApiError
  extends Error
{
  readonly status:
    number;

  readonly code:
    string;

  readonly replayId:
    GenesisReplayId;

  constructor(
    input: {
      status:
        number;

      code:
        string;

      replayId:
        GenesisReplayId;
    },
  ) {
    super(
      input.code,
    );

    this.name =
      "GenesisOperationalReadApiError";

    this.status =
      input.status;

    this.code =
      input.code;

    this.replayId =
      input.replayId;
  }
}

export interface GenesisOperationalReadClient {
  getOperationalProjection(
    replayId:
      GenesisReplayId,
  ):
    Promise<
      GenesisOperationalProjection
    >;
}

function trimTrailingSlash(
  value:
    string,
): string {
  return value.replace(
    /\/+$/,
    "",
  );
}

async function readJson(
  response:
    Response,

  replayId:
    GenesisReplayId,
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new GenesisOperationalReadApiError({
      status:
        response.status,

      code:
        "genesis_operational_read_invalid_json",

      replayId,
    });
  }
}

function errorCodeFromBody(
  body:
    unknown,

  fallback:
    string,
): string {
  if (
    typeof body ===
      "object" &&
    body !==
      null &&
    "error" in body &&
    typeof (
      body as {
        error?:
          unknown;
      }
    ).error ===
      "string"
  ) {
    return (
      body as {
        error:
          string;
      }
    ).error;
  }

  return fallback;
}

function hasProjectionId(
  value:
    unknown,
): value is {
  projectionId:
    string;
} {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    "projectionId" in value &&
    typeof (
      value as {
        projectionId?:
          unknown;
      }
    ).projectionId ===
      "string"
  );
}

function isOperationalSuccess(
  body:
    unknown,

  replayId:
    GenesisReplayId,
): body is
  GenesisOperationalSuccessResponse {
  if (
    typeof body !==
      "object" ||
    body ===
      null
  ) {
    return false;
  }

  const candidate =
    body as {
      ok?:
        unknown;

      projection?: {
        projectionId?:
          unknown;

        replayId?:
          unknown;

        corpus?:
          unknown;

        chronology?:
          unknown;

        documentationGovernance?:
          unknown;

        knowledgeLifecycle?:
          unknown;

        readiness?:
          unknown;

        conversationSource?:
          unknown;
      };
    };

  return (
    candidate.ok ===
      true &&
    typeof candidate
      .projection
      ?.projectionId ===
      "string" &&
    candidate
      .projection
      ?.projectionId
      .startsWith(
        "genesis-operational:",
      ) &&
    candidate
      .projection
      ?.replayId ===
      replayId &&
    hasProjectionId(
      candidate
        .projection
        ?.corpus,
    ) &&
    hasProjectionId(
      candidate
        .projection
        ?.chronology,
    ) &&
    hasProjectionId(
      candidate
        .projection
        ?.documentationGovernance,
    ) &&
    hasProjectionId(
      candidate
        .projection
        ?.knowledgeLifecycle,
    ) &&
    hasProjectionId(
      candidate
        .projection
        ?.readiness,
    ) &&
    hasProjectionId(
      candidate
        .projection
        ?.conversationSource,
    )
  );
}

export function createGenesisOperationalReadClient(
  options:
    GenesisOperationalReadClientOptions,
): GenesisOperationalReadClient {
  const baseUrl =
    trimTrailingSlash(
      options.baseUrl,
    );

  const fetchImpl =
    options.fetchImpl ??
    fetch;

  function headers():
    HeadersInit {
    return options
      .getHeaders?.() ??
      {};
  }

  return {
    async getOperationalProjection(
      replayId,
    ) {
      assertGenesisReplayId(
        replayId,
      );

      const response =
        await fetchImpl(
          `${baseUrl}/api/runtime/genesis/replays/${encodeURIComponent(
            replayId,
          )}/operational`,
          {
            method:
              "GET",

            headers:
              headers(),
          },
        );

      const body =
        await readJson(
          response,
          replayId,
        );

      if (
        !response.ok
      ) {
        throw new GenesisOperationalReadApiError({
          status:
            response.status,

          code:
            errorCodeFromBody(
              body,
              "genesis_operational_projection_read_failed",
            ),

          replayId,
        });
      }

      if (
        !isOperationalSuccess(
          body,
          replayId,
        )
      ) {
        throw new GenesisOperationalReadApiError({
          status:
            response.status,

          code:
            "genesis_operational_projection_response_invalid",

          replayId,
        });
      }

      return body.projection;
    },
  };
}
