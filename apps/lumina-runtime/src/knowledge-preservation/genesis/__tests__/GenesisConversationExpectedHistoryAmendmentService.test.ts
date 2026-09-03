import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildGenesisConversationExpectedHistoryInventory,
  reconcileGenesisConversationExpectedHistory,
} from "../GenesisConversationExpectedHistoryInventory.js";

import type {
  GenesisConversationAcquisitionInventory,
} from "../GenesisConversationAcquisitionInventory.js";

import {
  FileGenesisConversationExpectedHistoryAmendmentPersistenceStore,
} from "../GenesisConversationExpectedHistoryAmendmentPersistence.js";

import {
  GenesisConversationExpectedHistoryAmendmentService,
} from "../GenesisConversationExpectedHistoryAmendmentService.js";

import type {
  GenesisConversationExpectedHistoryAmendmentReconciliationService,
} from "../GenesisConversationExpectedHistoryAmendmentService.js";

import type {
  GenesisConversationHistoryReconciliationProjection,
} from "../GenesisConversationHistoryReconciliationService.js";


function expectedHistory() {
  return buildGenesisConversationExpectedHistoryInventory({
    authority: {
      authorityId:
        "authority:test",

      authorityClass:
        "governance",

      certifiedBy:
        "reviewer",

      certifiedAt:
        100,

      scope:
        "day-zero-conversation-history",

      version:
        "v1",
    },

    conversations: [
      {
        conversationId:
          "conversation-001",

        disposition:
          "EXPECTED_RECOVERABLE",

        basis:
          "certified expected history",
      },
    ],
  });
}


function acquisition():
  GenesisConversationAcquisitionInventory {
  return {
    inventoryId:
      "genesis-conversation-acquisition-inventory:test",

    historyState:
      "ACQUIRED",

    completeness:
      "UNVERIFIED",

    configured:
      true,

    acquisitionAvailable:
      true,

    acquisitionId:
      "genesis-conversation-acquisition:test",

    acquiredConversationIds: [
      "conversation-001",
      "conversation-unexpected",
    ],

    conversationCount:
      2,

    historicalSourceCount:
      2,

    evidenceCount:
      2,

    gapCounts: {
      notYetAcquired:
        0,

      historicallyUnavailable:
        0,

      permissionBlocked:
        0,

      sourceUnavailable:
        0,
    },

    blockers: [
      "authoritative-conversation-history-inventory-not-certified",
    ],

    historicalCompletenessCertified:
      false,
  };
}


class FakeReconciliationService
implements GenesisConversationExpectedHistoryAmendmentReconciliationService {
  public expected =
    expectedHistory();

  public readonly acquired =
    acquisition();

  public saveCount =
    0;


  read():
    GenesisConversationHistoryReconciliationProjection {
    return {
      expectedHistory:
        this.expected,

      acquisitionInventory:
        this.acquired,

      reconciliation:
        reconcileGenesisConversationExpectedHistory({
          expected:
            this.expected,

          acquired:
            this.acquired,
        }),
    };
  }


  saveExpectedHistory(
    inventory:
      typeof this.expected,
  ):
    GenesisConversationHistoryReconciliationProjection {
    this.saveCount +=
      1;

    this.expected =
      inventory;

    return this.read();
  }
}


function request(
  previousInventoryId:
    ReturnType<
      typeof expectedHistory
    >["inventoryId"],
) {
  return {
    expectedPreviousInventoryId:
      previousInventoryId,

    decision: {
      conversationId:
        "conversation-unexpected",

      amendedBy:
        "human-governor",

      amendedAt:
        200,

      reason:
        "Legitimate historical conversation acquired after authoritative inventory creation.",
    },
  } as const;
}


test(
  "service persists lineage before replacing authority and reconciliation becomes complete",
  () => {
    const storageRoot =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "genesis-amendment-",
        ),
      );

    try {
      const reconciliationService =
        new FakeReconciliationService();

      const original =
        reconciliationService.expected;

      const persistence =
        new FileGenesisConversationExpectedHistoryAmendmentPersistenceStore({
          storageRoot,
        });

      const service =
        new GenesisConversationExpectedHistoryAmendmentService(
          reconciliationService,
          persistence,
        );

      const projection =
        service.amend(
          request(
            original.inventoryId,
          ),
        );

      assert.equal(
        reconciliationService.saveCount,
        1,
      );

      assert.equal(
        projection.amendment.previousInventoryId,
        original.inventoryId,
      );

      assert.notEqual(
        projection.amendment.amendedInventoryId,
        original.inventoryId,
      );

      assert.equal(
        projection.reconciliation
          .reconciliation
          ?.state,
        "COMPLETE",
      );

      assert.deepEqual(
        projection.reconciliation
          .reconciliation
          ?.unexpectedAcquiredConversationIds,
        [],
      );

      const lineage =
        persistence.loadById(
          projection.amendment.amendmentId,
        );

      assert.ok(
        lineage,
      );

      assert.equal(
        lineage.previousInventory.inventoryId,
        original.inventoryId,
      );

      assert.equal(
        lineage.amendment.amendedInventoryId,
        reconciliationService
          .expected
          .inventoryId,
      );
    } finally {
      rmSync(
        storageRoot,
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
  "same governed request is idempotent after authority replacement",
  () => {
    const storageRoot =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "genesis-amendment-idempotent-",
        ),
      );

    try {
      const reconciliationService =
        new FakeReconciliationService();

      const originalId =
        reconciliationService
          .expected
          .inventoryId;

      const persistence =
        new FileGenesisConversationExpectedHistoryAmendmentPersistenceStore({
          storageRoot,
        });

      const service =
        new GenesisConversationExpectedHistoryAmendmentService(
          reconciliationService,
          persistence,
        );

      const first =
        service.amend(
          request(
            originalId,
          ),
        );

      const second =
        service.amend(
          request(
            originalId,
          ),
        );

      assert.equal(
        first.amendment.amendmentId,
        second.amendment.amendmentId,
      );

      assert.equal(
        reconciliationService.saveCount,
        1,
      );

      assert.equal(
        second.reconciliation
          .reconciliation
          ?.state,
        "COMPLETE",
      );
    } finally {
      rmSync(
        storageRoot,
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
  "persisted lineage can resume authority replacement after interruption",
  () => {
    const storageRoot =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "genesis-amendment-resume-",
        ),
      );

    try {
      const reconciliationService =
        new FakeReconciliationService();

      const original =
        reconciliationService.expected;

      const persistence =
        new FileGenesisConversationExpectedHistoryAmendmentPersistenceStore({
          storageRoot,
        });

      const service =
        new GenesisConversationExpectedHistoryAmendmentService(
          reconciliationService,
          persistence,
        );

      const first =
        service.amend(
          request(
            original.inventoryId,
          ),
        );

      /*
       * Simulate a process crash state where lineage survived but
       * authoritative current inventory did not.
       */
      reconciliationService.expected =
        original;

      reconciliationService.saveCount =
        0;

      const resumed =
        service.amend(
          request(
            original.inventoryId,
          ),
        );

      assert.equal(
        resumed.amendment.amendmentId,
        first.amendment.amendmentId,
      );

      assert.equal(
        reconciliationService.saveCount,
        1,
      );

      assert.equal(
        resumed.reconciliation
          .reconciliation
          ?.state,
        "COMPLETE",
      );
    } finally {
      rmSync(
        storageRoot,
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
  "service rejects stale previous inventory identity",
  () => {
    const storageRoot =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "genesis-amendment-stale-",
        ),
      );

    try {
      const reconciliationService =
        new FakeReconciliationService();

      const persistence =
        new FileGenesisConversationExpectedHistoryAmendmentPersistenceStore({
          storageRoot,
        });

      const service =
        new GenesisConversationExpectedHistoryAmendmentService(
          reconciliationService,
          persistence,
        );

      assert.throws(
        () =>
          service.amend({
            expectedPreviousInventoryId:
              "genesis-conversation-expected-history:stale",

            decision: {
              conversationId:
                "conversation-unexpected",

              amendedBy:
                "human-governor",

              amendedAt:
                200,

              reason:
                "stale request",
            },
          }),
        /genesis_conversation_expected_history_amendment_stale_previous_inventory/,
      );

      assert.equal(
        reconciliationService.saveCount,
        0,
      );
    } finally {
      rmSync(
        storageRoot,
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
  "persistence rejects conflicting payload for the same amendment identity",
  () => {
    const storageRoot =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "genesis-amendment-conflict-",
        ),
      );

    try {
      const reconciliationService =
        new FakeReconciliationService();

      const original =
        reconciliationService.expected;

      const persistence =
        new FileGenesisConversationExpectedHistoryAmendmentPersistenceStore({
          storageRoot,
        });

      const service =
        new GenesisConversationExpectedHistoryAmendmentService(
          reconciliationService,
          persistence,
        );

      const projection =
        service.amend(
          request(
            original.inventoryId,
          ),
        );

      const historyFile =
        path.join(
          storageRoot,
          "history",
          `${projection.amendment.amendmentId}.json`,
        );

      const stored =
        JSON.parse(
          readFileSync(
            historyFile,
            "utf8",
          ),
        );

      stored.amendment.reason =
        "tampered reason";

      const conflictingStore =
        new FileGenesisConversationExpectedHistoryAmendmentPersistenceStore({
          storageRoot,
        });

      assert.throws(
        () =>
          conflictingStore.save(
            stored,
          ),
        /genesis_conversation_expected_history_amendment_persistence_identity_conflict/,
      );
    } finally {
      rmSync(
        storageRoot,
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
