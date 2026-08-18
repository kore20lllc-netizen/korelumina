import assert from "node:assert/strict";
import test from "node:test";

import {
  execFileSync,
} from "node:child_process";

import {
  mkdtempSync,
  writeFileSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import type {
  GenesisReplayScope,
} from "../index.js";

import {
  GitHistoryHistoricalSourceDiscoverer,
} from "../index.js";

function git(
  root:
    string,

  args:
    readonly string[],

  env:
    NodeJS.ProcessEnv = {},
): string {
  return execFileSync(
    "git",
    [
      ...args,
    ],
    {
      cwd:
        root,

      encoding:
        "utf8",

      env: {
        ...process.env,
        ...env,
      },
    },
  );
}

function repository():
  string {
  const root =
    mkdtempSync(
      path.join(
        tmpdir(),
        "korelumina-genesis-git-",
      ),
    );

  git(
    root,
    [
      "init",
      "-q",
      "-b",
      "main",
    ],
  );

  git(
    root,
    [
      "config",
      "user.name",
      "Genesis Test",
    ],
  );

  git(
    root,
    [
      "config",
      "user.email",
      "genesis@example.com",
    ],
  );

  return root;
}

function commit(
  root:
    string,

  input: {
    file:
      string;

    content:
      string;

    subject:
      string;

    body?:
      string;

    timestamp:
      string;
  },
): string {
  writeFileSync(
    path.join(
      root,
      input.file,
    ),
    input.content,
    "utf8",
  );

  git(
    root,
    [
      "add",
      input.file,
    ],
  );

  const args =
    [
      "commit",
      "-q",
      "-m",
      input.subject,
    ];

  if (
    input.body
  ) {
    args.push(
      "-m",
      input.body,
    );
  }

  git(
    root,
    args,
    {
      GIT_AUTHOR_DATE:
        input.timestamp,

      GIT_COMMITTER_DATE:
        input.timestamp,
    },
  );

  return git(
    root,
    [
      "rev-parse",
      "HEAD",
    ],
  ).trim();
}

function scope(
  overrides:
    Partial<
      GenesisReplayScope
    > = {},
): GenesisReplayScope {
  return {
    mode:
      "partial",

    repository:
      "kore20lllc-netizen/korelumina",

    ref:
      "main",

    includedEvidenceTypes: [
      "commit",
    ],

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],

    governancePolicyVersion:
      "governance-v1",

    replayContractVersion:
      "1.0",

    ...overrides,
  };
}

function discoverer(
  root:
    string,
) {
  return new GitHistoryHistoricalSourceDiscoverer({
    repositoryRoot:
      root,

    discoveredAt:
      () =>
        9000,
  });
}

test(
  "commit Historical Source Identity is the immutable Git SHA",
  async () => {
    const root =
      repository();

    const sha =
      commit(
        root,
        {
          file:
            "a.txt",

          content:
            "a",

          subject:
            "first",

          timestamp:
            "2026-01-01T00:00:00Z",
        },
      );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.equal(
      result.sources[0]
        .historicalSourceId,
      `genesis-source:commit:${sha}`,
    );

    assert.equal(
      result.sources[0]
        .stableSourceKey,
      sha,
    );
  },
);

test(
  "Git commit checksum is deterministic and content-addressed separately from source identity",
  async () => {
    const root =
      repository();

    const sha =
      commit(
        root,
        {
          file:
            "a.txt",

          content:
            "a",

          subject:
            "first",

          timestamp:
            "2026-01-01T00:00:00Z",
        },
      );

    const first =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const second =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.equal(
      first.sources[0]
        .historicalSourceId,
      `genesis-source:commit:${sha}`,
    );

    assert.equal(
      first.sources[0]
        .sourceChecksum,
      second.sources[0]
        .sourceChecksum,
    );

    assert.match(
      first.sources[0]
        .sourceChecksum,
      /^sha256:[a-f0-9]{64}$/,
    );
  },
);

test(
  "parent topology is preserved independently from chronological ordering",
  async () => {
    const root =
      repository();

    const parent =
      commit(
        root,
        {
          file:
            "a.txt",

          content:
            "a",

          subject:
            "parent",

          timestamp:
            "2026-01-01T00:00:00Z",
        },
      );

    const child =
      commit(
        root,
        {
          file:
            "b.txt",

          content:
            "b",

          subject:
            "child",

          timestamp:
            "2026-01-02T00:00:00Z",
        },
      );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const childSource =
      result.sources.find(
        (
          source,
        ) =>
          source.stableSourceKey ===
          child,
      );

    assert.deepEqual(
      childSource
        ?.provenance.parentIds,
      [
        parent,
      ],
    );

    assert.deepEqual(
      childSource
        ?.metadata.parentShas,
      [
        parent,
      ],
    );
  },
);

test(
  "author and committer timestamps are preserved while committer time governs replay chronology",
  async () => {
    const root =
      repository();

    writeFileSync(
      path.join(
        root,
        "a.txt",
      ),
      "a",
      "utf8",
    );

    git(
      root,
      [
        "add",
        "a.txt",
      ],
    );

    git(
      root,
      [
        "commit",
        "-q",
        "-m",
        "different clocks",
      ],
      {
        GIT_AUTHOR_DATE:
          "2026-01-01T00:00:00Z",

        GIT_COMMITTER_DATE:
          "2026-01-03T00:00:00Z",
      },
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const source =
      result.sources[0];

    assert.equal(
      source.historicalTimestamp.source,
      "git-committer-time",
    );

    assert.equal(
      (
        source.metadata
          .author as {
            timestamp:
              number;
          }
      ).timestamp,
      Date.parse(
        "2026-01-01T00:00:00Z",
      ),
    );

    assert.equal(
      source.historicalTimestamp.value,
      Date.parse(
        "2026-01-03T00:00:00Z",
      ),
    );
  },
);

test(
  "commit subject and body are preserved",
  async () => {
    const root =
      repository();

    commit(
      root,
      {
        file:
          "a.txt",

        content:
          "a",

        subject:
          "Genesis subject",

        body:
          "Genesis body",

        timestamp:
          "2026-01-01T00:00:00Z",
      },
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.equal(
      result.sources[0]
        .metadata.subject,
      "Genesis subject",
    );

    assert.equal(
      result.sources[0]
        .metadata.body,
      "Genesis body",
    );
  },
);

test(
  "changed paths are deterministic and sorted",
  async () => {
    const root =
      repository();

    writeFileSync(
      path.join(
        root,
        "z.txt",
      ),
      "z",
      "utf8",
    );

    writeFileSync(
      path.join(
        root,
        "a.txt",
      ),
      "a",
      "utf8",
    );

    git(
      root,
      [
        "add",
        "z.txt",
        "a.txt",
      ],
    );

    git(
      root,
      [
        "commit",
        "-q",
        "-m",
        "two files",
      ],
      {
        GIT_AUTHOR_DATE:
          "2026-01-01T00:00:00Z",

        GIT_COMMITTER_DATE:
          "2026-01-01T00:00:00Z",
      },
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.deepEqual(
      result.sources[0]
        .metadata.changedPaths,
      [
        "a.txt",
        "z.txt",
      ],
    );
  },
);

test(
  "direct branch refs pointing at a commit are retained when recoverable",
  async () => {
    const root =
      repository();

    const sha =
      commit(
        root,
        {
          file:
            "a.txt",

          content:
            "a",

          subject:
            "first",

          timestamp:
            "2026-01-01T00:00:00Z",
        },
      );

    git(
      root,
      [
        "branch",
        "release",
        sha,
      ],
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const source =
      result.sources.find(
        (
          item,
        ) =>
          item.stableSourceKey ===
          sha,
      );

    assert.deepEqual(
      source
        ?.metadata.directRefs,
      [
        "refs/heads/main",
        "refs/heads/release",
      ],
    );
  },
);

test(
  "annotated or indirect history is not inferred as false parent topology",
  async () => {
    const root =
      repository();

    const sha =
      commit(
        root,
        {
          file:
            "a.txt",

          content:
            "a",

          subject:
            "root",

          timestamp:
            "2026-01-01T00:00:00Z",
        },
      );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const source =
      result.sources.find(
        (
          item,
        ) =>
          item.stableSourceKey ===
          sha,
      );

    assert.deepEqual(
      source
        ?.provenance.parentIds,
      [],
    );
  },
);

test(
  "partial Git ref scope discovers only commits reachable from that ref",
  async () => {
    const root =
      repository();

    const rootSha =
      commit(
        root,
        {
          file:
            "root.txt",

          content:
            "root",

          subject:
            "root",

          timestamp:
            "2026-01-01T00:00:00Z",
        },
      );

    git(
      root,
      [
        "branch",
        "feature",
        rootSha,
      ],
    );

    commit(
      root,
      {
        file:
          "main.txt",

        content:
          "main",

        subject:
          "main only",

        timestamp:
          "2026-01-02T00:00:00Z",
      },
    );

    git(
      root,
      [
        "switch",
        "-q",
        "feature",
      ],
    );

    const featureSha =
      commit(
        root,
        {
          file:
            "feature.txt",

          content:
            "feature",

          subject:
            "feature only",

          timestamp:
            "2026-01-03T00:00:00Z",
        },
      );

    const result =
      await discoverer(
        root,
      ).discover(
        scope({
          ref:
            "feature",
        }),
      );

    const shas =
      result.sources.map(
        (
          source,
        ) =>
          source.stableSourceKey,
      );

    assert.equal(
      shas.includes(
        featureSha,
      ),
      true,
    );

    assert.equal(
      shas.length,
      2,
    );
  },
);

test(
  "unbounded full-style Git history discovery traverses all refs",
  async () => {
    const root =
      repository();

    const rootSha =
      commit(
        root,
        {
          file:
            "root.txt",

          content:
            "root",

          subject:
            "root",

          timestamp:
            "2026-01-01T00:00:00Z",
        },
      );

    git(
      root,
      [
        "branch",
        "feature",
        rootSha,
      ],
    );

    const mainSha =
      commit(
        root,
        {
          file:
            "main.txt",

          content:
            "main",

          subject:
            "main",

          timestamp:
            "2026-01-02T00:00:00Z",
        },
      );

    git(
      root,
      [
        "switch",
        "-q",
        "feature",
      ],
    );

    const featureSha =
      commit(
        root,
        {
          file:
            "feature.txt",

          content:
            "feature",

          subject:
            "feature",

          timestamp:
            "2026-01-03T00:00:00Z",
        },
      );

    const result =
      await discoverer(
        root,
      ).discover(
        scope({
          ref:
            undefined,
        }),
      );

    const shas =
      result.sources.map(
        (
          source,
        ) =>
          source.stableSourceKey,
      );

    assert.equal(
      shas.includes(
        rootSha,
      ),
      true,
    );

    assert.equal(
      shas.includes(
        mainSha,
      ),
      true,
    );

    assert.equal(
      shas.includes(
        featureSha,
      ),
      true,
    );
  },
);

test(
  "Git source output is deterministic by committer timestamp then SHA",
  async () => {
    const root =
      repository();

    const first =
      commit(
        root,
        {
          file:
            "a.txt",

          content:
            "a",

          subject:
            "first",

          timestamp:
            "2026-01-01T00:00:00Z",
        },
      );

    const second =
      commit(
        root,
        {
          file:
            "b.txt",

          content:
            "b",

          subject:
            "second",

          timestamp:
            "2026-01-02T00:00:00Z",
        },
      );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.deepEqual(
      result.sources.map(
        (
          source,
        ) =>
          source.stableSourceKey,
      ),
      [
        first,
        second,
      ],
    );
  },
);

test(
  "chronological replay bounds exclude but preserve reachable Git commits",
  async () => {
    const root =
      repository();

    commit(
      root,
      {
        file:
          "a.txt",

        content:
          "a",

        subject:
          "before",

        timestamp:
          "2026-01-01T00:00:00Z",
      },
    );

    commit(
      root,
      {
        file:
          "b.txt",

        content:
          "b",

        subject:
          "inside",

        timestamp:
          "2026-01-03T00:00:00Z",
      },
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope({
          historicalStart:
            Date.parse(
              "2026-01-02T00:00:00Z",
            ),
        }),
      );

    assert.equal(
      result.sources.length,
      2,
    );

    assert.equal(
      result.sources[0]
        .replayEligibility,
      "excluded",
    );

    assert.equal(
      result.sources[0]
        .exclusionReason,
      "before_replay_scope",
    );

    assert.equal(
      result.sources[1]
        .replayEligibility,
      "eligible",
    );
  },
);

test(
  "commit Evidence-type exclusion preserves Git source but marks it excluded",
  async () => {
    const root =
      repository();

    commit(
      root,
      {
        file:
          "a.txt",

        content:
          "a",

        subject:
          "commit",

        timestamp:
          "2026-01-01T00:00:00Z",
      },
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope({
          includedEvidenceTypes:
            [],
        }),
      );

    assert.equal(
      result.sources.length,
      1,
    );

    assert.equal(
      result.sources[0]
        .replayEligibility,
      "excluded",
    );

    assert.equal(
      result.sources[0]
        .exclusionReason,
      "evidence_type_outside_replay_scope",
    );
  },
);

test(
  "discoveredAt remains operational provenance rather than historical Git time",
  async () => {
    const root =
      repository();

    commit(
      root,
      {
        file:
          "a.txt",

        content:
          "a",

        subject:
          "commit",

        timestamp:
          "2026-01-01T00:00:00Z",
      },
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.equal(
      result.sources[0]
        .discoveredAt,
      9000,
    );

    assert.notEqual(
      result.sources[0]
        .historicalTimestamp
        .value,
      9000,
    );
  },
);

test(
  "merge commit retains changed paths separately for each parent while also exposing deterministic union",
  async () => {
    const root =
      repository();

    const rootSha =
      commit(
        root,
        {
          file:
            "base.txt",

          content:
            "base",

          subject:
            "root",

          timestamp:
            "2026-01-01T00:00:00Z",
        },
      );

    git(
      root,
      [
        "branch",
        "feature",
        rootSha,
      ],
    );

    const mainSha =
      commit(
        root,
        {
          file:
            "main.txt",

          content:
            "main",

          subject:
            "main change",

          timestamp:
            "2026-01-02T00:00:00Z",
        },
      );

    git(
      root,
      [
        "switch",
        "-q",
        "feature",
      ],
    );

    const featureSha =
      commit(
        root,
        {
          file:
            "feature.txt",

          content:
            "feature",

          subject:
            "feature change",

          timestamp:
            "2026-01-03T00:00:00Z",
        },
      );

    git(
      root,
      [
        "switch",
        "-q",
        "main",
      ],
    );

    git(
      root,
      [
        "merge",
        "--no-ff",
        "-q",
        "-m",
        "merge feature",
        "feature",
      ],
      {
        GIT_AUTHOR_DATE:
          "2026-01-04T00:00:00Z",

        GIT_COMMITTER_DATE:
          "2026-01-04T00:00:00Z",
      },
    );

    const mergeSha =
      git(
        root,
        [
          "rev-parse",
          "HEAD",
        ],
      ).trim();

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const mergeSource =
      result.sources.find(
        (
          source,
        ) =>
          source.stableSourceKey ===
          mergeSha,
      );

    assert.ok(
      mergeSource,
    );

    assert.deepEqual(
      mergeSource
        .provenance.parentIds,
      [
        mainSha,
        featureSha,
      ],
    );

    const byParent =
      mergeSource
        .metadata
        .changedPathsByParent as
          Record<
            string,
            readonly string[]
          >;

    assert.deepEqual(
      byParent[
        mainSha
      ],
      [
        "feature.txt",
      ],
    );

    assert.deepEqual(
      byParent[
        featureSha
      ],
      [
        "main.txt",
      ],
    );

    assert.deepEqual(
      mergeSource
        .metadata.changedPaths,
      [
        "feature.txt",
        "main.txt",
      ],
    );
  },
);

test(
  "annotated tag refs are peeled and retained on the commit they reference",
  async () => {
    const root =
      repository();

    const sha =
      commit(
        root,
        {
          file:
            "release.txt",

          content:
            "release",

          subject:
            "release commit",

          timestamp:
            "2026-01-01T00:00:00Z",
        },
      );

    git(
      root,
      [
        "tag",
        "-a",
        "v1.0.0",
        "-m",
        "release v1",
        sha,
      ],
      {
        GIT_COMMITTER_DATE:
          "2026-01-02T00:00:00Z",
      },
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const source =
      result.sources.find(
        (
          item,
        ) =>
          item.stableSourceKey ===
          sha,
      );

    assert.ok(
      source,
    );

    const directRefs =
      source
        .metadata
        .directRefs as
          readonly string[];

    assert.equal(
      directRefs.includes(
        "refs/tags/v1.0.0",
      ),
      true,
    );
  },
);
