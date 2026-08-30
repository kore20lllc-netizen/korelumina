import assert from "node:assert/strict";
import test from "node:test";

import {
  composeHistoricalConversationIntoDayZeroCoverage,
  measureDayZeroEducationalCoverage,
} from "../DayZeroEducationalCoverage.js";

import {
  buildEducationalCorpusCertificationCandidate,
} from "../EducationalCorpusCertificationCandidate.js";

import {
  certifiedEducationalCoverageRequirements,
  coverageRequirementsForModule,
} from "../measurement/index.js";

import type {
  HistoricalConversationEducationalCoverageResult,
} from "../HistoricalConversationEducationalCoverage.js";

import type {
  EducationalArtifactProjection,
} from "../projection/index.js";


function artifacts(
  selectedConversation:
    readonly string[] | null = null,
): EducationalArtifactProjection[] {
  const selected =
    selectedConversation === null
      ? null
      : new Set(
          selectedConversation,
        );

  return certifiedEducationalCoverageRequirements.flatMap(
    definition =>
      definition.requirements
        .filter(
          requirement =>
            definition.moduleId !==
              "conversation-curriculum" ||
            selected === null ||
            selected.has(
              requirement.id,
            ),
        )
        .map(
          (
            requirement,
            index,
          ) => {
            const sourceRef =
              requirement.match.sourceRefs?.[0] ??
              `coverage:${definition.moduleId}:${requirement.id}`;

            const id =
              requirement.match.artifactIds?.[0] ??
              `artifact:${definition.moduleId}:${requirement.id}:${index}`;

            return {
              id,
              title:
                requirement.match.titleIncludes?.[0] ??
                requirement.description,

              kind:
                (
                  requirement.match.kinds?.[0] ??
                  "knowledge-operations"
                ) as EducationalArtifactProjection["kind"],

              category:
                requirement.match.categories?.[0] ??
                "curriculum",

              authorityClass:
                "constitutional",

              approvalState:
                "approved",

              owner:
                "governance",

              scope:
                "platform",

              version:
                "1",

              provenance:
                sourceRef,

              source:
                "canonical-knowledge",

              sourceRefs:
                requirement.match.sourceRefs ??
                [],

              lineage:
                [],

              dependencies:
                [],

              supersession:
                "",

              educationalStatus:
                "completed",

              educationalImpact:
                requirement.description,

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
          },
        ),
  );
}


function conversationIds():
  string[] {
  return coverageRequirementsForModule(
    "conversation-curriculum",
  )
    .map(
      requirement =>
        requirement.id,
    )
    .sort();
}


function historical(
  satisfied:
    readonly string[],
): HistoricalConversationEducationalCoverageResult {
  const governed =
    conversationIds();

  const satisfiedRequirements =
    [
      ...new Set(
        satisfied,
      ),
    ].sort();

  const satisfiedSet =
    new Set(
      satisfiedRequirements,
    );

  return {
    version:
      "historical-conversation-educational-coverage:v1",

    moduleId:
      "conversation-curriculum",

    satisfiedRequirements,

    missingRequirements:
      governed.filter(
        requirementId =>
          !satisfiedSet.has(
            requirementId,
          ),
      ),

    contributors:
      satisfiedRequirements.map(
        (
          requirementId,
          index,
        ) => ({
          requirementId,
          evidenceId:
            `evidence:${index}`,
          evidenceTitle:
            requirementId,
          historicalSourceId:
            `historical-source:${index}`,
          conversationId:
            `conversation:${index}`,
          messageId:
            `message:${index}`,
          recordIds:
            [`record:${index}`],
          episodeIds:
            [`episode:${index}`],
          sourceReferenceIds:
            [`source-reference:${index}`],
          sourceRevisionIds:
            [`source-revision:${index}`],
          eventIds:
            [`event:${index}`],
        }),
      ),

    satisfiedCount:
      satisfiedRequirements.length,

    requirementCount:
      governed.length,

    completion:
      Math.round(
        (
          satisfiedRequirements.length /
          governed.length
        ) *
          100,
      ),

    complete:
      satisfiedRequirements.length ===
        governed.length,

    governingAuthority:
      false,
  };
}


function currentWithoutConversation() {
  return measureDayZeroEducationalCoverage(
    artifacts(
      [],
    ),
  );
}


test(
  "current-only coverage remains unchanged",
  () => {
    const current =
      measureDayZeroEducationalCoverage(
        artifacts(),
      );

    assert.deepEqual(
      composeHistoricalConversationIntoDayZeroCoverage(
        current,
        null,
      ),
      current,
    );
  },
);


test(
  "historical-only conversation coverage contributes",
  () => {
    const ids =
      conversationIds();

    const result =
      composeHistoricalConversationIntoDayZeroCoverage(
        currentWithoutConversation(),
        historical([
          ids[0]!,
        ]),
      );

    assert.deepEqual(
      result.modules[
        "conversation-curriculum"
      ].satisfiedRequirements,
      [
        ids[0],
      ],
    );
  },
);


test(
  "mixed lanes union requirement IDs",
  () => {
    const ids =
      conversationIds();

    const current =
      measureDayZeroEducationalCoverage(
        artifacts([
          ids[0]!,
        ]),
      );

    const result =
      composeHistoricalConversationIntoDayZeroCoverage(
        current,
        historical([
          ids[1]!,
          ids[2]!,
        ]),
      );

    assert.deepEqual(
      result.modules[
        "conversation-curriculum"
      ].satisfiedRequirements,
      [
        ids[0],
        ids[1],
        ids[2],
      ].sort(),
    );
  },
);


test(
  "duplicate requirement counts once",
  () => {
    const [
      requirementId,
    ] =
      conversationIds();

    const current =
      measureDayZeroEducationalCoverage(
        artifacts([
          requirementId!,
        ]),
      );

    const result =
      composeHistoricalConversationIntoDayZeroCoverage(
        current,
        historical([
          requirementId!,
        ]),
      );

    assert.equal(
      result.modules[
        "conversation-curriculum"
      ].satisfiedCount,
      1,
    );
  },
);


test(
  "partial historical coverage remains incomplete",
  () => {
    const ids =
      conversationIds();

    const result =
      composeHistoricalConversationIntoDayZeroCoverage(
        currentWithoutConversation(),
        historical([
          ids[0]!,
          ids[1]!,
        ]),
      );

    assert.deepEqual(
      result.modules[
        "conversation-curriculum"
      ].missingRequirements,
      ids.slice(
        2,
      ),
    );
  },
);


test(
  "full historical coverage completes all five requirements",
  () => {
    const ids =
      conversationIds();

    assert.equal(
      ids.length,
      5,
    );

    const result =
      composeHistoricalConversationIntoDayZeroCoverage(
        currentWithoutConversation(),
        historical(
          ids,
        ),
      );

    const conversation =
      result.modules[
        "conversation-curriculum"
      ];

    assert.equal(
      conversation.satisfiedCount,
      5,
    );

    assert.equal(
      conversation.requirementCount,
      5,
    );

    assert.equal(
      conversation.completion,
      100,
    );

    assert.deepEqual(
      conversation.missingRequirements,
      [],
    );
  },
);


test(
  "non-conversation modules remain unchanged",
  () => {
    const current =
      currentWithoutConversation();

    const result =
      composeHistoricalConversationIntoDayZeroCoverage(
        current,
        historical(
          conversationIds(),
        ),
      );

    for (
      const moduleId
      of current.requiredModules
    ) {
      if (
        moduleId ===
          "conversation-curriculum"
      ) {
        continue;
      }

      assert.deepEqual(
        result.modules[
          moduleId
        ],
        current.modules[
          moduleId
        ],
      );
    }
  },
);


test(
  "composition is deterministic",
  () => {
    const ids =
      conversationIds();

    const first =
      composeHistoricalConversationIntoDayZeroCoverage(
        currentWithoutConversation(),
        historical(
          ids,
        ),
      );

    const reversed =
      historical(
        ids,
      );

    const second =
      composeHistoricalConversationIntoDayZeroCoverage(
        currentWithoutConversation(),
        {
          ...reversed,
          satisfiedRequirements:
            [
              ...reversed.satisfiedRequirements,
            ].reverse(),
        },
      );

    assert.deepEqual(
      first,
      second,
    );
  },
);


test(
  "historical authority remains false",
  () => {
    const input =
      historical(
        conversationIds(),
      );

    composeHistoricalConversationIntoDayZeroCoverage(
      currentWithoutConversation(),
      input,
    );

    assert.equal(
      input.governingAuthority,
      false,
    );
  },
);


function candidateRuntime(
  currentArtifacts:
    readonly EducationalArtifactProjection[],

  coverage:
    HistoricalConversationEducationalCoverageResult,
): any {
  const corpus = {
    corpusId:
      "educational-corpus:k136",

    sourceContractId:
      "educational-corpus-source-contract:k136",

    dayZeroCertificationId:
      "genesis-day-zero-certification:k136",

    items:
      currentArtifacts.map(
        artifact => ({
          artifactId:
            artifact.id,
        }),
      ),

    excluded:
      [],

    summary: {
      sourceArtifacts:
        currentArtifacts.length,

      curriculumItems:
        currentArtifacts.length,

      unresolvedItems:
        0,

      excludedItems:
        0,

      blockedItems:
        0,
    },
  };

  return {
    state:
      "CURRENT",

    persistedCorpus:
      corpus,

    currentCorpus:
      corpus,

    sourceContract:
      null,

    historicalConversationCoverage:
      coverage,

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
  "candidate is incomplete for partial historical coverage and removes conversation exceptions when full",
  () => {
    const ids =
      conversationIds();

    const currentArtifacts =
      artifacts(
        [],
      );

    const partial =
      buildEducationalCorpusCertificationCandidate({
        runtime:
          candidateRuntime(
            currentArtifacts,
            historical([
              ids[0]!,
            ]),
          ),

        artifacts:
          currentArtifacts,
      });

    assert.equal(
      partial.state,
      "INCOMPLETE",
    );

    assert.equal(
      partial.exceptions.filter(
        exception =>
          exception.code ===
            "required-day-zero-curriculum-missing:conversation-curriculum",
      ).length,
      4,
    );

    const full =
      buildEducationalCorpusCertificationCandidate({
        runtime:
          candidateRuntime(
            currentArtifacts,
            historical(
              ids,
            ),
          ),

        artifacts:
          currentArtifacts,
      });

    assert.equal(
      full.state,
      "READY",
    );

    assert.equal(
      full.exceptions.some(
        exception =>
          exception.code ===
            "required-day-zero-curriculum-missing:conversation-curriculum",
      ),
      false,
    );
  },
);
