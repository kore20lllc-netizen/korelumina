import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildGenesisDayZeroConversationCoverageEvidence,
} from "../GenesisDayZeroConversationCoverageEvidence.js";

import {
  FileGenesisDayZeroConversationCoverageCertificationPersistenceStore,
} from "../GenesisDayZeroConversationCoverageCertificationPersistence.js";

import {
  GenesisDayZeroConversationCoverageCertificationService,
} from "../GenesisDayZeroConversationCoverageCertificationService.js";

import type {
  GenesisDayZeroConversationCoverageEvidence,
} from "../GenesisDayZeroConversationCoverageEvidence.js";


function readyEvidence():
  GenesisDayZeroConversationCoverageEvidence {
  return {
    evidenceId:
      "genesis-day-zero-conversation-coverage-evidence:test",

    evidenceVersion:
      "genesis-day-zero-conversation-coverage-evidence:v1",

    state:
      "READY_FOR_REVIEW",

    expectedInventoryId:
      "genesis-conversation-expected-history:test",

    authorityId:
      "authority:test",

    authorityVersion:
      "genesis-conversation-expected-history-authority:v1",

    expectedRecoverableConversationIds: [
      "conversation-a",
    ],

    acquiredExpectedConversationIds: [
      "conversation-a",
    ],

    notYetAcquiredConversationIds:
      [],

    historicallyUnavailableConversationIds:
      [],

    unexpectedAcquiredConversationIds:
      [],

    correlationProjectionId:
      "genesis-conversation-correlation-completeness:test",

    reconciliationComplete:
      true,

    correlationComplete:
      true,

    governedExpectedHistoryPresent:
      true,

    blockers:
      [],

    dayZeroConversationCoverageCertified:
      false,
  };
}


class EvidenceServiceStub {
  constructor(
    private value:
      GenesisDayZeroConversationCoverageEvidence,
  ) {}

  read():
    GenesisDayZeroConversationCoverageEvidence {
    return this.value;
  }

  replace(
    value:
      GenesisDayZeroConversationCoverageEvidence,
  ):
    void {
    this.value =
      value;
  }
}


test(
  "persists and reloads Day-0 conversation coverage certification",
  () => {
    const root =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-day-zero-conversation-coverage-",
        ),
      );

    try {
      const persistence =
        new FileGenesisDayZeroConversationCoverageCertificationPersistenceStore({
          storageRoot:
            root,
        });

      const evidenceService =
        new EvidenceServiceStub(
          readyEvidence(),
        );

      const service =
        new GenesisDayZeroConversationCoverageCertificationService(
          persistence,
          evidenceService,
        );

      const initial =
        service.read();

      assert.equal(
        initial.state,
        "UNSET",
      );

      assert.equal(
        initial.certificationAvailable,
        true,
      );

      assert.equal(
        initial.dayZeroConversationCoverageCertified,
        false,
      );

      const certified =
        service.certify({
          certifiedBy:
            "operator-1",

          certifiedAt:
            500,

          reason:
            "Governed Day-0 conversation coverage certified.",
        });

      assert.equal(
        certified.state,
        "VALID",
      );

      assert.equal(
        certified.dayZeroConversationCoverageCertified,
        true,
      );

      assert.ok(
        persistence.load(),
      );

      const reread =
        service.read();

      assert.equal(
        reread.state,
        "VALID",
      );

      assert.equal(
        reread.dayZeroConversationCoverageCertified,
        true,
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
  "marks persisted certification stale when current evidence changes",
  () => {
    const root =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-day-zero-conversation-coverage-stale-",
        ),
      );

    try {
      const persistence =
        new FileGenesisDayZeroConversationCoverageCertificationPersistenceStore({
          storageRoot:
            root,
        });

      const evidenceService =
        new EvidenceServiceStub(
          readyEvidence(),
        );

      const service =
        new GenesisDayZeroConversationCoverageCertificationService(
          persistence,
          evidenceService,
        );

      service.certify({
        certifiedBy:
          "operator-1",

        certifiedAt:
          500,

        reason:
          "Coverage certified.",
      });

      evidenceService.replace({
        ...readyEvidence(),

        evidenceId:
          "genesis-day-zero-conversation-coverage-evidence:changed",
      });

      const projection =
        service.read();

      assert.equal(
        projection.state,
        "STALE",
      );

      assert.equal(
        projection.dayZeroConversationCoverageCertified,
        false,
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
  "refuses a second distinct certification",
  () => {
    const root =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-day-zero-conversation-coverage-duplicate-",
        ),
      );

    try {
      const persistence =
        new FileGenesisDayZeroConversationCoverageCertificationPersistenceStore({
          storageRoot:
            root,
        });

      const evidenceService =
        new EvidenceServiceStub(
          readyEvidence(),
        );

      const service =
        new GenesisDayZeroConversationCoverageCertificationService(
          persistence,
          evidenceService,
        );

      service.certify({
        certifiedBy:
          "operator-1",

        certifiedAt:
          500,

        reason:
          "Coverage certified.",
      });

      assert.throws(
        () =>
          service.certify({
            certifiedBy:
              "operator-2",

            certifiedAt:
              600,

            reason:
              "Second certification.",
          }),
        /already_exists/,
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
