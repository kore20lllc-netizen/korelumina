import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  rmSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import {
  certifyGenesisDayZero,
} from "../GenesisDayZeroCertification.js";

import {
  FileGenesisDayZeroCertificationPersistenceStore,
} from "../GenesisDayZeroCertificationPersistence.js";

import {
  GenesisDayZeroCertificationService,
} from "../GenesisDayZeroCertificationService.js";

import type {
  GenesisDayZeroCertificationCandidate,
} from "../GenesisDayZeroCertificationCandidate.js";


function candidate():
  GenesisDayZeroCertificationCandidate {
  return {
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
        "genesis-conversation-expected-history:test",

      acquisitionInventoryId:
        "genesis-conversation-acquisition-inventory:test",

      reconciliationState:
        "COMPLETE",

      authorityId:
        "day-zero-authority",

      authorityVersion:
        "1",

      expectedRecoverableConversationIds: [
        "conversation-001",
      ],

      acquiredExpectedConversationIds: [
        "conversation-001",
      ],

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
        1,

      admittedConversationSources:
        1,

      correlatedConversationSources:
        1,

      correlatedConversationEvents:
        1,

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
        "genesis-repository-seed-certification:test",

      corpusProjectionId:
        "genesis-corpus-projection:test",

      conversationExpectedInventoryId:
        "genesis-conversation-expected-history:test",

      conversationAcquisitionInventoryId:
        "genesis-conversation-acquisition-inventory:test",

      conversationCorrelationProjectionId:
        "genesis-conversation-correlation-completeness:test",
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
  };
}


function decision() {
  return {
    certifiedBy:
      "korelumina-human-governance",

    certifiedAt:
      1000,

    reason:
      "Reviewed and accepted.",

    acknowledgedHistoricallyUnavailableConversationIds:
      [],
  };
}


test(
  "persists and reloads Day-0 certification artifact",
  () => {
    const root =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-day-zero-certification-",
        ),
      );

    try {
      const store =
        new FileGenesisDayZeroCertificationPersistenceStore({
          storageRoot:
            root,
        });

      const certification =
        certifyGenesisDayZero({
          candidate:
            candidate(),

          decision:
            decision(),
        });

      store.save(
        certification,
      );

      assert.deepEqual(
        store.load(),
        certification,
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


test(
  "runtime projection is UNSET until human certification exists",
  () => {
    const service =
      new GenesisDayZeroCertificationService(
        {
          load:
            () =>
              null,

          save:
            () => {},
        },

        {
          readCurrentCandidate:
            () =>
              candidate(),
        },
      );

    const projection =
      service.read();

    assert.equal(
      projection.state,
      "UNSET",
    );

    assert.equal(
      projection.certification,
      null,
    );

    assert.equal(
      projection.downstream
        .chiefAgentActivationAuthorized,
      false,
    );
  },
);


test(
  "service certifies current candidate and returns VALID projection",
  () => {
    let persisted =
      null as ReturnType<
        typeof certifyGenesisDayZero
      > | null;

    const service =
      new GenesisDayZeroCertificationService(
        {
          load:
            () =>
              persisted,

          save:
            certification => {
              persisted =
                certification;
            },
        },

        {
          readCurrentCandidate:
            () =>
              candidate(),
        },
      );

    const projection =
      service.certify(
        decision(),
      );

    assert.equal(
      projection.state,
      "VALID",
    );

    assert.ok(
      projection.certification,
    );

    assert.equal(
      projection.downstream
        .educationalCorpusCertified,
      false,
    );
  },
);


test(
  "persisted certification becomes STALE when authoritative candidate changes",
  () => {
    const original =
      candidate();

    const certification =
      certifyGenesisDayZero({
        candidate:
          original,

        decision:
          decision(),
      });

    const changed:
      GenesisDayZeroCertificationCandidate = {
      ...original,

      candidateId:
        "genesis-day-zero-certification-candidate:changed",

      provenance: {
        ...original.provenance,

        corpusProjectionId:
          "genesis-corpus-projection:changed",
      },
    };

    const service =
      new GenesisDayZeroCertificationService(
        {
          load:
            () =>
              certification,

          save:
            () => {},
        },

        {
          readCurrentCandidate:
            () =>
              changed,
        },
      );

    const projection =
      service.read();

    assert.equal(
      projection.state,
      "STALE",
    );

    assert.ok(
      projection.validation
        ?.blockers.includes(
          "genesis-corpus-projection-changed",
        ),
    );
  },
);
