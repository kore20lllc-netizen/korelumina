import assert from "node:assert/strict";
import test from "node:test";

import {
  KnowledgeEducationProjectionService,
} from "../KnowledgeEducationProjectionService.js";

import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";


function canonicalMissionOwnership():
  CanonicalKnowledgeItem {
  return {
    id:
      "canonical:mission-ownership",

    title:
      "Mission Ownership",

    summary:
      "Defines mission ownership, delegation, execution boundaries, and required human approval.",

    status:
      "canonical",

    metadata: {
      kind:
        "knowledge-operations",

      category:
        "Artifact",

      approvalState:
        "approved",

      authorityClass:
        "governance",

      owner:
        "Chief Systems Architect",

      scope:
        "Chief Agent mission-level orchestration.",

      version:
        "1.0",

      educationEligible:
        true,
    },
  } as unknown as
    CanonicalKnowledgeItem;
}


test(
  "M51.5j4 Mission Ownership satisfies mission curriculum presence",
  () => {
    const service =
      new KnowledgeEducationProjectionService({
        list: () => [
          canonicalMissionOwnership(),
        ],
      });

    const snapshot =
      service.snapshot();

    const competency =
      snapshot.competencies.find(
        item =>
          item.id ===
          "mission-boundaries",
      );

    assert.ok(
      competency,
    );

    assert.notEqual(
      competency.status,
      "not-started",
    );

    assert.notEqual(
      competency.evidence,
      "Mission curriculum is not present in the current Educational Corpus.",
    );
  },
);


test(
  "M51.5j4 does not treat unapproved Mission Ownership as mission curriculum",
  () => {
    const mission =
      canonicalMissionOwnership();

    mission.metadata = {
      ...mission.metadata,

      approvalState:
        "needs-review",
    };

    const service =
      new KnowledgeEducationProjectionService({
        list: () => [
          mission,
        ],
      });

    const snapshot =
      service.snapshot();

    const competency =
      snapshot.competencies.find(
        item =>
          item.id ===
          "mission-boundaries",
      );

    assert.ok(
      competency,
    );

    assert.equal(
      competency.status,
      "not-started",
    );

    assert.equal(
      competency.evidence,
      "Mission curriculum is not present in the current Educational Corpus.",
    );
  },
);
