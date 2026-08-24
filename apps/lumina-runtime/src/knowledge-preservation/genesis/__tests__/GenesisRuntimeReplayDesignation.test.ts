import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  FileGenesisRuntimeReplayDesignationStore,
  GENESIS_RUNTIME_REPLAY_DESIGNATION_VERSION,
  isGenesisRuntimeReplayEligible,
  resolveGenesisRuntimeReplaySelection,
} from "../GenesisRuntimeReplayDesignation.js";

import type {
  GenesisRuntimeReplayDesignation,
} from "../GenesisRuntimeReplayDesignation.js";

import type {
  GenesisReplayId,
} from "../GenesisReplayIdentity.js";

import type {
  GenesisReplayInventory,
} from "../GenesisReplayInventoryService.js";

import type {
  GenesisReplayStatusSnapshot,
} from "../GenesisReplayStatusService.js";


const replayOne =
  `genesis-replay:${"1".repeat(
    64,
  )}` as
    GenesisReplayId;

const replayTwo =
  `genesis-replay:${"2".repeat(
    64,
  )}` as
    GenesisReplayId;


function eligibleReplay(
  replayId:
    GenesisReplayId,
): GenesisReplayStatusSnapshot {
  return {
    replayId,

    found:
      true,

    manifestPresent:
      true,

    executionPresent:
      true,

    manifestId:
      "genesis-manifest:test",

    manifestReadiness:
      "READY",

    manifestErrors:
      0,

    totalManifestSources:
      3,

    executionStatus:
      "completed",

    corpusStatus:
      "COMPLETE",

    currentManifestIndex:
      null,

    currentHistoricalSourceId:
      null,

    lastCompletedManifestIndex:
      2,

    progress: {
      totalSources:
        3,

      completedSources:
        3,

      admittedSources:
        1,

      skippedSources:
        2,

      blockedSources:
        0,
    },

    checkpoint:
      null,

    runnerOutcome:
      "COMPLETED",

    runnerFailure:
      null,

    recovery: {
      eligible:
        false,

      reason:
        "ALREADY_COMPLETED",
    },

    admittedEvidenceIds:
      [],

    admissionLinks:
      [],

    allAdmittedEvidenceLinked:
      true,
  };
}


function inventory(
  replays:
    readonly GenesisReplayStatusSnapshot[],
): GenesisReplayInventory {
  return {
    total:
      replays.length,

    replayIds:
      replays.map(
        replay =>
          replay.replayId,
      ),

    replays,
  };
}


function designation(
  replayId:
    GenesisReplayId,
): GenesisRuntimeReplayDesignation {
  return {
    designationVersion:
      GENESIS_RUNTIME_REPLAY_DESIGNATION_VERSION,

    replayId,

    designatedBy:
      "human:architecture-authority",

    designatedAt:
      1_800_000_000_000,

    reason:
      "Explicit Runtime Genesis replay authority.",
  };
}


test(
  "runtime replay eligibility requires exact complete unblocked replay",
  () => {
    assert.equal(
      isGenesisRuntimeReplayEligible(
        eligibleReplay(
          replayOne,
        ),
      ),
      true,
    );

    assert.equal(
      isGenesisRuntimeReplayEligible({
        ...eligibleReplay(
          replayOne,
        ),

        progress: {
          totalSources:
            3,

          completedSources:
            3,

          admittedSources:
            1,

          skippedSources:
            1,

          blockedSources:
            1,
        },
      }),
      false,
    );
  },
);


test(
  "selection remains unset without explicit designation even when one replay is eligible",
  () => {
    const result =
      resolveGenesisRuntimeReplaySelection({
        designationStore: {
          load:
            () =>
              null,
        },

        inventory:
          inventory([
            eligibleReplay(
              replayOne,
            ),
          ]),
      });

    assert.deepEqual(
      result,
      {
        state:
          "UNSET",

        replayId:
          null,

        designation:
          null,

        reason:
          "NO_DESIGNATION",
      },
    );
  },
);


test(
  "explicit designation resolves multiple eligible replays without heuristic ordering",
  () => {
    const selected =
      designation(
        replayTwo,
      );

    const result =
      resolveGenesisRuntimeReplaySelection({
        designationStore: {
          load:
            () =>
              selected,
        },

        inventory:
          inventory([
            eligibleReplay(
              replayOne,
            ),

            eligibleReplay(
              replayTwo,
            ),
          ]),
      });

    assert.equal(
      result.state,
      "SELECTED",
    );

    assert.equal(
      result.replayId,
      replayTwo,
    );

    assert.equal(
      result.designation,
      selected,
    );
  },
);


test(
  "designation fails closed when replay is absent from inventory",
  () => {
    const result =
      resolveGenesisRuntimeReplaySelection({
        designationStore: {
          load:
            () =>
              designation(
                replayTwo,
              ),
        },

        inventory:
          inventory([
            eligibleReplay(
              replayOne,
            ),
          ]),
      });

    assert.equal(
      result.state,
      "INVALID",
    );

    assert.equal(
      result.replayId,
      null,
    );

    assert.equal(
      result.reason,
      "DESIGNATED_REPLAY_NOT_FOUND",
    );
  },
);


test(
  "designation fails closed when designated replay is no longer eligible",
  () => {
    const incomplete = {
      ...eligibleReplay(
        replayOne,
      ),

      executionStatus:
        "running" as const,

      corpusStatus:
        "PARTIAL" as const,

      runnerOutcome:
        null,
    };

    const result =
      resolveGenesisRuntimeReplaySelection({
        designationStore: {
          load:
            () =>
              designation(
                replayOne,
              ),
        },

        inventory:
          inventory([
            incomplete,
          ]),
      });

    assert.equal(
      result.state,
      "INVALID",
    );

    assert.equal(
      result.reason,
      "DESIGNATED_REPLAY_NOT_ELIGIBLE",
    );
  },
);


test(
  "file designation store persists governed actor timestamp reason and replay identity",
  () => {
    const root =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-genesis-designation-",
        ),
      );

    try {
      const store =
        new FileGenesisRuntimeReplayDesignationStore({
          storageRoot:
            root,
        });

      const expected =
        designation(
          replayOne,
        );

      assert.equal(
        store.load(),
        null,
      );

      store.save(
        expected,
      );

      assert.deepEqual(
        store.load(),
        expected,
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
  "file designation store rejects incomplete governance identity",
  () => {
    const root =
      mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-genesis-designation-invalid-",
        ),
      );

    try {
      const store =
        new FileGenesisRuntimeReplayDesignationStore({
          storageRoot:
            root,
        });

      assert.throws(
        () =>
          store.save({
            ...designation(
              replayOne,
            ),

            designatedBy:
              " ",
          }),
        /genesis_runtime_replay_designation_designated_by_required/,
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
