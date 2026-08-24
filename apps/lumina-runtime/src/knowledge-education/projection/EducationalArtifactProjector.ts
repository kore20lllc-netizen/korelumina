import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import {
  canonicalEducationCandidateType,
  canonicalEducationEvidenceRefs,
  canonicalEducationRelationshipRefs,
  canonicalEducationSource,
  canonicalEducationSourceRefs,
  educationGovernanceString,
  educationGovernanceStrings,
  educationMetadataString,
  educationMetadataStrings,
} from "../normalization/index.js";

export interface EducationalArtifactProjection {
  id:
    string;

  title:
    string;

  kind:
    | "canon"
    | "constitution"
    | "amendment"
    | "architecture"
    | "reconciliation"
    | "adr"
    | "edr"
    | "specification"
    | "standard"
    | "security"
    | "business"
    | "domain"
    | "api"
    | "user-documentation"
    | "runtime-documentation"
    | "knowledge-operations"
    | "mission"
    | "conversation"
    | "decision"
    | "organizational";

  category:
    string;

  authorityClass:
    string;

  approvalState:
    string;

  owner:
    string;

  scope:
    string;

  version:
    string;

  provenance:
    string;

  source:
    string;

  sourceRefs:
    string[];

  lineage:
    string[];

  dependencies:
    string[];

  supersession:
    string;

  educationalStatus:
    | "completed"
    | "active"
    | "blocked"
    | "not-started"
    | "needs-review";

  educationalImpact:
    string;

  relatedArtifacts:
    string[];

  relatedKnowledgePackages:
    string[];

  relatedCanonicalKnowledge:
    string[];

  relatedMemory:
    string[];

  relatedMissions:
    string[];

  relatedDecisions:
    string[];

  authors?:
    string[];
}

const artifactKinds =
  new Set<
    EducationalArtifactProjection["kind"]
  >([
    "canon",
    "constitution",
    "amendment",
    "architecture",
    "reconciliation",
    "adr",
    "edr",
    "specification",
    "standard",
    "security",
    "business",
    "domain",
    "api",
    "user-documentation",
    "runtime-documentation",
    "knowledge-operations",
    "mission",
    "conversation",
    "decision",
    "organizational",
  ]);

function artifactKind(
  item:
    CanonicalKnowledgeItem,
): EducationalArtifactProjection["kind"] {
  const declared =
    educationMetadataString(
      item,
      "kind",
    );

  if (
    declared &&
    artifactKinds.has(
      declared as EducationalArtifactProjection["kind"],
    )
  ) {
    return declared as EducationalArtifactProjection["kind"];
  }

  switch (
    canonicalEducationCandidateType(
      item,
    )
  ) {
    case "CandidateDecision":
      return "decision";

    case "CandidateRoadmap":
      return "mission";

    case "CandidateComponent":
    case "CandidateSubsystem":
      return "architecture";

    case "CandidateArtifact":
      return "knowledge-operations";

    default:
      return "knowledge-operations";
  }
}

export function educationalStatus(
  item:
    CanonicalKnowledgeItem,
): EducationalArtifactProjection["educationalStatus"] {
  switch (
    item.status
  ) {
    case "canonical":
      return "completed";

    case "superseded":
      return "needs-review";

    case "archived":
      return "blocked";

    default:
      return "needs-review";
  }
}

function packageIds(
  item:
    CanonicalKnowledgeItem,
): string[] {
  const explicit =
    educationMetadataStrings(
      item,
      "relatedKnowledgePackages",
    );

  const packageId =
    educationMetadataString(
      item,
      "packageId",
    ) ??
    educationGovernanceString(
      item,
      "packageId",
    );

  return [
    ...new Set([
      ...explicit,
      ...(
        packageId
          ? [
              packageId,
            ]
          : []
      ),
    ]),
  ];
}

export function projectEducationalArtifact(
  item:
    CanonicalKnowledgeItem,
): EducationalArtifactProjection {
  const evidenceRefs =
    canonicalEducationEvidenceRefs(
      item,
    );

  return {
    id:
      item.id,

    title:
      item.title,

    kind:
      artifactKind(
        item,
      ),

    category:
      educationMetadataString(
        item,
        "category",
      ) ??
      canonicalEducationCandidateType(
        item,
      ).replace(
        /^Candidate/,
        "",
      ),

    authorityClass:
      educationMetadataString(
        item,
        "authorityClass",
      ) ??
      educationMetadataString(
        item,
        "authority",
      ) ??
      educationGovernanceString(
        item,
        "authority",
      ) ??
      "Unavailable",

    approvalState:
      educationMetadataString(
        item,
        "approvalState",
      ) ??
      (
        item.status ===
          "canonical"
          ? "approved"
          : item.status
      ),

    owner:
      educationMetadataString(
        item,
        "owner",
      ) ??
      educationGovernanceString(
        item,
        "owner",
      ) ??
      "Unavailable",

    scope:
      educationMetadataString(
        item,
        "scope",
      ) ??
      educationGovernanceString(
        item,
        "scope",
      ) ??
      "Unavailable",

    version:
      educationMetadataString(
        item,
        "version",
      ) ??
      educationGovernanceString(
        item,
        "packageVersion",
      ) ??
      "Unavailable",

    provenance:
      evidenceRefs.length >
        0
        ? evidenceRefs.join(
            ", ",
          )
        : "Canonical Knowledge",

    source:
      canonicalEducationSource(
        item,
      ),

    sourceRefs:
      canonicalEducationSourceRefs(
        item,
      ),

    lineage:
      [
        ...new Set([
          ...educationMetadataStrings(
            item,
            "lineage",
          ),
          ...educationGovernanceStrings(
            item,
            "lineage",
          ),
        ]),
      ],

    dependencies:
      [
        ...new Set([
          ...educationMetadataStrings(
            item,
            "dependencies",
          ),
          ...educationGovernanceStrings(
            item,
            "dependencies",
          ),
        ]),
      ],

    supersession:
      educationMetadataString(
        item,
        "supersession",
      ) ??
      educationGovernanceStrings(
        item,
        "supersedes",
      ).join(
        ", ",
      ),

    educationalStatus:
      educationalStatus(
        item,
      ),

    educationalImpact:
      typeof item.summary ===
        "string"
        ? item.summary
        : "",

    relatedArtifacts:
      canonicalEducationRelationshipRefs(
        item,
      ),

    relatedKnowledgePackages:
      packageIds(
        item,
      ),

    relatedCanonicalKnowledge: [
      item.id,
    ],

    relatedMemory:
      educationMetadataStrings(
        item,
        "relatedMemory",
      ),

    relatedMissions:
      educationMetadataStrings(
        item,
        "relatedMissions",
      ),

    relatedDecisions:
      educationMetadataStrings(
        item,
        "relatedDecisions",
      ),

    authors:
      educationMetadataStrings(
        item,
        "authors",
      ),
  };
}
