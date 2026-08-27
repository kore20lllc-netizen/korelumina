import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveExplainableGroundingCompetencyEvidence,
} from "../ExplainableGroundingCompetencyEvidenceAdapter.js";


test(
  "completed governed reasoning with citations and explicit assumptions produces pending explainable-grounding evidence",
  () => {
    const assessment =
      deriveExplainableGroundingCompetencyEvidence({
        observedAt:
          400,

        sourceRef:
          "reasoning:reasoning:event-1",

        reasoning: {
          id:
            "reasoning:event-1",

          sessionId:
            "event-1",

          title:
            "Platform authority analysis",

          question:
            "What governs this action?",

          conclusion:
            "The Platform Constitution governs the action.",

          disposition:
            "review",

          confidence:
            0.95,

          evidence: [
            "canonical:platform-constitution",
          ],

          assumptions: [
            "No higher constitutional amendment supersedes this rule.",
          ],

          status:
            "completed",

          createdAt:
            300,

          updatedAt:
            350,

          metadata: {
            canonicalKnowledgeIds: [
              "canonical:platform-constitution",
            ],

            organizationalMemoryRecordIds:
              [],
          },
        },
      });

    assert.equal(
      assessment.eligible,
      true,
    );

    assert.deepEqual(
      assessment.missingRequirements,
      [],
    );

    assert.equal(
      assessment.evidence?.competencyId,
      "explainable-grounding",
    );

    assert.equal(
      assessment.evidence?.validationState,
      "PENDING",
    );

    assert.equal(
      assessment.evidence?.validatedBy,
      null,
    );
  },
);


test(
  "reasoning without governed source grounding cannot produce explainable-grounding evidence",
  () => {
    const assessment =
      deriveExplainableGroundingCompetencyEvidence({
        observedAt:
          400,

        sourceRef:
          "reasoning:reasoning:event-2",

        reasoning: {
          id:
            "reasoning:event-2",

          sessionId:
            "event-2",

          title:
            "Ungrounded analysis",

          question:
            "What should happen?",

          conclusion:
            "Proceed.",

          disposition:
            "authorize",

          confidence:
            1,

          evidence: [
            "plain-text-reference",
          ],

          assumptions: [
            "Assumption present.",
          ],

          status:
            "completed",

          createdAt:
            300,

          updatedAt:
            350,

          metadata: {
            canonicalKnowledgeIds:
              [],

            organizationalMemoryRecordIds:
              [],
          },
        },
      });

    assert.equal(
      assessment.eligible,
      false,
    );

    assert.equal(
      assessment.evidence,
      null,
    );

    assert.ok(
      assessment
        .missingRequirements
        .includes(
          "governed-source-grounding",
        ),
    );
  },
);


test(
  "reasoning that hides uncertainty or missing authority cannot manufacture explainable-grounding evidence",
  () => {
    const assessment =
      deriveExplainableGroundingCompetencyEvidence({
        observedAt:
          400,

        sourceRef:
          "reasoning:reasoning:event-3",

        reasoning: {
          id:
            "reasoning:event-3",

          sessionId:
            "event-3",

          title:
            "Unsupported certainty",

          question:
            "Is this authorized?",

          conclusion:
            "Yes.",

          disposition:
            "authorize",

          confidence:
            1,

          evidence: [
            "canonical:platform-constitution",
          ],

          assumptions:
            [],

          status:
            "completed",

          createdAt:
            300,

          updatedAt:
            350,

          metadata: {
            canonicalKnowledgeIds: [
              "canonical:platform-constitution",
            ],

            organizationalMemoryRecordIds:
              [],
          },
        },
      });

    assert.equal(
      assessment.eligible,
      false,
    );

    assert.equal(
      assessment.evidence,
      null,
    );

    assert.ok(
      assessment
        .missingRequirements
        .includes(
          "uncertainty-or-authority-disclosure",
        ),
    );
  },
);


test(
  "explicit missing-authority disclosure satisfies the disclosure boundary without manufacturing competency completion",
  () => {
    const assessment =
      deriveExplainableGroundingCompetencyEvidence({
        observedAt:
          400,

        sourceRef:
          "reasoning:reasoning:event-4",

        reasoning: {
          id:
            "reasoning:event-4",

          sessionId:
            "event-4",

          title:
            "Authority gap analysis",

          question:
            "Can this action be authorized?",

          conclusion:
            "Authorization cannot be established from current governed knowledge.",

          disposition:
            "review",

          confidence:
            0.6,

          evidence: [
            "canonical:platform-constitution",
          ],

          assumptions:
            [],

          status:
            "completed",

          createdAt:
            300,

          updatedAt:
            350,

          metadata: {
            canonicalKnowledgeIds: [
              "canonical:platform-constitution",
            ],

            organizationalMemoryRecordIds:
              [],

            missingAuthority:
              true,
          },
        },
      });

    assert.equal(
      assessment.eligible,
      true,
    );

    assert.equal(
      assessment.evidence?.validationState,
      "PENDING",
    );

    assert.equal(
      assessment.evidence?.validatedBy,
      null,
    );
  },
);
