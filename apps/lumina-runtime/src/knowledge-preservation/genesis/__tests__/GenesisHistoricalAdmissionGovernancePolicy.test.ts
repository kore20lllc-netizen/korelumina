import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisSourceManifestEntry,
  HistoricalSourceId,
} from "../index.js";

import {
  classifyGenesisHistoricalAdmission,
} from "../index.js";

function source(
  overrides: Partial<
    GenesisSourceManifestEntry
  > = {},
): GenesisSourceManifestEntry {
  return {
    historicalSourceId:
      "genesis-source:document:governance-policy-fixture" as
        HistoricalSourceId,

    sourceType:
      "document",

    evidenceType:
      "document",

    authorityClass:
      "documentation",

    provenanceLocator:
      "docs/example.md",

    sourceChecksum:
      "sha256:governance-policy-fixture",

    historicalTimestamp:
      100,

    historicalTimestampSource:
      "fixture",

    discoveredAt:
      200,

    discoveryMethod:
      "fixture",

    replayEligibility:
      "eligible",

    supersedes:
      [],

    conflictsWith:
      [],

    metadata:
      {},

    ...overrides,
  };
}

test(
  "repository commit is admitted for historical correlation without Knowledge manufacturing",
  () => {
    const result =
      classifyGenesisHistoricalAdmission(
        source({
          historicalSourceId:
            "genesis-source:commit:abc" as
              HistoricalSourceId,

          sourceType:
            "commit",

          evidenceType:
            "commit",

          authorityClass:
            "repository-history",

          provenanceLocator:
            "git:commit:abc",
        }),
      );

    assert.equal(
      result.classification,
      "historical-correlation-eligible",
    );

    assert.equal(
      result.correlationEligible,
      true,
    );

    assert.equal(
      result.invokeKnowledgeManufacturing,
      false,
    );
  },
);

test(
  "explicitly approved ADR may seed Knowledge without becoming canonical",
  () => {
    const result =
      classifyGenesisHistoricalAdmission(
        source({
          historicalSourceId:
            "genesis-source:ADR:approved" as
              HistoricalSourceId,

          sourceType:
            "ADR",

          evidenceType:
            "ADR",

          authorityClass:
            "architecture-decision",

          approvalState:
            "Approved",

          provenanceLocator:
            "docs/adr/ADR-001.md",
        }),
      );

    assert.equal(
      result.classification,
      "knowledge-seeding-eligible",
    );

    assert.equal(
      result.invokeKnowledgeManufacturing,
      true,
    );
  },
);

test(
  "approved documentation with complete manufacturing governance metadata may seed Knowledge",
  () => {
    const result =
      classifyGenesisHistoricalAdmission(
        source({
          sourceType:
            "architecture-document",

          evidenceType:
            "document",

          authorityClass:
            "architecture",

          approvalState:
            "Approved",

          authorityOwner:
            "Platform Architecture",

          authorityScope:
            "KoreLumina",

          authorityVersion:
            "1.0",

          metadata: {
            sourceLocation:
              "docs/architecture/PLATFORM.md",
          },
        }),
      );

    assert.equal(
      result.classification,
      "knowledge-seeding-eligible",
    );

    assert.equal(
      result.invokeKnowledgeManufacturing,
      true,
    );
  },
);

test(
  "approved documentation missing governed manufacturing metadata requires governance review",
  () => {
    const result =
      classifyGenesisHistoricalAdmission(
        source({
          sourceType:
            "architecture-document",

          evidenceType:
            "document",

          authorityClass:
            "architecture",

          approvalState:
            "Approved",

          authorityOwner:
            "Platform Architecture",

          authorityScope:
            undefined,

          authorityVersion:
            "1.0",

          metadata: {
            sourceLocation:
              "docs/architecture/PLATFORM.md",
          },
        }),
      );

    assert.equal(
      result.classification,
      "requires-governance-review",
    );

    assert.equal(
      result.invokeKnowledgeManufacturing,
      false,
    );

    assert.equal(
      result.correlationEligible,
      false,
    );

    assert.ok(
      result.reasons.some(
        reason =>
          reason.includes(
            "authority scope",
          ),
      ),
    );
  },
);

test(
  "documentation governance states accepted historically but not literally approved do not enter manufacturing",
  () => {
    for (
      const approvalState
      of [
        "Certified",
        "Final",
        "Ratified",
        "Active",
        "Accepted",
      ]
    ) {
      const result =
        classifyGenesisHistoricalAdmission(
          source({
            sourceType:
              "architecture-document",

            evidenceType:
              "document",

            authorityClass:
              "architecture",

            approvalState,

            authorityOwner:
              "Platform Architecture",

            authorityScope:
              "KoreLumina",

            authorityVersion:
              "1.0",

            metadata: {
              sourceLocation:
                "docs/architecture/PLATFORM.md",
            },
          }),
        );

      assert.equal(
        result.classification,
        "requires-governance-review",
        approvalState,
      );

      assert.equal(
        result.invokeKnowledgeManufacturing,
        false,
        approvalState,
      );
    }
  },
);

test(
  "ordinary documentation without approval remains historical Evidence only",
  () => {
    const result =
      classifyGenesisHistoricalAdmission(
        source(),
      );

    assert.equal(
      result.classification,
      "historical-evidence-only",
    );

    assert.equal(
      result.invokeKnowledgeManufacturing,
      false,
    );

    assert.equal(
      result.correlationEligible,
      false,
    );
  },
);

test(
  "explicit supersession makes historical Evidence correlation eligible",
  () => {
    const result =
      classifyGenesisHistoricalAdmission(
        source({
          supersedes: [
            "genesis-source:document:older" as
              HistoricalSourceId,
          ],
        }),
      );

    assert.equal(
      result.classification,
      "historical-correlation-eligible",
    );

    assert.equal(
      result.invokeKnowledgeManufacturing,
      false,
    );
  },
);

test(
  "explicit conflict requires governance review and does not manufacture Knowledge",
  () => {
    const result =
      classifyGenesisHistoricalAdmission(
        source({
          conflictsWith: [
            "genesis-source:document:conflict" as
              HistoricalSourceId,
          ],
        }),
      );

    assert.equal(
      result.classification,
      "requires-governance-review",
    );

    assert.equal(
      result.invokeKnowledgeManufacturing,
      false,
    );
  },
);

test(
  "conversation Evidence requires governance review before Knowledge seeding",
  () => {
    const result =
      classifyGenesisHistoricalAdmission(
        source({
          historicalSourceId:
            "genesis-source:conversation:conversation-a" as
              HistoricalSourceId,

          sourceType:
            "conversation",

          evidenceType:
            "conversation",

          authorityClass:
            "historical-conversation",

          provenanceLocator:
            "conversation:conversation-a",
        }),
      );

    assert.equal(
      result.classification,
      "requires-governance-review",
    );

    assert.equal(
      result.invokeKnowledgeManufacturing,
      false,
    );
  },
);

test(
  "governing source without explicit approval cannot automatically seed Knowledge",
  () => {
    const result =
      classifyGenesisHistoricalAdmission(
        source({
          authorityClass:
            "constitution",

          provenanceLocator:
            "docs/constitution/example.md",
        }),
      );

    assert.equal(
      result.classification,
      "requires-governance-review",
    );
  },
);

test(
  "policy refuses a source that Replay did not classify eligible",
  () => {
    assert.throws(
      () =>
        classifyGenesisHistoricalAdmission(
          source({
            replayEligibility:
              "blocked",
          }),
        ),
      /genesis_historical_admission_governance_requires_eligible_source/,
    );
  },
);
