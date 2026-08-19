import assert from "node:assert/strict";
import test from "node:test";

import type {
  GenesisReplayId,
  GenesisReplayStatusSnapshot,
} from "../genesisReplayReadClient.js";

import type {
  GenesisReplayReadState,
} from "../genesisReplayReadState.js";

import {
  createGenesisReplayReadViewModel,
} from "../genesisReplayReadViewModel.js";

const REPLAY_A =
  `genesis-replay:${"a".repeat(
    64,
  )}` as GenesisReplayId;

const REPLAY_B =
  `genesis-replay:${"b".repeat(
    64,
  )}` as GenesisReplayId;

function replay(
  input: {
    replayId:
      GenesisReplayId;

    executionStatus?:
      "running" |
      "completed" |
      "failed" |
      null;

    executionPresent?:
      boolean;

    progress?: {
      totalSources:
        number;

      completedSources:
        number;

      admittedSources:
        number;

      skippedSources:
        number;

      rejectedSources:
        number;
    } |
    null;

    recovery?: {
      eligible:
        boolean;

      reason:
        "ELIGIBLE" |
        "REPLAY_NOT_FOUND" |
        "EXECUTION_NOT_FOUND" |
        "ALREADY_COMPLETED" |
        "EXECUTION_NOT_RUNNING" |
        "CURRENT_POSITION_MISSING";
    };

    admittedEvidenceIds?:
      string[];

    admissionLinks?:
      {
        evidenceId:
          string;

        manufacturingRunId:
          string |
          null;

        linked:
          boolean;

        ambiguous:
          boolean;

        matchingManufacturingRunIds:
          string[];

        status:
          string |
          null;

        currentStage:
          string |
          null;

        packageId:
          string |
          null;

        canonicalKnowledgeIds:
          string[];
      }[];

    allLinked?:
      boolean;
  },
): GenesisReplayStatusSnapshot {
  const executionPresent =
    input.executionPresent ??
    true;

  return {
    replayId:
      input.replayId,

    found:
      true,

    manifestPresent:
      true,

    executionPresent,

    manifestId:
      "genesis-manifest:fixture",

    manifestReadiness:
      "READY",

    manifestErrors:
      0,

    totalManifestSources:
      4,

    executionStatus:
      executionPresent
        ? (
            input.executionStatus ??
            "running"
          )
        : null,

    corpusStatus:
      "INCOMPLETE",

    currentManifestIndex:
      executionPresent
        ? 1
        : null,

    currentHistoricalSourceId:
      executionPresent
        ? "genesis-source:commit:fixture"
        : null,

    lastCompletedManifestIndex:
      executionPresent
        ? 0
        : null,

    progress:
      input.progress ===
        undefined
        ? {
            totalSources:
              4,

            completedSources:
              2,

            admittedSources:
              1,

            skippedSources:
              1,

            rejectedSources:
              0,
          }
        : input.progress,

    checkpoint:
      null,

    runnerOutcome:
      null,

    runnerFailure:
      null,

    recovery:
      input.recovery ?? {
        eligible:
          true,

        reason:
          "ELIGIBLE",
      },

    admittedEvidenceIds:
      input
        .admittedEvidenceIds ??
      [],

    admissionLinks:
      input.admissionLinks ??
      [],

    allAdmittedEvidenceLinked:
      input.allLinked ??
      true,
  };
}

function state(
  overrides:
    Partial<
      GenesisReplayReadState
    > =
      {},
): GenesisReplayReadState {
  return {
    inventory:
      null,

    inventoryLoading:
      false,

    inventoryLoaded:
      false,

    selectedReplayId:
      null,

    selectedReplay:
      null,

    selectionLoading:
      false,

    error:
      null,

    ...overrides,
  };
}

test(
  "view model derives idle inventory state without fabricating rows",
  () => {
    const view =
      createGenesisReplayReadViewModel(
        state(),
      );

    assert.equal(
      view.inventoryLoading,
      false,
    );

    assert.equal(
      view.inventoryLoaded,
      false,
    );

    assert.equal(
      view.inventoryEmpty,
      false,
    );

    assert.equal(
      view.inventoryCount,
      0,
    );

    assert.deepEqual(
      view.rows,
      [],
    );

    assert.equal(
      view.selected,
      null,
    );
  },
);

test(
  "loaded empty inventory is distinguished from not-yet-loaded inventory",
  () => {
    const view =
      createGenesisReplayReadViewModel(
        state({
          inventoryLoaded:
            true,

          inventory: {
            total:
              0,

            replayIds:
              [],

            replays:
              [],
          },
        }),
      );

    assert.equal(
      view.inventoryEmpty,
      true,
    );
  },
);

test(
  "inventory rows preserve deterministic source ordering and selected identity",
  () => {
    const first =
      replay({
        replayId:
          REPLAY_A,
      });

    const second =
      replay({
        replayId:
          REPLAY_B,
      });

    const view =
      createGenesisReplayReadViewModel(
        state({
          inventoryLoaded:
            true,

          inventory: {
            total:
              2,

            replayIds: [
              REPLAY_A,
              REPLAY_B,
            ],

            replays: [
              first,
              second,
            ],
          },

          selectedReplayId:
            REPLAY_B,
        }),
      );

    assert.deepEqual(
      view.rows.map(
        (
          row,
        ) =>
          row.replayId,
      ),
      [
        REPLAY_A,
        REPLAY_B,
      ],
    );

    assert.equal(
      view.rows[0].selected,
      false,
    );

    assert.equal(
      view.rows[1].selected,
      true,
    );
  },
);

test(
  "running replay derives lifecycle progress and recovery presentation",
  () => {
    const item =
      replay({
        replayId:
          REPLAY_A,
      });

    const view =
      createGenesisReplayReadViewModel(
        state({
          inventoryLoaded:
            true,

          inventory: {
            total:
              1,

            replayIds: [
              REPLAY_A,
            ],

            replays: [
              item,
            ],
          },
        }),
      );

    const row =
      view.rows[0];

    assert.equal(
      row.lifecycle,
      "Running",
    );

    assert.equal(
      row.lifecycleTone,
      "info",
    );

    assert.deepEqual(
      row.progress,
      {
        available:
          true,

        total:
          4,

        completed:
          2,

        remaining:
          2,

        percent:
          50,

        admitted:
          1,

        skipped:
          1,

        rejected:
          0,
      },
    );

    assert.deepEqual(
      row.recovery,
      {
        eligible:
          true,

        reason:
          "ELIGIBLE",

        label:
          "Recovery eligible",

        tone:
          "warning",
      },
    );
  },
);

test(
  "manifest-only replay does not fabricate execution lifecycle or progress",
  () => {
    const item =
      replay({
        replayId:
          REPLAY_A,

        executionPresent:
          false,

        progress:
          null,

        recovery: {
          eligible:
            false,

          reason:
            "EXECUTION_NOT_FOUND",
        },
      });

    const view =
      createGenesisReplayReadViewModel(
        state({
          inventoryLoaded:
            true,

          inventory: {
            total:
              1,

            replayIds: [
              REPLAY_A,
            ],

            replays: [
              item,
            ],
          },
        }),
      );

    const row =
      view.rows[0];

    assert.equal(
      row.lifecycle,
      "Manifest only",
    );

    assert.equal(
      row.progress.available,
      false,
    );

    assert.equal(
      row.progress.completed,
      0,
    );

    assert.equal(
      row.progress.total,
      4,
    );

    assert.equal(
      row.recovery.label,
      "No execution to recover",
    );
  },
);

test(
  "completed replay derives success lifecycle and no-recovery-required state",
  () => {
    const item =
      replay({
        replayId:
          REPLAY_A,

        executionStatus:
          "completed",

        recovery: {
          eligible:
            false,

          reason:
            "ALREADY_COMPLETED",
        },
      });

    const view =
      createGenesisReplayReadViewModel(
        state({
          inventoryLoaded:
            true,

          inventory: {
            total:
              1,

            replayIds: [
              REPLAY_A,
            ],

            replays: [
              item,
            ],
          },
        }),
      );

    assert.equal(
      view.rows[0].lifecycle,
      "Completed",
    );

    assert.equal(
      view.rows[0].lifecycleTone,
      "success",
    );

    assert.equal(
      view.rows[0].recovery.label,
      "Recovery not required",
    );
  },
);

test(
  "ambiguous linkage has priority over otherwise linked Evidence",
  () => {
    const item =
      replay({
        replayId:
          REPLAY_A,

        admittedEvidenceIds: [
          "evidence:a",
          "evidence:b",
        ],

        admissionLinks: [
          {
            evidenceId:
              "evidence:a",

            manufacturingRunId:
              "run:a",

            linked:
              true,

            ambiguous:
              false,

            matchingManufacturingRunIds: [
              "run:a",
            ],

            status:
              "active",

            currentStage:
              "Validation",

            packageId:
              null,

            canonicalKnowledgeIds:
              [],
          },

          {
            evidenceId:
              "evidence:b",

            manufacturingRunId:
              null,

            linked:
              true,

            ambiguous:
              true,

            matchingManufacturingRunIds: [
              "run:b1",
              "run:b2",
            ],

            status:
              null,

            currentStage:
              null,

            packageId:
              null,

            canonicalKnowledgeIds:
              [],
          },
        ],

        allLinked:
          false,
      });

    const view =
      createGenesisReplayReadViewModel(
        state({
          inventoryLoaded:
            true,

          inventory: {
            total:
              1,

            replayIds: [
              REPLAY_A,
            ],

            replays: [
              item,
            ],
          },
        }),
      );

    assert.deepEqual(
      view.rows[0].linkage,
      {
        health:
          "ambiguous",

        admittedEvidence:
          2,

        linkedEvidence:
          1,

        ambiguousEvidence:
          1,

        unlinkedEvidence:
          0,

        allLinked:
          false,

        label:
          "1 ambiguous linkage",

        tone:
          "danger",
      },
    );
  },
);

test(
  "partial linkage derives unresolved count without fabricating healthy status",
  () => {
    const item =
      replay({
        replayId:
          REPLAY_A,

        admittedEvidenceIds: [
          "evidence:a",
          "evidence:b",
        ],

        admissionLinks: [
          {
            evidenceId:
              "evidence:a",

            manufacturingRunId:
              "run:a",

            linked:
              true,

            ambiguous:
              false,

            matchingManufacturingRunIds: [
              "run:a",
            ],

            status:
              "active",

            currentStage:
              "Validation",

            packageId:
              null,

            canonicalKnowledgeIds:
              [],
          },

          {
            evidenceId:
              "evidence:b",

            manufacturingRunId:
              null,

            linked:
              false,

            ambiguous:
              false,

            matchingManufacturingRunIds:
              [],

            status:
              null,

            currentStage:
              null,

            packageId:
              null,

            canonicalKnowledgeIds:
              [],
          },
        ],

        allLinked:
          false,
      });

    const view =
      createGenesisReplayReadViewModel(
        state({
          inventoryLoaded:
            true,

          inventory: {
            total:
              1,

            replayIds: [
              REPLAY_A,
            ],

            replays: [
              item,
            ],
          },
        }),
      );

    assert.equal(
      view.rows[0]
        .linkage
        .health,
      "partial",
    );

    assert.equal(
      view.rows[0]
        .linkage
        .unlinkedEvidence,
      1,
    );

    assert.equal(
      view.rows[0]
        .linkage
        .allLinked,
      false,
    );
  },
);

test(
  "selected replay view derives detail projection from selected status only",
  () => {
    const selected =
      replay({
        replayId:
          REPLAY_A,
      });

    const view =
      createGenesisReplayReadViewModel(
        state({
          selectedReplayId:
            REPLAY_A,

          selectedReplay:
            selected,
        }),
      );

    assert.ok(
      view.selected,
    );

    assert.equal(
      view.selected
        ?.replayId,
      REPLAY_A,
    );

    assert.equal(
      view.selected
        ?.manifestId,
      "genesis-manifest:fixture",
    );

    assert.equal(
      view.selected
        ?.currentManifestIndex,
      1,
    );

    assert.equal(
      view.selected
        ?.currentHistoricalSourceId,
      "genesis-source:commit:fixture",
    );
  },
);

test(
  "inventory error and selection error derive distinct presentation labels",
  () => {
    const inventoryError =
      createGenesisReplayReadViewModel(
        state({
          error: {
            scope:
              "inventory",

            message:
              "runtime_access_denied",

            code:
              "runtime_access_denied",

            status:
              403,
          },
        }),
      );

    assert.deepEqual(
      inventoryError.error,
      {
        scope:
          "inventory",

        message:
          "runtime_access_denied",

        code:
          "runtime_access_denied",

        status:
          403,

        label:
          "Replay inventory unavailable",

        tone:
          "danger",
      },
    );

    const selectionError =
      createGenesisReplayReadViewModel(
        state({
          error: {
            scope:
              "selection",

            message:
              "genesis_replay_not_found",

            code:
              "genesis_replay_not_found",

            status:
              404,
          },
        }),
      );

    assert.equal(
      selectionError
        .error
        ?.label,
      "Replay inspection unavailable",
    );
  },
);

test(
  "view model is deterministic and does not mutate source state",
  () => {
    const item =
      replay({
        replayId:
          REPLAY_A,
      });

    const source =
      state({
        inventoryLoaded:
          true,

        inventory: {
          total:
            1,

          replayIds: [
            REPLAY_A,
          ],

          replays: [
            item,
          ],
        },
      });

    const before =
      JSON.stringify(
        source,
      );

    const first =
      createGenesisReplayReadViewModel(
        source,
      );

    const second =
      createGenesisReplayReadViewModel(
        source,
      );

    assert.deepEqual(
      first,
      second,
    );

    assert.equal(
      JSON.stringify(
        source,
      ),
      before,
    );
  },
);

test(
  "progress presentation is clamped to a valid 0-100 percent range",
  () => {
    const overComplete =
      replay({
        replayId:
          REPLAY_A,

        progress: {
          totalSources:
            4,

          completedSources:
            99,

          admittedSources:
            0,

          skippedSources:
            0,

          rejectedSources:
            0,
        },
      });

    const negative =
      replay({
        replayId:
          REPLAY_B,

        progress: {
          totalSources:
            4,

          completedSources:
            -20,

          admittedSources:
            0,

          skippedSources:
            0,

          rejectedSources:
            0,
        },
      });

    const view =
      createGenesisReplayReadViewModel(
        state({
          inventoryLoaded:
            true,

          inventory: {
            total:
              2,

            replayIds: [
              REPLAY_A,
              REPLAY_B,
            ],

            replays: [
              overComplete,
              negative,
            ],
          },
        }),
      );

    assert.equal(
      view.rows[0]
        .progress
        .percent,
      100,
    );

    assert.equal(
      view.rows[0]
        .progress
        .completed,
      4,
    );

    assert.equal(
      view.rows[1]
        .progress
        .percent,
      0,
    );

    assert.equal(
      view.rows[1]
        .progress
        .completed,
      0,
    );
  },
);

test(
  "linkage presentation never resolves more Evidence than admitted population",
  () => {
    const item =
      replay({
        replayId:
          REPLAY_A,

        admittedEvidenceIds: [
          "evidence:a",
        ],

        admissionLinks: [
          {
            evidenceId:
              "evidence:a",

            manufacturingRunId:
              "run:a",

            linked:
              true,

            ambiguous:
              false,

            matchingManufacturingRunIds: [
              "run:a",
            ],

            status:
              "active",

            currentStage:
              "Validation",

            packageId:
              null,

            canonicalKnowledgeIds:
              [],
          },

          {
            evidenceId:
              "evidence:ghost-1",

            manufacturingRunId:
              "run:ghost-1",

            linked:
              true,

            ambiguous:
              false,

            matchingManufacturingRunIds: [
              "run:ghost-1",
            ],

            status:
              "active",

            currentStage:
              "Validation",

            packageId:
              null,

            canonicalKnowledgeIds:
              [],
          },

          {
            evidenceId:
              "evidence:ghost-2",

            manufacturingRunId:
              null,

            linked:
              true,

            ambiguous:
              true,

            matchingManufacturingRunIds: [
              "run:ghost-2a",
              "run:ghost-2b",
            ],

            status:
              null,

            currentStage:
              null,

            packageId:
              null,

            canonicalKnowledgeIds:
              [],
          },
        ],

        allLinked:
          false,
      });

    const view =
      createGenesisReplayReadViewModel(
        state({
          inventoryLoaded:
            true,

          inventory: {
            total:
              1,

            replayIds: [
              REPLAY_A,
            ],

            replays: [
              item,
            ],
          },
        }),
      );

    const linkage =
      view.rows[0]
        .linkage;

    assert.equal(
      linkage.admittedEvidence,
      1,
    );

    assert.ok(
      linkage.linkedEvidence +
      linkage.ambiguousEvidence +
      linkage.unlinkedEvidence <=
      linkage.admittedEvidence,
    );

    assert.equal(
      linkage.ambiguousEvidence,
      1,
    );

    assert.equal(
      linkage.linkedEvidence,
      0,
    );

    assert.equal(
      linkage.unlinkedEvidence,
      0,
    );

    assert.equal(
      linkage.health,
      "ambiguous",
    );
  },
);
