import {
  createHash,
} from "node:crypto";

import type {
  EducationalCorpusLearningRole,
} from "./EducationalCorpusAuthorityPolicy.js";

import type {
  EducationalCorpusSourceContract,
} from "./EducationalCorpusSourceContract.js";

import type {
  EducationalArtifactProjection,
} from "./projection/index.js";


export const EDUCATIONAL_CORPUS_VERSION =
  "educational-corpus:v1" as const;


export type EducationalCorpusId =
  `educational-corpus:${string}`;


export interface EducationalCorpusItem {
  itemId:
    string;

  artifactId:
    string;

  learningRole:
    EducationalCorpusLearningRole;

  title:
    string;

  kind:
    EducationalArtifactProjection[
      "kind"
    ];

  category:
    string;

  authority: {
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
  };

  provenance: {
    source:
      string;

    sourceRefs:
      readonly string[];

    evidence:
      string;

    lineage:
      readonly string[];

    dependencies:
      readonly string[];

    supersession:
      string;
  };

  relationships: {
    relatedArtifacts:
      readonly string[];

    relatedKnowledgePackages:
      readonly string[];

    relatedCanonicalKnowledge:
      readonly string[];

    relatedMemory:
      readonly string[];

    relatedMissions:
      readonly string[];

    relatedDecisions:
      readonly string[];
  };

  educationalImpact:
    string;
}


export interface EducationalCorpusExcludedItem {
  artifactId:
    string;

  decision:
    "REQUIRES_AUTHORITY_REVIEW" |
    "EXCLUDED" |
    "BLOCKED";

  reasons:
    readonly string[];
}


export interface EducationalCorpus {
  corpusId:
    EducationalCorpusId;

  corpusVersion:
    typeof EDUCATIONAL_CORPUS_VERSION;

  dayZeroCertificationId:
    string;

  dayZeroCandidateId:
    string;

  sourceContractId:
    EducationalCorpusSourceContract[
      "contractId"
    ];

  items:
    readonly EducationalCorpusItem[];

  excluded:
    readonly EducationalCorpusExcludedItem[];

  summary: {
    sourceArtifacts:
      number;

    curriculumItems:
      number;

    unresolvedItems:
      number;

    excludedItems:
      number;

    blockedItems:
      number;

    byLearningRole:
      Readonly<
        Partial<
          Record<
            EducationalCorpusLearningRole,
            number
          >
        >
      >;
  };

  state:
    "ASSEMBLED";

  /*
   * Assembly is not certification and does not establish mastery.
   */
  educationalCorpusCertified:
    false;

  initialCompetencyCertified:
    false;

  chiefAgentActivationAuthorized:
    false;
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
          key => [
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


function sortedUnique(
  values:
    readonly string[],
): readonly string[] {
  return [
    ...new Set(
      values,
    ),
  ].sort();
}


function itemId(
  input: {
    artifactId:
      string;

    learningRole:
      EducationalCorpusLearningRole;

    sourceContractId:
      string;
  },
): string {
  return `educational-corpus-item:${hash(
    input,
  )}`;
}


export function assembleEducationalCorpus(
  input: {
    artifacts:
      readonly EducationalArtifactProjection[];

    sourceContract:
      EducationalCorpusSourceContract;
  },
): EducationalCorpus {
  if (
    input.sourceContract
      .educationalCorpusCertified !==
      false
  ) {
    throw new Error(
      "educational_corpus_source_contract_certification_boundary_invalid",
    );
  }

  const artifactById =
    new Map(
      input.artifacts.map(
        artifact => [
          artifact.id,
          artifact,
        ],
      ),
    );

  if (
    artifactById.size !==
    input.artifacts.length
  ) {
    throw new Error(
      "educational_corpus_duplicate_artifact_id",
    );
  }

  const items:
    EducationalCorpusItem[] =
      [];

  const excluded:
    EducationalCorpusExcludedItem[] =
      [];

  for (
    const assessment
    of input.sourceContract
      .assessments
  ) {
    const artifact =
      artifactById.get(
        assessment.artifactId,
      );

    if (
      !artifact
    ) {
      throw new Error(
        `educational_corpus_assessed_artifact_missing:${assessment.artifactId}`,
      );
    }

    if (
      assessment.decision ===
        "ELIGIBLE"
    ) {
      if (
        assessment.learningRole ===
        null
      ) {
        throw new Error(
          `educational_corpus_eligible_learning_role_missing:${assessment.artifactId}`,
        );
      }

      items.push({
        itemId:
          itemId({
            artifactId:
              artifact.id,

            learningRole:
              assessment.learningRole,

            sourceContractId:
              input.sourceContract
                .contractId,
          }),

        artifactId:
          artifact.id,

        learningRole:
          assessment.learningRole,

        title:
          artifact.title,

        kind:
          artifact.kind,

        category:
          artifact.category,

        authority: {
          authorityClass:
            assessment.authority
              .authorityClass,

          approvalState:
            assessment.authority
              .approvalState,

          owner:
            assessment.authority
              .owner,

          scope:
            assessment.authority
              .scope,

          version:
            assessment.authority
              .version,
        },

        provenance: {
          source:
            artifact.source,

          sourceRefs:
            sortedUnique(
              artifact.sourceRefs,
            ),

          evidence:
            artifact.provenance,

          lineage:
            sortedUnique(
              artifact.lineage,
            ),

          dependencies:
            sortedUnique(
              artifact.dependencies,
            ),

          supersession:
            artifact.supersession,
        },

        relationships: {
          relatedArtifacts:
            sortedUnique(
              artifact.relatedArtifacts,
            ),

          relatedKnowledgePackages:
            sortedUnique(
              artifact.relatedKnowledgePackages,
            ),

          relatedCanonicalKnowledge:
            sortedUnique(
              artifact.relatedCanonicalKnowledge,
            ),

          relatedMemory:
            sortedUnique(
              artifact.relatedMemory,
            ),

          relatedMissions:
            sortedUnique(
              artifact.relatedMissions,
            ),

          relatedDecisions:
            sortedUnique(
              artifact.relatedDecisions,
            ),
        },

        educationalImpact:
          artifact.educationalImpact,
      });

      continue;
    }

    excluded.push({
      artifactId:
        assessment.artifactId,

      decision:
        assessment.decision,

      reasons: [
        ...assessment.reasons,
      ].sort(),
    });
  }

  items.sort(
    (
      left,
      right,
    ) =>
      left.learningRole.localeCompare(
        right.learningRole,
      ) ||
      left.artifactId.localeCompare(
        right.artifactId,
      ),
  );

  excluded.sort(
    (
      left,
      right,
    ) =>
      left.decision.localeCompare(
        right.decision,
      ) ||
      left.artifactId.localeCompare(
        right.artifactId,
      ),
  );

  const byLearningRole:
    Partial<
      Record<
        EducationalCorpusLearningRole,
        number
      >
    > = {};

  for (
    const item
    of items
  ) {
    byLearningRole[
      item.learningRole
    ] =
      (
        byLearningRole[
          item.learningRole
        ] ??
        0
      ) +
      1;
  }

  const summary = {
    sourceArtifacts:
      input.sourceContract
        .summary.artifacts,

    curriculumItems:
      items.length,

    unresolvedItems:
      excluded.filter(
        item =>
          item.decision ===
          "REQUIRES_AUTHORITY_REVIEW",
      ).length,

    excludedItems:
      excluded.filter(
        item =>
          item.decision ===
          "EXCLUDED",
      ).length,

    blockedItems:
      excluded.filter(
        item =>
          item.decision ===
          "BLOCKED",
      ).length,

    byLearningRole,
  };

  const corpusId =
    `educational-corpus:${hash({
      corpusVersion:
        EDUCATIONAL_CORPUS_VERSION,

      dayZeroCertificationId:
        input.sourceContract
          .dayZeroCertificationId,

      dayZeroCandidateId:
        input.sourceContract
          .dayZeroCandidateId,

      sourceContractId:
        input.sourceContract
          .contractId,

      items,

      excluded,

      summary,
    })}` as EducationalCorpusId;

  return {
    corpusId,

    corpusVersion:
      EDUCATIONAL_CORPUS_VERSION,

    dayZeroCertificationId:
      input.sourceContract
        .dayZeroCertificationId,

    dayZeroCandidateId:
      input.sourceContract
        .dayZeroCandidateId,

    sourceContractId:
      input.sourceContract
        .contractId,

    items,

    excluded,

    summary,

    state:
      "ASSEMBLED",

    educationalCorpusCertified:
      false,

    initialCompetencyCertified:
      false,

    chiefAgentActivationAuthorized:
      false,
  };
}
