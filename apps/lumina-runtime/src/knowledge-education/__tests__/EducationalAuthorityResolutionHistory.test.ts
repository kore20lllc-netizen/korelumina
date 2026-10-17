import assert from "node:assert/strict";

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import os from "node:os";

import path from "node:path";

import test from "node:test";

import {
  createEducationalAuthorityResolution,
} from "../EducationalAuthorityResolution.js";

import {
  FileEducationalAuthorityResolutionStore,
} from "../EducationalAuthorityResolutionPersistence.js";


const ARTIFACT =
  "canonical:document:genesis-evidence:mission-ownership";

const DAY_ZERO_A =
  "genesis-day-zero-certification:a";

const DAY_ZERO_B =
  "genesis-day-zero-certification:b";


function resolutionFor(
  dayZeroCertificationId:
    string,

  overrides: {
    learningRole?:
      "CURRENT_RULE" |
      "HISTORICAL_CONTEXT";
    reviewerId?:
      string;
    reviewedAt?:
      number;
    reason?:
      string;
  } = {},
) {
  return createEducationalAuthorityResolution({
    artifactId:
      ARTIFACT,
    learningRole:
      overrides.learningRole ??
      "CURRENT_RULE",
    reviewerId:
      overrides.reviewerId ??
      "human-review:history-test",
    reviewedAt:
      overrides.reviewedAt ??
      100,
    reason:
      overrides.reason ??
      "Human educational authority review.",
    authorityPolicyVersion:
      "educational-corpus-authority:v1",
    dayZeroCertificationId,
  });
}


function withStore(
  run: (
    store:
      FileEducationalAuthorityResolutionStore,
    root:
      string,
  ) => void,
): void {
  const root =
    mkdtempSync(
      path.join(
        os.tmpdir(),
        "korelumina-authority-history-",
      ),
    );

  try {
    run(
      new FileEducationalAuthorityResolutionStore({
        storageRoot:
          root,
      }),
      root,
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
}


function writeLegacy(
  root:
    string,

  resolution:
    ReturnType<
      typeof resolutionFor
    >,
): string {
  const file =
    path.join(
      root,
      `${Buffer.from(
        resolution.artifactId,
        "utf8",
      ).toString(
        "base64url",
      )}.json`,
    );

  mkdirSync(
    root,
    {
      recursive:
        true,
    },
  );

  writeFileSync(
    file,
    `${JSON.stringify(
      resolution,
      null,
      2,
    )}\n`,
    "utf8",
  );

  return file;
}


test(
  "legacy single-file resolution remains readable as history",
  () => {
    withStore(
      (
        store,
        root,
      ) => {
        const legacy =
          resolutionFor(
            DAY_ZERO_A,
          );

        writeLegacy(
          root,
          legacy,
        );

        assert.deepEqual(
          store.list(
            ARTIFACT,
          ),
          [
            legacy,
          ],
        );

        assert.deepEqual(
          store.load(
            ARTIFACT,
            DAY_ZERO_A,
          ),
          legacy,
        );

        assert.equal(
          store.load(
            ARTIFACT,
            DAY_ZERO_B,
          ),
          null,
        );
      },
    );
  },
);


test(
  "a new Day-0 certification accepts a new resolution and preserves the legacy record byte-for-byte",
  () => {
    withStore(
      (
        store,
        root,
      ) => {
        const legacy =
          resolutionFor(
            DAY_ZERO_A,
            {
              reviewedAt:
                100,
            },
          );

        const legacyFile =
          writeLegacy(
            root,
            legacy,
          );

        const legacyBytes =
          readFileSync(
            legacyFile,
            "utf8",
          );

        const renewed =
          resolutionFor(
            DAY_ZERO_B,
            {
              reviewedAt:
                200,
              reason:
                "Re-confirmed against re-certified Day-0.",
            },
          );

        assert.deepEqual(
          store.save(
            renewed,
          ),
          renewed,
        );

        assert.equal(
          readFileSync(
            legacyFile,
            "utf8",
          ),
          legacyBytes,
        );

        assert.deepEqual(
          store.list(
            ARTIFACT,
          ),
          [
            legacy,
            renewed,
          ],
        );

        assert.deepEqual(
          store.load(
            ARTIFACT,
            DAY_ZERO_B,
          ),
          renewed,
        );
      },
    );
  },
);


test(
  "a conflicting resolution for the same Day-0 certification is refused, including against a legacy record",
  () => {
    withStore(
      (
        store,
        root,
      ) => {
        const legacy =
          resolutionFor(
            DAY_ZERO_A,
          );

        writeLegacy(
          root,
          legacy,
        );

        assert.throws(
          () =>
            store.save(
              resolutionFor(
                DAY_ZERO_A,
                {
                  learningRole:
                    "HISTORICAL_CONTEXT",
                  reviewerId:
                    "human-review:other",
                  reviewedAt:
                    300,
                },
              ),
            ),
          /educational_authority_resolution_already_exists/,
        );

        const versioned =
          resolutionFor(
            DAY_ZERO_B,
            {
              reviewedAt:
                200,
            },
          );

        store.save(
          versioned,
        );

        assert.throws(
          () =>
            store.save(
              resolutionFor(
                DAY_ZERO_B,
                {
                  learningRole:
                    "HISTORICAL_CONTEXT",
                  reviewerId:
                    "human-review:other",
                  reviewedAt:
                    400,
                },
              ),
            ),
          /educational_authority_resolution_already_exists/,
        );

        assert.deepEqual(
          store.list(
            ARTIFACT,
          ),
          [
            legacy,
            versioned,
          ],
        );
      },
    );
  },
);


test(
  "saving the identical resolution twice is idempotent",
  () => {
    withStore(
      (
        store,
      ) => {
        const resolution =
          resolutionFor(
            DAY_ZERO_B,
          );

        store.save(
          resolution,
        );

        assert.deepEqual(
          store.save(
            resolution,
          ),
          resolution,
        );

        assert.equal(
          store.list(
            ARTIFACT,
          ).length,
          1,
        );
      },
    );
  },
);


test(
  "a versioned record stored under the wrong Day-0 path fails closed",
  () => {
    withStore(
      (
        store,
        root,
      ) => {
        const resolution =
          resolutionFor(
            DAY_ZERO_A,
          );

        const directory =
          path.join(
            root,
            Buffer.from(
              ARTIFACT,
              "utf8",
            ).toString(
              "base64url",
            ),
          );

        mkdirSync(
          directory,
          {
            recursive:
              true,
          },
        );

        writeFileSync(
          path.join(
            directory,
            `${Buffer.from(
              DAY_ZERO_B,
              "utf8",
            ).toString(
              "base64url",
            )}.json`,
          ),
          JSON.stringify(
            resolution,
          ),
          "utf8",
        );

        assert.throws(
          () =>
            store.list(
              ARTIFACT,
            ),
          /educational_authority_resolution_persistence_day_zero_mismatch/,
        );
      },
    );
  },
);


test(
  "an artifact with no resolutions lists nothing",
  () => {
    withStore(
      (
        store,
      ) => {
        assert.deepEqual(
          store.list(
            ARTIFACT,
          ),
          [],
        );

        assert.equal(
          store.load(
            ARTIFACT,
            DAY_ZERO_A,
          ),
          null,
        );
      },
    );
  },
);
