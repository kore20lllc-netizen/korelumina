import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  rmSync,
} from "node:fs";

import path from "node:path";
import {
  tmpdir,
} from "node:os";

import {
  FileEducationalCorpusPersistenceStore,
} from "../EducationalCorpusPersistence.js";

import {
  EducationalCorpusRuntimeService,
} from "../EducationalCorpusRuntimeService.js";

import type {
  EducationalArtifactProjection,
} from "../projection/index.js";

import type {
  KnowledgeEducationSnapshot,
} from "../KnowledgeEducationProjectionService.js";

import type {
  GenesisDayZeroCertification,
  GenesisDayZeroCertificationRuntimeProjection,
} from "../../knowledge-preservation/genesis/index.js";


function artifact(
  input: {
    id:
      string;

    kind:
      EducationalArtifactProjection[
        "kind"
      ];
  },
): EducationalArtifactProjection {
  return {
    id:
      input.id,

    title:
      input.id,

    kind:
      input.kind,

    category:
      "curriculum",

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
      `evidence:${input.id}`,

    source:
      "canonical-knowledge",

    sourceRefs: [
      `docs/${input.id}.md`,
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
      `Learn ${input.id}`,

    relatedArtifacts:
      [],

    relatedKnowledgePackages:
      [],

    relatedCanonicalKnowledge: [
      input.id,
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


function educationSnapshot(
  artifacts:
    EducationalArtifactProjection[],
): KnowledgeEducationSnapshot {
  return {
    state:
      "success",

    artifacts,

    modules:
      [],

    competencies:
      [],

    timeline:
      [],

    generatedAt:
      1000,

    source:
      "canonical-knowledge",
  };
}


function validDayZero():
  GenesisDayZeroCertificationRuntimeProjection {
  const certification:
    GenesisDayZeroCertification = {
    certificationId:
      "genesis-day-zero-certification:test",

    certificationVersion:
      "genesis-day-zero-certification:v1",

    state:
      "CERTIFIED",

    candidateId:
      "genesis-day-zero-certification-candidate:test",

    certifiedBy:
      "human",

    certifiedAt:
      1000,

    reason:
      "accepted",

    provenance: {
      repositorySeedCertificationId:
        "repository",

      corpusProjectionId:
        "genesis-corpus",

      conversationExpectedInventoryId:
        "expected",

      conversationAcquisitionInventoryId:
        "acquisition",

      conversationCorrelationProjectionId:
        "correlation",
    },

    certifiedHistoricalGaps: {
      historicallyUnavailableConversationIds:
        [],
    },

    downstream: {
      educationalCorpusCertified:
        false,

      initialCompetencyCertified:
        false,

      chiefAgentActivationAuthorized:
        false,
    },
  };

  return {
    state:
      "VALID",

    candidate: {
      candidateId:
        "genesis-day-zero-certification-candidate:test",

      state:
        "READY",

      repositoryNative: {
        certificationId:
          "genesis-repository-seed-certification:test",

        state:
          "CERTIFIED",

        replayExact:
          true,

        totalSources:
          1,

        completedSources:
          1,

        blockedSources:
          0,
      },

      conversationHistory: {
        expectedHistoryPresent:
          true,

        expectedInventoryId:
          "expected",

        acquisitionInventoryId:
          "acquisition",

        reconciliationState:
          "COMPLETE",

        authorityId:
          "authority",

        authorityVersion:
          "1",

        expectedRecoverableConversationIds:
          [],

        acquiredExpectedConversationIds:
          [],

        notYetAcquiredConversationIds:
          [],

        historicallyUnavailableConversationIds:
          [],

        unexpectedAcquiredConversationIds:
          [],
      },

      correlation: {
        projectionId:
          "genesis-conversation-correlation-completeness:test",

        state:
          "COMPLETE",

        conversationManifestSources:
          0,

        admittedConversationSources:
          0,

        correlatedConversationSources:
          0,

        correlatedConversationEvents:
          0,

        unresolvedExplicitLinks:
          0,

        episodeLineageGaps:
          0,
      },

      corpus: {
        projectionId:
          "genesis-corpus-projection:test",

        sourceRevisions:
          1,

        historicalEvents:
          1,

        relationships:
          0,

        evolutionEpisodes:
          0,

        pendingExternalEpisodes:
          0,
      },

      provenance: {
        repositorySeedCertificationId:
          "repository",

        corpusProjectionId:
          "genesis-corpus",

        conversationExpectedInventoryId:
          "expected",

        conversationAcquisitionInventoryId:
          "acquisition",

        conversationCorrelationProjectionId:
          "correlation",
      },

      visibleHistoricalGaps: {
        historicallyUnavailableConversationIds:
          [],

        notYetAcquiredConversationIds:
          [],

        unexpectedAcquiredConversationIds:
          [],

        unresolvedExplicitHistoricalLinks:
          [],

        episodeLineageGaps:
          [],
      },

      blockers:
        [],

      dayZeroGenesisCertified:
        false,
    },

    certification,

    validation: {
      state:
        "VALID",

      certificationId:
        certification
          .certificationId,

      currentCandidateId:
        certification
          .candidateId,

      blockers:
        [],
    },

    downstream: {
      educationalCorpusCertified:
        false,

      initialCompetencyCertified:
        false,

      chiefAgentActivationAuthorized:
        false,
    },

    approval: {
      projectionId:
        "genesis-day-zero-certification-approval:test",

      state:
        "CERTIFIED",

      certificationState:
        "VALID",

      candidateId:
        certification
          .candidateId,

      summary: {
        repositorySources:
          1,

        repositorySourcesCompleted:
          1,

        expectedRecoverableConversations:
          0,

        acquiredExpectedConversations:
          0,

        conversationManifestSources:
          0,

        admittedConversationSources:
          0,

        correlatedConversationSources:
          0,

        correlatedConversationEvents:
          0,

        historicalEvents:
          1,

        relationships:
          0,

        evolutionEpisodes:
          0,

        historicallyUnavailableConversations:
          0,

        unresolvedExceptions:
          0,
      },

      acknowledgedHistoricalGaps:
        [],

      exceptions:
        [],

      approval: {
        singleHumanApprovalRequired:
          true,

        perConversationApprovalRequired:
          false,

        available:
          false,

        reason:
          "certified",
      },

      downstream: {
        educationalCorpusCertified:
          false,

        initialCompetencyCertified:
          false,

        chiefAgentActivationAuthorized:
          false,
      },
    },
  };
}


test(
  "without persisted corpus Runtime reports UNSET when current corpus is complete",
  () => {
    const service =
      new EducationalCorpusRuntimeService(
        {
          load:
            () =>
              null,

          save:
            () => {},
        },

        {
          snapshot:
            () =>
              educationSnapshot([
                artifact({
                  id:
                    "constitution",

                  kind:
                    "constitution",
                }),
              ]),
        },

        {
          read:
            () =>
              validDayZero(),
        },
      );

    const result =
      service.read();

    assert.equal(
      result.state,
      "UNSET",
    );

    assert.ok(
      result.currentCorpus,
    );

    assert.equal(
      result.downstream
        .educationalCorpusCertified,
      false,
    );
  },
);


test(
  "persistCurrent writes current corpus and then reports CURRENT",
  () => {
    let persisted =
      null as ReturnType<
        EducationalCorpusRuntimeService[
          "read"
        ]
      >["currentCorpus"];

    const service =
      new EducationalCorpusRuntimeService(
        {
          load:
            () =>
              persisted,

          save:
            corpus => {
              persisted =
                corpus;
            },
        },

        {
          snapshot:
            () =>
              educationSnapshot([
                artifact({
                  id:
                    "constitution",

                  kind:
                    "constitution",
                }),
              ]),
        },

        {
          read:
            () =>
              validDayZero(),
        },
      );

    const result =
      service.persistCurrent();

    assert.equal(
      result.state,
      "CURRENT",
    );

    assert.ok(
      result.persistedCorpus,
    );
  },
);


test(
  "persisted corpus becomes STALE when current governed artifacts change",
  () => {
    let artifacts = [
      artifact({
        id:
          "constitution",

        kind:
          "constitution",
      }),
    ];

    let persisted:
      ReturnType<
        EducationalCorpusRuntimeService[
          "read"
        ]
      >["currentCorpus"] =
      null;

    const service =
      new EducationalCorpusRuntimeService(
        {
          load:
            () =>
              persisted,

          save:
            corpus => {
              persisted =
                corpus;
            },
        },

        {
          snapshot:
            () =>
              educationSnapshot(
                artifacts,
              ),
        },

        {
          read:
            () =>
              validDayZero(),
        },
      );

    service.persistCurrent();

    artifacts = [
      ...artifacts,

      artifact({
        id:
          "architecture",

        kind:
          "architecture",
      }),
    ];

    const result =
      service.read();

    assert.equal(
      result.state,
      "STALE",
    );

    assert.ok(
      result.blockers.includes(
        "persisted-educational-corpus-stale",
      ),
    );
  },
);


test(
  "unresolved source authority produces INCOMPLETE rather than silently current",
  () => {
    const unresolved =
      artifact({
        id:
          "conversation",

        kind:
          "conversation",
      });

    const service =
      new EducationalCorpusRuntimeService(
        {
          load:
            () =>
              null,

          save:
            () => {},
        },

        {
          snapshot:
            () =>
              educationSnapshot([
                unresolved,
              ]),
        },

        {
          read:
            () =>
              validDayZero(),
        },
      );

    const result =
      service.read();

    assert.equal(
      result.state,
      "INCOMPLETE",
    );

    assert.deepEqual(
      result.unresolvedArtifactIds,
      [
        "conversation",
      ],
    );
  },
);


test(
  "invalid Day-0 certification blocks Educational Corpus validity",
  () => {
    const blockedDayZero =
      validDayZero();

    blockedDayZero.state =
      "STALE";

    const service =
      new EducationalCorpusRuntimeService(
        {
          load:
            () =>
              null,

          save:
            () => {},
        },

        {
          snapshot:
            () =>
              educationSnapshot([
                artifact({
                  id:
                    "constitution",

                  kind:
                    "constitution",
                }),
              ]),
        },

        {
          read:
            () =>
              blockedDayZero,
        },
      );

    const result =
      service.read();

    assert.equal(
      result.state,
      "BLOCKED",
    );

    assert.equal(
      result.currentCorpus,
      null,
    );
  },
);


test(
  "file persistence round-trips Educational Corpus",
  () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-educational-corpus-",
        ),
      );

    try {
      const store =
        new FileEducationalCorpusPersistenceStore({
          storageRoot:
            root,
        });

      const service =
        new EducationalCorpusRuntimeService(
          store,

          {
            snapshot:
              () =>
                educationSnapshot([
                  artifact({
                    id:
                      "constitution",

                    kind:
                      "constitution",
                  }),
                ]),
          },

          {
            read:
              () =>
                validDayZero(),
          },
        );

      const result =
        service.persistCurrent();

      assert.equal(
        result.state,
        "CURRENT",
      );

      assert.deepEqual(
        store.load(),
        result.currentCorpus,
      );
    } finally {
      rmSync(
        root,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);
