import {
  createHash,
} from "node:crypto";

import type {
  HistoricalSourceReference,
} from "./GenesisHistoricalCorrelation.js";

export type GenesisConversationSourceSupportClassification =
  | "SUPPORTED AND INGESTIBLE"
  | "SUPPORTED BUT REQUIRES COMPILER COMPLETION"
  | "SOURCE ACCESS BLOCKED"
  | "ARCHITECTURALLY UNDEFINED";

export type GenesisConversationAcquisitionState =
  | "not-yet-ingested"
  | "available"
  | "blocked";

export type GenesisConversationSourceBoundaryProjectionId =
  `genesis-conversation-boundary:${string}`;

export interface GenesisConversationAcquisitionContract {
  conversationIdentity:
    "required";

  messageIdentity:
    "required";

  projectAssociation:
    "required-when-available";

  timestamp:
    "required-when-available";

  speakerRole:
    "required";

  ordering:
    "required";

  sourceReference:
    "required";

  acquisitionEvent:
    "required";

  integrityInformation:
    "required";
}

export interface GenesisConversationCompilerCapability {
  available:
    boolean;

  compilerName:
    string | null;

  evidenceType:
    "conversation";

  governedKnowledgePathAvailable:
    boolean;
}

export interface GenesisConversationAcquisitionCapability {
  available:
    boolean;

  state:
    GenesisConversationAcquisitionState;

  mechanism:
    string | null;

  blocker:
    string | null;
}

export interface GenesisConversationSourceBoundary {
  projectionId:
    GenesisConversationSourceBoundaryProjectionId;

  classification:
    GenesisConversationSourceSupportClassification;

  compiler:
    GenesisConversationCompilerCapability;

  acquisition:
    GenesisConversationAcquisitionCapability;

  sourceContract:
    GenesisConversationAcquisitionContract;

  externalSourceMarker:
    "EXTERNAL SOURCE — NOT YET INGESTED";

  externalContextMarker:
    "EXTERNAL CONTEXT PENDING";

  repositoryReplayBlocked:
    false;

  conversationEvidenceMayBeSubstitutedByGit:
    false;
}

export interface BuildGenesisConversationSourceBoundaryInput {
  compilerAvailable:
    boolean;

  compilerName?:
    string;

  governedKnowledgePathAvailable:
    boolean;

  acquisitionAvailable:
    boolean;

  acquisitionMechanism?:
    string;

  acquisitionBlocker?:
    string;
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

function classify(
  input:
    BuildGenesisConversationSourceBoundaryInput,
): GenesisConversationSourceSupportClassification {
  if (
    input.acquisitionAvailable &&
    input.compilerAvailable &&
    input.governedKnowledgePathAvailable
  ) {
    return "SUPPORTED AND INGESTIBLE";
  }

  if (
    input.acquisitionAvailable &&
    (
      !input.compilerAvailable ||
      !input.governedKnowledgePathAvailable
    )
  ) {
    return "SUPPORTED BUT REQUIRES COMPILER COMPLETION";
  }

  if (
    !input.acquisitionAvailable &&
    input.compilerAvailable &&
    input.governedKnowledgePathAvailable
  ) {
    return "SOURCE ACCESS BLOCKED";
  }

  return "ARCHITECTURALLY UNDEFINED";
}

export function buildGenesisConversationSourceBoundary(
  input:
    BuildGenesisConversationSourceBoundaryInput,
): GenesisConversationSourceBoundary {
  const classification =
    classify(
      input,
    );

  const sourceContract:
    GenesisConversationAcquisitionContract = {
      conversationIdentity:
        "required",

      messageIdentity:
        "required",

      projectAssociation:
        "required-when-available",

      timestamp:
        "required-when-available",

      speakerRole:
        "required",

      ordering:
        "required",

      sourceReference:
        "required",

      acquisitionEvent:
        "required",

      integrityInformation:
        "required",
    };

  const compiler:
    GenesisConversationCompilerCapability = {
      available:
        input.compilerAvailable,

      compilerName:
        input.compilerAvailable
          ? (
              input.compilerName ??
              null
            )
          : null,

      evidenceType:
        "conversation",

      governedKnowledgePathAvailable:
        input
          .governedKnowledgePathAvailable,
    };

  const acquisition:
    GenesisConversationAcquisitionCapability = {
      available:
        input.acquisitionAvailable,

      state:
        input.acquisitionAvailable
          ? "available"
          : "blocked",

      mechanism:
        input.acquisitionAvailable
          ? (
              input
                .acquisitionMechanism ??
              null
            )
          : null,

      blocker:
        input.acquisitionAvailable
          ? null
          : (
              input
                .acquisitionBlocker ??
              "governed historical conversation source access unavailable"
            ),
    };

  const projectionId =
    `genesis-conversation-boundary:${hash({
      classification,
      compiler,
      acquisition,
      sourceContract,
    })}` as GenesisConversationSourceBoundaryProjectionId;

  return {
    projectionId,

    classification,

    compiler,

    acquisition,

    sourceContract,

    externalSourceMarker:
      "EXTERNAL SOURCE — NOT YET INGESTED",

    externalContextMarker:
      "EXTERNAL CONTEXT PENDING",

    repositoryReplayBlocked:
      false,

    conversationEvidenceMayBeSubstitutedByGit:
      false,
  };
}

/*
 * Certified Milestone 37 repository state.
 *
 * Conversation compilation exists and is registered in the
 * Knowledge Preservation Platform.
 *
 * No governed historical-conversation acquisition mechanism
 * exists in the repository at this milestone.
 */
export const genesisHistoricalConversationSourceBoundary =
  buildGenesisConversationSourceBoundary({
    compilerAvailable:
      true,

    compilerName:
      "conversation-compiler",

    governedKnowledgePathAvailable:
      true,

    acquisitionAvailable:
      false,

    acquisitionBlocker:
      "No governed historical conversation acquisition/source adapter is implemented.",
  });
