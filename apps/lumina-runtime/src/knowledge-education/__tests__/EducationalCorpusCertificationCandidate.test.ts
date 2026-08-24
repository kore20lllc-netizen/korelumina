import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEducationalCorpusCertificationCandidate,
} from "../EducationalCorpusCertificationCandidate.js";

import type {
  EducationalCorpusCertificationCandidateInput,
} from "../EducationalCorpusCertificationCandidate.js";

import type {
  EducationalArtifactProjection,
} from "../projection/index.js";

import type {
  EducationalCorpus,
} from "../EducationalCorpus.js";


const constitutionalRefs = [
  "docs/canon/VISION_2050.md",
  "docs/architecture/00_PLATFORM_CONSTITUTION.md",
  "docs/governance/CONSTITUTIONAL_DOCUMENT_GOVERNANCE.md",
  "docs/architecture/amendments/CA-001_KNOWLEDGE_PACKAGE.md",
  "docs/architecture/amendments/CA-002_CANONICAL_KNOWLEDGE.md",
  "docs/architecture/amendments/CA-003_ORGANIZATIONAL_MEMORY_STEWARDSHIP.md",
  "docs/architecture/amendments/CA-004_CANONICAL_MEMORY_ADAPTATION.md",
  "docs/architecture/amendments/CA-005_LEARNING_CONSTITUTION.md",
  "docs/architecture/KORELUMINA_MASTER_ARCHITECTURE.md",
];


function artifact(
  id:
    string,

  sourceRef:
    string,
): EducationalArtifactProjection {
  return {
    id,

    title:
      id,

    kind:
      "constitution",

    category:
      "constitutional",

    authorityClass:
      "constitutional",

    approvalState:
      "approved",

    owner:
      "Constitutional Office",

    scope:
      "platform",

    version:
      "1",

    provenance:
      sourceRef,

    source:
      "canonical-knowledge",

    sourceRefs: [
      sourceRef,
    ],

    lineage:
      [],

    dependencies:
      [],

    supersession:
      "",

    educationalStatus:
      "completed",

    educationalImpact:
      "Constitutional curriculum.",

    relatedArtifacts:
      [],

    relatedKnowledgePackages:
      [],

    relatedCanonicalKnowledge: [
      id,
    ],

    relatedMemory:
      [],

    relatedMissions:
      [],

    relatedDecisions:
      [],

    authors:
      [],
  };
}


function artifacts():
  EducationalArtifactProjection[] {
  return constitutionalRefs.map(
    (
      sourceRef,
      index,
    ) =>
      artifact(
        `artifact-${index}`,
        sourceRef,
      ),
  );
}


function corpus():
  EducationalCorpus {
  const items =
    artifacts().map(
      (
        source,
        index,
      ) => ({
        itemId:
          `educational-corpus-item:${index}`,

        artifactId:
          source.id,

        learningRole:
          "CONSTITUTIONAL_CURRICULUM" as const,

        title:
          source.title,

        kind:
          source.kind,

        category:
          source.category,

        authority: {
          authorityClass:
            source.authorityClass,

          approvalState:
            source.approvalState,

          owner:
            source.owner,

          scope:
            source.scope,

          version:
            source.version,
        },

        provenance: {
          source:
            source.source,

          sourceRefs:
            source.sourceRefs,

          evidence:
            source.provenance,

          lineage:
            [],

          dependencies:
            [],

          supersession:
            "",
        },

        relationships: {
          relatedArtifacts:
            [],

          relatedKnowledgePackages:
            [],

          relatedCanonicalKnowledge: [
            source.id,
          ],

          relatedMemory:
            [],

          relatedMissions:
            [],

          relatedDecisions:
            [],
        },

        educationalImpact:
          source.educationalImpact,
      }),
    );

  return {
    corpusId:
      "educational-corpus:test",

    corpusVersion:
      "educational-corpus:v1",

    dayZeroCertificationId:
      "genesis-day-zero-certification:test",

    dayZeroCandidateId:
      "genesis-day-zero-certification-candidate:test",

    sourceContractId:
      "educational-corpus-source-contract:test",

    items,

    excluded:
      [],

    summary: {
      sourceArtifacts:
        items.length,

      curriculumItems:
        items.length,

      unresolvedItems:
        0,

      excludedItems:
        0,

      blockedItems:
        0,

      byLearningRole: {
        CONSTITUTIONAL_CURRICULUM:
          items.length,
      },
    },

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


function currentRuntime():
  EducationalCorpusCertificationCandidateInput {
  const current =
    corpus();

  return {
    state:
      "CURRENT",

    persistedCorpus:
      current,

    currentCorpus:
      current,

    sourceContract: {
      contractId:
        "educational-corpus-source-contract:test",

      dayZeroCertificationId:
        "genesis-day-zero-certification:test",

      dayZeroCandidateId:
        "genesis-day-zero-certification-candidate:test",

      assessments:
        [],

      summary: {
        artifacts:
          current.summary
            .sourceArtifacts,

        eligible:
          current.summary
            .curriculumItems,

        requiresAuthorityReview:
          0,

        excluded:
          0,

        blocked:
          0,
      },

      unresolvedArtifactIds:
        [],

      educationalCorpusCertified:
        false,

      initialCompetencyCertified:
        false,
    },

    dayZeroState:
      "VALID",

    blockers:
      [],

    unresolvedArtifactIds:
      [],

    downstream: {
      educationalCorpusCertified:
        false,

      initialCompetencyCertified:
        false,

      chiefAgentActivationAuthorized:
        false,
    },
  };
}


test(
  "CURRENT corpus with complete constitutional coverage produces READY candidate",
  () => {
    const result =
      buildEducationalCorpusCertificationCandidate({
        runtime:
          currentRuntime(),

        artifacts:
          artifacts(),
      });

    assert.equal(
      result.state,
      "READY",
    );

    assert.equal(
      result.approval.available,
      true,
    );

    assert.equal(
      result.approval
        .singleHumanApprovalRequired,
      true,
    );

    assert.equal(
      result.approval
        .perArtifactApprovalRequired,
      false,
    );

    assert.equal(
      result.coverage
        .constitutionalLiteracy
        .completion,
      100,
    );

    assert.equal(
      result.educationalCorpusCertified,
      false,
    );
  },
);


test(
  "missing required constitutional curriculum keeps candidate INCOMPLETE",
  () => {
    const current =
      currentRuntime();

    const limitedArtifacts =
      artifacts().slice(
        0,
        -1,
      );

    const persisted =
      current.persistedCorpus!;

    const retainedIds =
      new Set(
        limitedArtifacts.map(
          item =>
            item.id,
        ),
      );

    const limitedCorpus:
      EducationalCorpus = {
      ...persisted,

      corpusId:
        "educational-corpus:limited",

      items:
        persisted.items.filter(
          item =>
            retainedIds.has(
              item.artifactId,
            ),
        ),
    };

    current.persistedCorpus =
      limitedCorpus;

    current.currentCorpus =
      limitedCorpus;

    const result =
      buildEducationalCorpusCertificationCandidate({
        runtime:
          current,

        artifacts:
          limitedArtifacts,
      });

    assert.equal(
      result.state,
      "INCOMPLETE",
    );

    assert.equal(
      result.approval.available,
      false,
    );

    assert.ok(
      result.exceptions.some(
        item =>
          item.code ===
          "required-constitutional-curriculum-missing",
      ),
    );
  },
);


test(
  "unresolved authority item is surfaced as exception rather than per-artifact approval",
  () => {
    const current =
      currentRuntime();

    current.state =
      "INCOMPLETE";

    current.unresolvedArtifactIds = [
      "conversation-001",
    ];

    const result =
      buildEducationalCorpusCertificationCandidate({
        runtime:
          current,

        artifacts:
          artifacts(),
      });

    assert.equal(
      result.state,
      "INCOMPLETE",
    );

    assert.ok(
      result.exceptions.some(
        item =>
          item.category ===
            "authority-review" &&
          item.subjectId ===
            "conversation-001",
      ),
    );

    assert.equal(
      result.approval
        .perArtifactApprovalRequired,
      false,
    );
  },
);


test(
  "excluded non-curriculum material remains visible without becoming curriculum",
  () => {
    const current =
      currentRuntime();

    const persisted =
      current.persistedCorpus!;

    const excluded = {
      artifactId:
        "historical-non-curriculum",

      decision:
        "EXCLUDED" as const,

      reasons: [
        "educational-source-not-approved",
      ],
    };

    const changed:
      EducationalCorpus = {
      ...persisted,

      corpusId:
        "educational-corpus:with-exclusion",

      excluded: [
        excluded,
      ],

      summary: {
        ...persisted.summary,

        excludedItems:
          1,
      },
    };

    current.persistedCorpus =
      changed;

    current.currentCorpus =
      changed;

    const result =
      buildEducationalCorpusCertificationCandidate({
        runtime:
          current,

        artifacts:
          artifacts(),
      });

    assert.deepEqual(
      result.excludedMaterial,
      [
        excluded,
      ],
    );

    assert.equal(
      result.state,
      "READY",
    );
  },
);


test(
  "STALE persisted corpus cannot be certified",
  () => {
    const current =
      currentRuntime();

    current.state =
      "STALE";

    const result =
      buildEducationalCorpusCertificationCandidate({
        runtime:
          current,

        artifacts:
          artifacts(),
      });

    assert.equal(
      result.state,
      "INCOMPLETE",
    );

    assert.equal(
      result.approval.available,
      false,
    );
  },
);


test(
  "BLOCKED upstream state blocks certification candidate",
  () => {
    const current =
      currentRuntime();

    current.state =
      "BLOCKED";

    current.dayZeroState =
      "STALE";

    const result =
      buildEducationalCorpusCertificationCandidate({
        runtime:
          current,

        artifacts:
          artifacts(),
      });

    assert.equal(
      result.state,
      "BLOCKED",
    );

    assert.equal(
      result.approval.available,
      false,
    );
  },
);


test(
  "candidate identity is deterministic",
  () => {
    const input = {
      runtime:
        currentRuntime(),

      artifacts:
        artifacts(),
    };

    const first =
      buildEducationalCorpusCertificationCandidate(
        input,
      );

    const second =
      buildEducationalCorpusCertificationCandidate(
        input,
      );

    assert.equal(
      first.candidateId,
      second.candidateId,
    );
  },
);
