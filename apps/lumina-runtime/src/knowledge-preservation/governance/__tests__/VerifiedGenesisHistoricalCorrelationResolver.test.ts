import assert from "node:assert/strict";
import test from "node:test";

import {
  createGenesisReplayAdmissionIdentity,
  createGenesisSyntheticEvidenceId,
  createHistoricalSourceId,
} from "../../genesis/index.js";

import type {
  GenesisHistoricalCorrelationState,
  GenesisReplayExecution,
  GenesisReplayId,
} from "../../genesis/index.js";

import type {
  KnowledgePackage,
} from "../../package/index.js";

import {
  VerifiedGenesisHistoricalCorrelationResolver,
} from "../VerifiedGenesisHistoricalCorrelationResolver.js";


const COMMIT_SHA =
  "1111111111111111111111111111111111111111";

const CHECKSUM =
  "sha256:" +
  "2".repeat(64);

const HISTORICAL_SOURCE_ID =
  createHistoricalSourceId(
    "commit",
    COMMIT_SHA,
  );

const REPLAY_ID =
  (
    "genesis-replay:" +
    "3".repeat(64)
  ) as GenesisReplayId;

const SOURCE_REFERENCE_ID =
  "genesis-source-ref:" +
  "4".repeat(64);

const SOURCE_REVISION_ID =
  "genesis-source-revision:" +
  "5".repeat(64);

const EVENT_ID =
  "genesis-event:" +
  "6".repeat(64);


function fixture() {
  const manifestEntry = {
    historicalSourceId:
      HISTORICAL_SOURCE_ID,

    sourceType:
      "commit",

    evidenceType:
      "commit",

    stableSourceKey:
      COMMIT_SHA,

    sourceChecksum:
      CHECKSUM,

    provenanceLocator:
      `git:commit:${COMMIT_SHA}`,

    historicalTimestamp:
      1,

    historicalTimestampSource:
      "git-committer-time",

    discoveredAt:
      1,

    discoveryMethod:
      "git-history-v1",

    authorityClass:
      "repository-history",

    replayEligibility:
      "eligible",

    supersedes:
      [],

    conflictsWith:
      [],

    metadata: {
      commitSha:
        COMMIT_SHA,
    },
  } as const;

  const planEntry = {
    manifestIndex:
      0,

    historicalSourceId:
      HISTORICAL_SOURCE_ID,

    sourceChecksum:
      CHECKSUM,

    action:
      "ADMIT",
  } as const;

  const manifest = {
    manifestId:
      "genesis-manifest:test",

    replayContractVersion:
      "1.0",

    scope: {
      repository:
        "kore20lllc-netizen/korelumina",
    },

    entries: [
      manifestEntry,
    ],
  };

  const admissionIdentity =
    createGenesisReplayAdmissionIdentity({
      replayId:
        REPLAY_ID,

      manifestId:
        manifest.manifestId,

      repository:
        manifest.scope.repository,

      manifestIndex:
        0,

      planEntry:
        planEntry as never,

      manifestEntry:
        manifestEntry as never,
    });

  const evidenceId =
    createGenesisSyntheticEvidenceId(
      admissionIdentity,
    );

  const execution = {
    plan: {
      replayId:
        REPLAY_ID,

      manifestId:
        manifest.manifestId,

      replayContractVersion:
        manifest.replayContractVersion,

      entries: [
        planEntry,
      ],
    },

    manifest,

    state: {
      dispositions: [
        {
          historicalSourceId:
            HISTORICAL_SOURCE_ID,

          disposition:
            "ADMITTED",

          evidenceId,
        },
      ],
    },

    checkpoint:
      null,
  } as unknown as GenesisReplayExecution;

  const correlation = {
    sourceReferences: [
      {
        sourceReferenceId:
          SOURCE_REFERENCE_ID,

        sourceRevisionId:
          SOURCE_REVISION_ID,

        sourceIdentity:
          HISTORICAL_SOURCE_ID,

        sourceClass:
          "commit",

        evidenceType:
          "commit",

        sourceRevision:
          CHECKSUM,

        provenance: {
          locator:
            `git:commit:${COMMIT_SHA}`,

          externalSource:
            false,
        },

        integrity: {
          checksum:
            CHECKSUM,

          acquisitionState:
            "acquired",

          acquiredAt:
            1,
        },

        metadata: {
          historicalSourceId:
            HISTORICAL_SOURCE_ID,
        },
      },
    ],

    events: [
      {
        eventId:
          EVENT_ID,

        kind:
          "implementation-committed",

        observationKey:
          HISTORICAL_SOURCE_ID,

        occurredAt:
          1,

        sourceReferenceIds: [
          SOURCE_REFERENCE_ID,
        ],

        sourceRevisionIds: [
          SOURCE_REVISION_ID,
        ],

        temporalAuthority: {
          historical: {
            status:
              "historically-observed",

            authorityClass:
              "repository-history",
          },

          current: {
            status:
              "unknown",

            authorityClass:
              "repository-history",
          },
        },

        metadata: {
          historicalSourceId:
            HISTORICAL_SOURCE_ID,
        },
      },
    ],

    relationships:
      [],

    episodes:
      [],
  } as unknown as GenesisHistoricalCorrelationState;

  const knowledgePackage = {
    id:
      "KP-2026-000009",

    sourceEvidenceRefs: [
      evidenceId,
    ],

    metadata: {
      governanceException: {
        type:
          "incomplete_governance_identity",

        disposition:
          "manual_reclassification_required",

        source:
          "legacy_governance_identity_audit",

        recordedAt:
          1,

        recordedBy:
          "human:founder",
      },
    },
  } as unknown as KnowledgePackage;

  return {
    evidenceId,
    execution,
    correlation,
    knowledgePackage,
  };
}


function harness(
  mutate?: (
    value:
      ReturnType<typeof fixture>,
  ) => void,
) {
  const value =
    fixture();

  mutate?.(value);

  const packageService = {
    get(
      id:
        string,
    ) {
      return id ===
        value.knowledgePackage.id
        ? value.knowledgePackage
        : undefined;
    },
  };

  const replayReader = {
    listReplayIds() {
      return [
        REPLAY_ID,
      ];
    },

    loadExecution(
      replayId:
        GenesisReplayId,
    ) {
      return replayId ===
        REPLAY_ID
        ? value.execution
        : null;
    },
  };

  const correlationReader = {
    load(
      replayId:
        GenesisReplayId,
    ) {
      return replayId ===
        REPLAY_ID
        ? value.correlation
        : null;
    },
  };

  return {
    value,

    resolver:
      new VerifiedGenesisHistoricalCorrelationResolver(
        packageService as never,
        replayReader,
        correlationReader,
      ),
  };
}


test(
  "resolves deterministic Genesis historical correlation proof",
  () => {
    const {
      value,
      resolver,
    } =
      harness();

    const proof =
      resolver.resolveForPackage(
        "KP-2026-000009",
      );

    assert.deepEqual(
      proof,
      {
        replayId:
          REPLAY_ID,

        evidenceId:
          value.evidenceId,

        historicalSourceId:
          HISTORICAL_SOURCE_ID,

        sourceReferenceId:
          SOURCE_REFERENCE_ID,

        sourceRevisionId:
          SOURCE_REVISION_ID,

        eventId:
          EVENT_ID,

        eventKind:
          "implementation-committed",

        sourceChecksum:
          CHECKSUM,
      },
    );
  },
);

test(
  "requires durable governance quarantine",
  () => {
    const {
      resolver,
    } =
      harness(
        value => {
          value.knowledgePackage.metadata =
            {};
        },
      );

    assert.throws(
      () =>
        resolver.resolveForPackage(
          "KP-2026-000009",
        ),
      /governance_exception_required/,
    );
  },
);

test(
  "requires exactly one evidence reference",
  () => {
    const {
      resolver,
    } =
      harness(
        value => {
          value
            .knowledgePackage
            .sourceEvidenceRefs
            .push(
              "genesis-evidence:other",
            );
        },
      );

    assert.throws(
      () =>
        resolver.resolveForPackage(
          "KP-2026-000009",
        ),
      /single_evidence_required/,
    );
  },
);

test(
  "missing replay disposition fails closed",
  () => {
    const {
      resolver,
    } =
      harness(
        value => {
          value.execution.state.dispositions =
            [];
        },
      );

    assert.throws(
      () =>
        resolver.resolveForPackage(
          "KP-2026-000009",
        ),
      /replay_disposition_not_found/,
    );
  },
);

test(
  "source checksum mismatch fails closed",
  () => {
    const {
      resolver,
    } =
      harness(
        value => {
          value
            .correlation
            .sourceReferences[0]
            .integrity
            .checksum =
            "sha256:" +
            "9".repeat(64);
        },
      );

    assert.throws(
      () =>
        resolver.resolveForPackage(
          "KP-2026-000009",
        ),
      /source_integrity_mismatch/,
    );
  },
);

test(
  "wrong event kind fails closed",
  () => {
    const {
      resolver,
    } =
      harness(
        value => {
          value
            .correlation
            .events[0]
            .kind =
            "other";
        },
      );

    assert.throws(
      () =>
        resolver.resolveForPackage(
          "KP-2026-000009",
        ),
      /event_kind_mismatch/,
    );
  },
);

test(
  "event must reference verified source revision",
  () => {
    const {
      resolver,
    } =
      harness(
        value => {
          value
            .correlation
            .events[0]
            .sourceRevisionIds =
            [];
        },
      );

    assert.throws(
      () =>
        resolver.resolveForPackage(
          "KP-2026-000009",
        ),
      /event_source_mismatch/,
    );
  },
);
