import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisSourceManifestEntry,
} from "../GenesisSourceManifest.js";

import {
  buildGenesisDocumentationGovernanceProjection,
} from "../GenesisDocumentationGovernance.js";

function entry(
  overrides:
    Partial<
      GenesisSourceManifestEntry
    > = {},
): GenesisSourceManifestEntry {
  return {
    historicalSourceId:
      "genesis-source:document:fixture",

    sourceType:
      "document",

    evidenceType:
      "document",

    authorityClass:
      "documentation",

    approvalState:
      undefined,

    provenanceLocator:
      "docs/example.md",

    sourceChecksum:
      "sha256:fixture",

    historicalTimestamp:
      1_000,

    historicalTimestampSource:
      "fixture",

    discoveredAt:
      2_000,

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
  "canonical document with canonical approval is governing",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          provenanceLocator:
            "docs/canon/VISION_2050.md",

          authorityClass:
            "Supreme",

          approvalState:
            "Canonical",

          authorityScope:
            "organization-wide",
        }),
      ]);

    const document =
      projection.documents[0];

    assert.equal(
      document.governanceClass,
      "canon",
    );

    assert.equal(
      document.authorityEffect,
      "governing",
    );

    assert.equal(
      document.currentAuthority,
      "governing",
    );
  },
);

test(
  "constitutional document remains distinct from generic architecture",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          provenanceLocator:
            "docs/architecture/00_PLATFORM_CONSTITUTION.md",

          sourceType:
            "architecture-document",

          authorityClass:
            "Constitution",

          approvalState:
            "Authoritative",
        }),
      ]);

    assert.equal(
      projection.documents[0]
        .governanceClass,
      "constitution",
    );
  },
);

test(
  "RFC remains proposal even though it is historical evidence",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          historicalSourceId:
            "genesis-source:RFC:rfc-1",

          sourceType:
            "RFC",

          evidenceType:
            "RFC",

          provenanceLocator:
            "docs/rfc/RFC-001.md",

          authorityClass:
            "request-for-comments",

          approvalState:
            "Proposed",
        }),
      ]);

    assert.equal(
      projection.documents[0]
        .authorityEffect,
      "proposal",
    );

    assert.equal(
      projection.documents[0]
        .currentAuthority,
      "non-governing",
    );
  },
);

test(
  "certification is evidentiary and does not become architecture authority",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          provenanceLocator:
            "docs/certification/RUNTIME.md",

          authorityClass:
            "Certification",

          approvalState:
            "Complete",
        }),
      ]);

    assert.equal(
      projection.documents[0]
        .governanceClass,
      "certification",
    );

    assert.equal(
      projection.documents[0]
        .authorityEffect,
      "evidentiary",
    );

    assert.equal(
      projection.documents[0]
        .currentAuthority,
      "non-governing",
    );
  },
);

test(
  "audit reports evidence without becoming governing architecture",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          provenanceLocator:
            "docs/architecture/ARCHITECTURE_AUDIT.md",

          approvalState:
            "Audit",
        }),
      ]);

    assert.equal(
      projection.documents[0]
        .governanceClass,
      "audit",
    );

    assert.equal(
      projection.documents[0]
        .authorityEffect,
      "evidentiary",
    );
  },
);

test(
  "roadmap remains planning authority rather than proof of implementation",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          historicalSourceId:
            "genesis-source:roadmap:roadmap-1",

          sourceType:
            "roadmap",

          evidenceType:
            "roadmap",

          provenanceLocator:
            "docs/roadmaps/GENESIS.md",

          authorityClass:
            "roadmap",

          approvalState:
            "Active",
        }),
      ]);

    assert.equal(
      projection.documents[0]
        .authorityEffect,
      "planning",
    );
  },
);

test(
  "superseded document remains inspectable but is not current authority",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          approvalState:
            "Superseded",

          supersedes: [
            "genesis-source:document:older",
          ],
        }),
      ]);

    const document =
      projection.documents[0];

    assert.equal(
      document.currentAuthority,
      "superseded",
    );

    assert.equal(
      document.historicalAuthority,
      "historical",
    );

    assert.deepEqual(
      document.supersedes,
      [
        "genesis-source:document:older",
      ],
    );
  },
);

test(
  "archive material remains historical evidence only",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          provenanceLocator:
            "docs/architecture/archive/OLD_SPEC.md",

          approvalState:
            "Archived",
        }),
      ]);

    assert.equal(
      projection.documents[0]
        .governanceClass,
      "archive",
    );

    assert.equal(
      projection.documents[0]
        .currentAuthority,
      "archived",
    );
  },
);

test(
  "explicit authority owner scope version and effective period are preserved",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          approvalState:
            "Approved",

          authorityOwner:
            "Constitutional Office",

          authorityScope:
            "Genesis",

          authorityVersion:
            "2.1",

          effectiveFrom:
            "2026-06-01",

          effectiveTo:
            "2026-07-31",
        }),
      ]);

    const document =
      projection.documents[0];

    assert.equal(
      document.authorityOwner,
      "Constitutional Office",
    );

    assert.equal(
      document.authorityScope,
      "Genesis",
    );

    assert.equal(
      document.authorityVersion,
      "2.1",
    );

    assert.deepEqual(
      document.effectivePeriod,
      {
        from:
          "2026-06-01",

        to:
          "2026-07-31",

        source:
          "declared",
      },
    );
  },
);

test(
  "effective period is not inferred from historical timestamp",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          approvalState:
            "Approved",

          historicalTimestamp:
            1_700_000_000_000,
        }),
      ]);

    assert.deepEqual(
      projection.documents[0]
        .effectivePeriod,
      {
        from:
          null,

        to:
          null,

        source:
          "not-declared",
      },
    );
  },
);

test(
  "missing approval state remains unresolved rather than becoming authority from path",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          provenanceLocator:
            "docs/architecture/IMPORTANT.md",

          sourceType:
            "architecture-document",

          authorityClass:
            "architecture",

          approvalState:
            undefined,
        }),
      ]);

    const document =
      projection.documents[0];

    assert.equal(
      document.governanceClass,
      "architecture",
    );

    assert.equal(
      document.authorityEffect,
      "unresolved",
    );

    assert.equal(
      document.currentAuthority,
      "unresolved",
    );

    assert.ok(
      document
        .governanceGaps
        .includes(
          "approval-state-not-declared",
        ),
    );
  },
);

test(
  "newer version does not outrank approved authority by version number alone",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          historicalSourceId:
            "genesis-source:document:approved",

          sourceChecksum:
            "sha256:approved",

          provenanceLocator:
            "docs/architecture/APPROVED.md",

          authorityVersion:
            "1",

          approvalState:
            "Approved",
        }),

        entry({
          historicalSourceId:
            "genesis-source:document:draft",

          sourceChecksum:
            "sha256:draft",

          provenanceLocator:
            "docs/architecture/DRAFT.md",

          authorityVersion:
            "99",

          approvalState:
            "Draft",
        }),
      ]);

    const approved =
      projection.documents.find(
        (
          document,
        ) =>
          document
            .historicalSourceId ===
          "genesis-source:document:approved",
      );

    const draft =
      projection.documents.find(
        (
          document,
        ) =>
          document
            .historicalSourceId ===
          "genesis-source:document:draft",
      );

    assert.ok(
      approved,
    );

    assert.ok(
      draft,
    );

    assert.equal(
      approved.currentAuthority,
      "governing",
    );

    assert.equal(
      draft.currentAuthority,
      "non-governing",
    );
  },
);

test(
  "complete status alone does not create governing authority",
  () => {
    const projection =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          sourceType:
            "architecture-document",

          authorityClass:
            "architecture",

          approvalState:
            "Complete",
        }),
      ]);

    assert.equal(
      projection.documents[0]
        .currentAuthority,
      "unresolved",
    );
  },
);

test(
  "projection identity is deterministic",
  () => {
    const entries = [
      entry({
        approvalState:
          "Approved",
      }),
    ];

    assert.equal(
      buildGenesisDocumentationGovernanceProjection(
        entries,
      ).projectionId,

      buildGenesisDocumentationGovernanceProjection(
        entries,
      ).projectionId,
    );
  },
);

test(
  "equivalent source ordering does not change governance projection",
  () => {
    const entries = [
      entry({
        historicalSourceId:
          "genesis-source:document:a",

        sourceChecksum:
          "sha256:a",

        approvalState:
          "Approved",
      }),

      entry({
        historicalSourceId:
          "genesis-source:document:b",

        sourceChecksum:
          "sha256:b",

        approvalState:
          "Draft",
      }),
    ];

    const first =
      buildGenesisDocumentationGovernanceProjection(
        entries,
      );

    const second =
      buildGenesisDocumentationGovernanceProjection(
        [
          ...entries,
        ].reverse(),
      );

    assert.equal(
      first.projectionId,
      second.projectionId,
    );

    assert.deepEqual(
      first.documents,
      second.documents,
    );
  },
);

test(
  "governance metadata revision changes projection while preserving Historical Source identity",
  () => {
    const historicalSourceId =
      "genesis-source:document:stable-governance-source";

    const draft =
      entry({
        historicalSourceId,

        sourceChecksum:
          "sha256:draft-governance-revision",

        provenanceLocator:
          "docs/architecture/GOVERNED.md",

        authorityClass:
          "architecture",

        approvalState:
          "Draft",

        authorityScope:
          "Genesis",

        authorityVersion:
          "1",
      });

    const approved =
      entry({
        historicalSourceId,

        sourceChecksum:
          "sha256:approved-governance-revision",

        provenanceLocator:
          "docs/architecture/GOVERNED.md",

        authorityClass:
          "architecture",

        approvalState:
          "Approved",

        authorityScope:
          "Genesis",

        authorityVersion:
          "1",
      });

    const first =
      buildGenesisDocumentationGovernanceProjection([
        draft,
      ]);

    const second =
      buildGenesisDocumentationGovernanceProjection([
        approved,
      ]);

    assert.equal(
      first.documents[0]
        .historicalSourceId,
      second.documents[0]
        .historicalSourceId,
    );

    assert.notEqual(
      first.projectionId,
      second.projectionId,
    );

    assert.equal(
      first.documents[0]
        .currentAuthority,
      "non-governing",
    );

    assert.equal(
      second.documents[0]
        .currentAuthority,
      "governing",
    );
  },
);

test(
  "newer timestamp and larger version cannot restore superseded document authority",
  () => {
    const olderApproved =
      entry({
        historicalSourceId:
          "genesis-source:document:approved-old",

        sourceChecksum:
          "sha256:approved-old",

        provenanceLocator:
          "docs/architecture/APPROVED_OLD.md",

        authorityClass:
          "architecture",

        approvalState:
          "Approved",

        authorityVersion:
          "1",

        historicalTimestamp:
          1_000,
      });

    const newerSuperseded =
      entry({
        historicalSourceId:
          "genesis-source:document:superseded-new",

        sourceChecksum:
          "sha256:superseded-new",

        provenanceLocator:
          "docs/architecture/SUPERSEDED_NEW.md",

        authorityClass:
          "architecture",

        approvalState:
          "Superseded",

        authorityVersion:
          "999",

        historicalTimestamp:
          9_999_999,
      });

    const projection =
      buildGenesisDocumentationGovernanceProjection([
        newerSuperseded,
        olderApproved,
      ]);

    const approved =
      projection.documents.find(
        (
          document,
        ) =>
          document
            .historicalSourceId ===
          olderApproved
            .historicalSourceId,
      );

    const superseded =
      projection.documents.find(
        (
          document,
        ) =>
          document
            .historicalSourceId ===
          newerSuperseded
            .historicalSourceId,
      );

    assert.ok(
      approved,
    );

    assert.ok(
      superseded,
    );

    assert.equal(
      approved.currentAuthority,
      "governing",
    );

    assert.equal(
      superseded.currentAuthority,
      "superseded",
    );

    assert.equal(
      superseded.authorityVersion,
      "999",
    );
  },
);

test(
  "declared effective-period revision changes governance projection identity without changing source identity",
  () => {
    const historicalSourceId =
      "genesis-source:document:effective-period";

    const first =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          historicalSourceId,

          sourceChecksum:
            "sha256:effective-period-v1",

          approvalState:
            "Approved",

          authorityScope:
            "Genesis",

          effectiveFrom:
            "2026-01-01",

          effectiveTo:
            undefined,
        }),
      ]);

    const second =
      buildGenesisDocumentationGovernanceProjection([
        entry({
          historicalSourceId,

          sourceChecksum:
            "sha256:effective-period-v2",

          approvalState:
            "Approved",

          authorityScope:
            "Genesis",

          effectiveFrom:
            "2026-01-01",

          effectiveTo:
            "2026-06-30",
        }),
      ]);

    assert.equal(
      first.documents[0]
        .historicalSourceId,
      second.documents[0]
        .historicalSourceId,
    );

    assert.notEqual(
      first.projectionId,
      second.projectionId,
    );

    assert.deepEqual(
      second.documents[0]
        .effectivePeriod,
      {
        from:
          "2026-01-01",

        to:
          "2026-06-30",

        source:
          "declared",
      },
    );
  },
);
