import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveMissionBoundariesCompetencyEvidence,
} from "../MissionBoundariesCompetencyEvidenceAdapter.js";


test(
  "approved governed delegation produces pending mission-boundaries competency evidence",
  () => {
    const assessment =
      deriveMissionBoundariesCompetencyEvidence({
        observedAt:
          300,

        sourceRef:
          "executive-delegation:delegation:decision-1",

        delegation: {
          id:
            "delegation:decision-1",

          sessionId:
            "session-1",

          decisionId:
            "decision-1",

          assignedBy:
            "chief-agent",

          assignedTo:
            "engineer-agent",

          title:
            "Execute governed work",

          description:
            "Perform approved bounded work.",

          status:
            "assigned",

          priority:
            "high",

          createdAt:
            200,

          updatedAt:
            200,

          metadata: {
            decisionId:
              "decision-1",

            decisionStatus:
              "approved",

            approvedBy:
              "human-governance",

            decisionEvidence: [
              "canonical:platform-constitution",
            ],
          },
        },

        approval: {
          id:
            "approval:decision-1",

          sessionId:
            "session-1",

          decisionId:
            "decision-1",

          requestedBy:
            "chief-agent",

          approverId:
            "human-governance",

          status:
            "approved",

          comments:
            "Approved.",

          createdAt:
            150,

          decidedAt:
            175,

          metadata:
            {},
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
      "mission-boundaries",
    );

    assert.equal(
      assessment.evidence?.source,
      "mission",
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
  "delegation without human approval cannot produce mission-boundaries evidence",
  () => {
    const assessment =
      deriveMissionBoundariesCompetencyEvidence({
        observedAt:
          300,

        sourceRef:
          "executive-delegation:delegation:decision-1",

        delegation: {
          id:
            "delegation:decision-1",

          sessionId:
            "session-1",

          decisionId:
            "decision-1",

          assignedBy:
            "chief-agent",

          assignedTo:
            "engineer-agent",

          title:
            "Execute work",

          description:
            "Unapproved work.",

          status:
            "assigned",

          priority:
            "normal",

          createdAt:
            200,

          updatedAt:
            200,

          metadata: {
            decisionStatus:
              "approved",

            approvedBy:
              "human-governance",

            decisionEvidence: [
              "canonical:decision-evidence",
            ],
          },
        },

        approval: {
          id:
            "approval:decision-1",

          sessionId:
            "session-1",

          decisionId:
            "decision-1",

          requestedBy:
            "chief-agent",

          approverId:
            "human-governance",

          status:
            "pending",

          comments:
            "",

          createdAt:
            150,

          metadata:
            {},
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
          "approved-human-decision",
        ),
    );

    assert.ok(
      assessment
        .missingRequirements
        .includes(
          "approval-decision-time",
        ),
    );
  },
);


test(
  "mismatched approval and delegation cannot manufacture mission-boundaries evidence",
  () => {
    const assessment =
      deriveMissionBoundariesCompetencyEvidence({
        observedAt:
          300,

        sourceRef:
          "executive-delegation:delegation:decision-1",

        delegation: {
          id:
            "delegation:decision-1",

          sessionId:
            "session-1",

          decisionId:
            "decision-1",

          assignedBy:
            "chief-agent",

          assignedTo:
            "engineer-agent",

          title:
            "Execute governed work",

          description:
            "Bounded work.",

          status:
            "assigned",

          priority:
            "normal",

          createdAt:
            200,

          updatedAt:
            200,

          metadata: {
            decisionStatus:
              "approved",

            approvedBy:
              "human-governance",

            decisionEvidence: [
              "canonical:decision-evidence",
            ],
          },
        },

        approval: {
          id:
            "approval:wrong",

          sessionId:
            "session-other",

          decisionId:
            "decision-other",

          requestedBy:
            "chief-agent",

          approverId:
            "human-governance",

          status:
            "approved",

          comments:
            "Approved.",

          createdAt:
            150,

          decidedAt:
            175,

          metadata:
            {},
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
          "approval-decision-link",
        ),
    );

    assert.ok(
      assessment
        .missingRequirements
        .includes(
          "approval-session-link",
        ),
    );
  },
);
