import assert from "node:assert/strict";
import test from "node:test";

import {
  createGenesisReplayDesignationHandler,
} from "../genesisReplayDesignation.js";


function replay(
  replayId =
    "genesis-replay:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
): any {
  return {
    replayId,

    found:
      true,

    manifestPresent:
      true,

    manifestReadiness:
      "READY",

    manifestErrors:
      0,

    executionPresent:
      true,

    executionStatus:
      "completed",

    corpusStatus:
      "COMPLETE",

    runnerOutcome:
      "COMPLETED",

    progress: {
      totalSources:
        3,

      completedSources:
        3,

      admittedSources:
        2,

      skippedSources:
        1,

      blockedSources:
        0,
    },
  };
}


function fixture(
  replays:
    readonly any[],
) {
  let stored:
    any =
      null;

  return {
    runtime: {
      listReplayInventory:
        () => ({
          replays,
        }),

      designationStore: {
        load:
          () =>
            stored,

        save(
          value:
            any,
        ) {
          stored =
            value;
        },
      },

      now:
        () =>
          123456789,
    } as any,

    stored:
      () =>
        stored,

    seed(
      value:
        any,
    ) {
      stored =
        value;
    },
  };
}


function invoke(
  runtime:
    any,

  body:
    unknown,
) {
  let statusCode =
    200;

  let responseBody:
    any =
      null;

  const res = {
    status(
      code:
        number,
    ) {
      statusCode =
        code;

      return res;
    },

    json(
      value:
        unknown,
    ) {
      responseBody =
        value;

      return res;
    },
  };

  createGenesisReplayDesignationHandler(
    runtime,
  )(
    {
      body,
    } as any,
    res as any,
    (() => {}) as any,
  );

  return {
    statusCode,
    body:
      responseBody,
  };
}


test(
  "requires explicit replay identity actor and reason",
  () => {
    const f =
      fixture([
        replay(),
      ]);

    const result =
      invoke(
        f.runtime,
        {
          replayId:
            replay().replayId,
        },
      );

    assert.equal(
      result.statusCode,
      400,
    );

    assert.equal(
      f.stored(),
      null,
    );
  },
);


test(
  "rejects a replay that does not exist in production inventory",
  () => {
    const f =
      fixture([]);

    const result =
      invoke(
        f.runtime,
        {
          replayId:
            replay().replayId,

          designatedBy:
            "human:operator",

          reason:
            "Day-0 historical education.",
        },
      );

    assert.equal(
      result.statusCode,
      404,
    );

    assert.equal(
      f.stored(),
      null,
    );
  },
);


test(
  "rejects ineligible replay",
  () => {
    const candidate =
      replay();

    candidate.progress
      .blockedSources =
      1;

    const f =
      fixture([
        candidate,
      ]);

    const result =
      invoke(
        f.runtime,
        {
          replayId:
            candidate.replayId,

          designatedBy:
            "human:operator",

          reason:
            "Day-0 historical education.",
        },
      );

    assert.equal(
      result.statusCode,
      409,
    );

    assert.equal(
      f.stored(),
      null,
    );
  },
);


test(
  "persists explicit governed replay designation",
  () => {
    const candidate =
      replay();

    const f =
      fixture([
        candidate,
      ]);

    const result =
      invoke(
        f.runtime,
        {
          replayId:
            candidate.replayId,

          designatedBy:
            "human:operator",

          reason:
            "Use this completed replay for Day-0 historical education.",
        },
      );

    assert.equal(
      result.statusCode,
      200,
    );

    assert.equal(
      result.body.selectionChanged,
      true,
    );

    assert.deepEqual(
      f.stored(),
      {
        designationVersion:
          "genesis-runtime-replay-designation:v1",

        replayId:
          candidate.replayId,

        designatedBy:
          "human:operator",

        designatedAt:
          123456789,

        reason:
          "Use this completed replay for Day-0 historical education.",
      },
    );
  },
);


test(
  "same replay designation is idempotent",
  () => {
    const candidate =
      replay();

    const f =
      fixture([
        candidate,
      ]);

    const existing = {
      replayId:
        candidate.replayId,

      designatedBy:
        "human:first",

      designatedAt:
        111,

      reason:
        "Existing governed designation.",
    };

    f.seed(
      existing,
    );

    const result =
      invoke(
        f.runtime,
        {
          replayId:
            candidate.replayId,

          designatedBy:
            "human:second",

          reason:
            "Repeat request.",
        },
      );

    assert.equal(
      result.statusCode,
      200,
    );

    assert.equal(
      result.body.selectionChanged,
      false,
    );

    assert.deepEqual(
      f.stored(),
      existing,
    );
  },
);


test(
  "multiple eligible replays are never chosen heuristically",
  () => {
    const first =
      replay(
        "genesis-replay:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      );

    const second =
      replay(
        "genesis-replay:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      );

    const f =
      fixture([
        second,
        first,
      ]);

    invoke(
      f.runtime,
      {
        replayId:
          first.replayId,

        designatedBy:
          "human:operator",

        reason:
          "Explicit governed replay selection.",
      },
    );

    assert.equal(
      f.stored()
        .replayId,
      first.replayId,
    );
  },
);
