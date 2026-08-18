import assert from "node:assert/strict";
import test from "node:test";

import type {
  EvidenceType,
} from "../../evidence/index.js";

import {
  createDerivedHistoricalSourceId,
  createHistoricalSourceId,
  deriveHistoricalSourceStableKey,
} from "../index.js";

test(
  "commit identity preserves the native immutable commit SHA",
  () => {
    const id =
      createHistoricalSourceId(
        "commit",
        "abc123def456",
      );

    assert.equal(
      id,
      "genesis-source:commit:abc123def456",
    );
  },
);

test(
  "conversation identity preserves deterministic composite native identity",
  () => {
    const id =
      createHistoricalSourceId(
        "conversation",
        "conversation-42:message-0007",
      );

    assert.equal(
      id,
      "genesis-source:conversation:conversation-42:message-0007",
    );
  },
);

test(
  "document may preserve an immutable native key when one exists",
  () => {
    const id =
      createHistoricalSourceId(
        "document",
        "document-native-id-42",
      );

    assert.equal(
      id,
      "genesis-source:document:document-native-id-42",
    );
  },
);

test(
  "derived stable key is deterministic for identical provenance",
  () => {
    const input = {
      provenanceLocator:
        "docs/architecture/00_PLATFORM_CONSTITUTION.md",
    };

    const first =
      deriveHistoricalSourceStableKey(
        input,
      );

    const second =
      deriveHistoricalSourceStableKey(
        input,
      );

    assert.equal(
      first,
      second,
    );

    assert.match(
      first,
      /^derived:[a-f0-9]{64}$/,
    );
  },
);

test(
  "derived stable key changes when provenance changes",
  () => {
    const first =
      deriveHistoricalSourceStableKey({
        provenanceLocator:
          "docs/architecture/a.md",
      });

    const second =
      deriveHistoricalSourceStableKey({
        provenanceLocator:
          "docs/architecture/b.md",
      });

    assert.notEqual(
      first,
      second,
    );
  },
);

test(
  "derived source identity is deterministic",
  () => {
    const first =
      createDerivedHistoricalSourceId(
        "document",
        {
          provenanceLocator:
            "docs/example.md",
        },
      );

    const second =
      createDerivedHistoricalSourceId(
        "document",
        {
          provenanceLocator:
            "docs/example.md",
        },
      );

    assert.equal(
      first,
      second,
    );

    assert.match(
      first,
      /^genesis-source:document:derived:[a-f0-9]{64}$/,
    );
  },
);

test(
  "content mutation does not change fallback source identity",
  () => {
    const sourceId =
      createDerivedHistoricalSourceId(
        "document",
        {
          provenanceLocator:
            "docs/example.md",
        },
      );

    const firstChecksum =
      "sha256:first";

    const secondChecksum =
      "sha256:second";

    assert.notEqual(
      firstChecksum,
      secondChecksum,
    );

    assert.equal(
      sourceId,
      createDerivedHistoricalSourceId(
        "document",
        {
          provenanceLocator:
            "docs/example.md",
        },
      ),
    );
  },
);

test(
  "identity never depends on execution time",
  () => {
    const first =
      createHistoricalSourceId(
        "runtime-event",
        "runtime-event-44",
      );

    const before =
      Date.now();

    const second =
      createHistoricalSourceId(
        "runtime-event",
        "runtime-event-44",
      );

    const after =
      Date.now();

    assert.equal(
      first,
      second,
    );

    assert.ok(
      after >= before,
    );
  },
);

test(
  "stable source key is required",
  () => {
    assert.throws(
      () =>
        createHistoricalSourceId(
          "commit",
          "   ",
        ),
      /historical_source_stable_key_required/,
    );
  },
);

test(
  "derived identity requires provenance",
  () => {
    assert.throws(
      () =>
        createDerivedHistoricalSourceId(
          "document",
          {
            provenanceLocator:
              "",
          },
        ),
      /historical_source_provenance_locator_required/,
    );
  },
);

test(
  "all existing EvidenceType values remain usable as historical source identities",
  () => {
    const evidenceTypes:
      EvidenceType[] =
      [
        "conversation",
        "commit",
        "tag",
        "branch",
        "ADR",
        "RFC",
        "document",
        "source-file",
        "runtime-event",
        "engineering-execution",
        "issue",
        "pull-request",
        "specification",
        "roadmap",
        "milestone",
        "build-output",
        "incident-log",
      ];

    for (
      const evidenceType
      of evidenceTypes
    ) {
      assert.equal(
        createHistoricalSourceId(
          evidenceType,
          "stable-key",
        ),
        `genesis-source:${evidenceType}:stable-key`,
      );
    }
  },
);
