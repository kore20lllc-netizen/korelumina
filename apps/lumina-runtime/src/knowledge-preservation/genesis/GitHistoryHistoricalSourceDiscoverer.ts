import {
  createHash,
} from "node:crypto";

import {
  execFileSync,
} from "node:child_process";

import {
  realpathSync,
} from "node:fs";

import type {
  GenesisReplayScope,
} from "./GenesisSourceManifest.js";

import type {
  HistoricalSource,
} from "./HistoricalSource.js";

import {
  createHistoricalSourceId,
} from "./HistoricalSourceIdentity.js";

import type {
  HistoricalSourceDiscoverer,
  HistoricalSourceDiscoveryError,
  HistoricalSourceDiscoveryResult,
} from "./HistoricalSourceDiscovery.js";

export interface GitHistoryHistoricalSourceDiscovererOptions {
  repositoryRoot:
    string;

  discovererId?:
    string;

  discoveredAt?:
    () => number;
}

interface GitCommitRecord {
  sha:
    string;

  parentShas:
    readonly string[];

  authorName:
    string;

  authorEmail:
    string;

  authorTimestamp:
    number;

  committerName:
    string;

  committerEmail:
    string;

  committerTimestamp:
    number;

  subject:
    string;

  body:
    string;

  changedPaths:
    readonly string[];

  changedPathsByParent:
    Readonly<
      Record<
        string,
        readonly string[]
      >
    >;

  refs:
    readonly string[];

  checksum:
    string;
}

function runGit(
  repositoryRoot:
    string,

  args:
    readonly string[],
): string {
  return execFileSync(
    "git",
    [
      ...args,
    ],
    {
      cwd:
        repositoryRoot,

      encoding:
        "utf8",

      maxBuffer:
        64 *
        1024 *
        1024,

      stdio: [
        "ignore",
        "pipe",
        "pipe",
      ],
    },
  );
}

function parseTimestamp(
  value:
    string,

  error:
    string,
): number {
  const normalized =
    value.trim();

  if (
    !/^-?\d+$/.test(
      normalized,
    )
  ) {
    throw new Error(
      error,
    );
  }

  return (
    Number(
      normalized,
    ) *
    1000
  );
}

function sha256(
  content:
    string,
): string {
  return (
    "sha256:" +
    createHash(
      "sha256",
    )
      .update(
        content,
        "utf8",
      )
      .digest(
        "hex",
      )
  );
}

function listCommitShas(
  repositoryRoot:
    string,

  scope:
    GenesisReplayScope,
): readonly string[] {
  const args =
    scope.ref
      ? [
          "rev-list",
          "--topo-order",
          scope.ref,
        ]
      : [
          "rev-list",
          "--topo-order",
          "--all",
        ];

  const output =
    runGit(
      repositoryRoot,
      args,
    );

  return output
    .split(
      /\r?\n/,
    )
    .map(
      (
        value,
      ) =>
        value.trim(),
    )
    .filter(
      Boolean,
    )
    .sort();
}

function listDirectRefs(
  repositoryRoot:
    string,
): ReadonlyMap<
  string,
  readonly string[]
> {
  const output =
    runGit(
      repositoryRoot,
      [
        "for-each-ref",
        "--format=%(objectname)%09%(*objectname)%09%(refname)",
        "refs/heads",
        "refs/tags",
      ],
    );

  const refsByObject =
    new Map<
      string,
      string[]
    >();

  for (
    const line
    of output.split(
      /\r?\n/,
    )
  ) {
    if (
      !line.trim()
    ) {
      continue;
    }

    const [
      objectShaRaw,
      peeledShaRaw,
      refRaw,
    ] =
      line.split(
        "\t",
      );

    const objectSha =
      objectShaRaw
        ?.trim();

    const peeledSha =
      peeledShaRaw
        ?.trim();

    const ref =
      refRaw
        ?.trim();

    const sha =
      peeledSha ||
      objectSha;

    if (
      !sha ||
      !ref
    ) {
      continue;
    }

    const existing =
      refsByObject.get(
        sha,
      ) ??
      [];

    existing.push(
      ref,
    );

    refsByObject.set(
      sha,
      existing,
    );
  }

  return new Map(
    [
      ...refsByObject.entries(),
    ].map(
      (
        [
          sha,
          refs,
        ],
      ) => [
        sha,
        [
          ...refs,
        ].sort(),
      ],
    ),
  );
}

function changedPathsAgainstParent(
  repositoryRoot:
    string,

  parentSha:
    string,

  commitSha:
    string,
): readonly string[] {
  const output =
    runGit(
      repositoryRoot,
      [
        "diff",
        "--name-only",
        parentSha,
        commitSha,
        "--",
      ],
    );

  return [
    ...new Set(
      output
        .split(
          /\r?\n/,
        )
        .map(
          (
            value,
          ) =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  ].sort();
}

function rootCommitChangedPaths(
  repositoryRoot:
    string,

  sha:
    string,
): readonly string[] {
  const output =
    runGit(
      repositoryRoot,
      [
        "diff-tree",
        "--root",
        "--no-commit-id",
        "--name-only",
        "-r",
        sha,
      ],
    );

  return [
    ...new Set(
      output
        .split(
          /\r?\n/,
        )
        .map(
          (
            value,
          ) =>
            value.trim(),
        )
        .filter(
          Boolean,
        ),
    ),
  ].sort();
}

function changedPathTopologyForCommit(
  repositoryRoot:
    string,

  sha:
    string,

  parentShas:
    readonly string[],
): {
  changedPaths:
    readonly string[];

  changedPathsByParent:
    Readonly<
      Record<
        string,
        readonly string[]
      >
    >;
} {
  if (
    parentShas.length ===
      0
  ) {
    return {
      changedPaths:
        rootCommitChangedPaths(
          repositoryRoot,
          sha,
        ),

      changedPathsByParent:
        {},
    };
  }

  const changedPathsByParent:
    Record<
      string,
      readonly string[]
    > =
      {};

  const union =
    new Set<
      string
    >();

  for (
    const parentSha
    of [
      ...parentShas,
    ].sort()
  ) {
    const paths =
      changedPathsAgainstParent(
        repositoryRoot,
        parentSha,
        sha,
      );

    changedPathsByParent[
      parentSha
    ] =
      paths;

    for (
      const changedPath
      of paths
    ) {
      union.add(
        changedPath,
      );
    }
  }

  return {
    changedPaths: [
      ...union,
    ].sort(),

    changedPathsByParent,
  };
}

function readCommitRecord(
  repositoryRoot:
    string,

  sha:
    string,

  refsByObject:
    ReadonlyMap<
      string,
      readonly string[]
    >,
): GitCommitRecord {
  const format =
    [
      "%H",
      "%P",
      "%an",
      "%ae",
      "%at",
      "%cn",
      "%ce",
      "%ct",
      "%s",
      "%b",
    ].join(
      "%x00",
    );

  const output =
    runGit(
      repositoryRoot,
      [
        "show",
        "-s",
        `--format=${format}`,
        sha,
      ],
    );

  const parts =
    output.split(
      "\0",
    );

  if (
    parts.length <
    10
  ) {
    throw new Error(
      "genesis_git_commit_metadata_incomplete",
    );
  }

  const [
    resolvedSha,
    parents,
    authorName,
    authorEmail,
    authorTimestamp,
    committerName,
    committerEmail,
    committerTimestamp,
    subject,
    ...bodyParts
  ] = parts;

  const body =
    bodyParts
      .join(
        "\0",
      )
      .replace(
        /\r?\n$/,
        "",
      );

  const rawCommit =
    runGit(
      repositoryRoot,
      [
        "cat-file",
        "commit",
        sha,
      ],
    );

  const parentShas =
    parents
      .trim()
      .split(
        /\s+/,
      )
      .filter(
        Boolean,
      );

  const changedPathTopology =
    changedPathTopologyForCommit(
      repositoryRoot,
      sha,
      parentShas,
    );

  return {
    sha:
      resolvedSha.trim(),

    parentShas,

    authorName:
      authorName.trim(),

    authorEmail:
      authorEmail.trim(),

    authorTimestamp:
      parseTimestamp(
        authorTimestamp,
        "genesis_git_author_timestamp_invalid",
      ),

    committerName:
      committerName.trim(),

    committerEmail:
      committerEmail.trim(),

    committerTimestamp:
      parseTimestamp(
        committerTimestamp,
        "genesis_git_committer_timestamp_invalid",
      ),

    subject:
      subject.trim(),

    body:
      body.trim(),

    changedPaths:
      changedPathTopology
        .changedPaths,

    changedPathsByParent:
      changedPathTopology
        .changedPathsByParent,

    refs:
      refsByObject.get(
        sha,
      ) ??
      [],

    checksum:
      sha256(
        rawCommit,
      ),
  };
}

function eligibilityForCommit(
  scope:
    GenesisReplayScope,

  historicalSourceId:
    HistoricalSource[
      "historicalSourceId"
    ],

  committerTimestamp:
    number,
): {
  replayEligibility:
    HistoricalSource[
      "replayEligibility"
    ];

  exclusionReason?:
    string;
} {
  if (
    scope.excludedEvidenceTypes.includes(
      "commit",
    ) ||
    !scope.includedEvidenceTypes.includes(
      "commit",
    )
  ) {
    return {
      replayEligibility:
        "excluded",

      exclusionReason:
        "evidence_type_outside_replay_scope",
    };
  }

  if (
    scope
      .explicitlyExcludedSourceIds
      .includes(
        historicalSourceId,
      )
  ) {
    return {
      replayEligibility:
        "excluded",

      exclusionReason:
        "explicit_source_exclusion",
    };
  }

  if (
    scope.historicalStart !==
      undefined &&
    committerTimestamp <
      scope.historicalStart
  ) {
    return {
      replayEligibility:
        "excluded",

      exclusionReason:
        "before_replay_scope",
    };
  }

  if (
    scope.historicalEnd !==
      undefined &&
    committerTimestamp >
      scope.historicalEnd
  ) {
    return {
      replayEligibility:
        "excluded",

      exclusionReason:
        "after_replay_scope",
    };
  }

  return {
    replayEligibility:
      "eligible",
  };
}

function compareCommitSources(
  left:
    HistoricalSource,

  right:
    HistoricalSource,
): number {
  const timestampOrder =
    left.historicalTimestamp.value -
    right.historicalTimestamp.value;

  if (
    timestampOrder !==
    0
  ) {
    return timestampOrder;
  }

  return left.historicalSourceId
    .localeCompare(
      right.historicalSourceId,
    );
}

export class GitHistoryHistoricalSourceDiscoverer
  implements HistoricalSourceDiscoverer
{
  readonly id:
    string;

  readonly sourceClasses =
    [
      "commit",
    ] as const;

  private readonly repositoryRoot:
    string;

  private readonly discoveredAt:
    () => number;

  constructor(
    options:
      GitHistoryHistoricalSourceDiscovererOptions,
  ) {
    this.repositoryRoot =
      realpathSync(
        options.repositoryRoot,
      );

    this.id =
      options.discovererId ??
      "git-history-v1";

    this.discoveredAt =
      options.discoveredAt ??
      (() =>
        Date.now());
  }

  async discover(
    scope:
      GenesisReplayScope,
  ): Promise<
    HistoricalSourceDiscoveryResult
  > {
    const sources:
      HistoricalSource[] =
        [];

    const errors:
      HistoricalSourceDiscoveryError[] =
        [];

    let shas:
      readonly string[];

    let refsByObject:
      ReadonlyMap<
        string,
        readonly string[]
      >;

    try {
      shas =
        listCommitShas(
          this.repositoryRoot,
          scope,
        );

      refsByObject =
        listDirectRefs(
          this.repositoryRoot,
        );
    } catch (
      error
    ) {
      return {
        discovererId:
          this.id,

        sources:
          [],

        errors: [
          {
            code:
              "SOURCE_UNAVAILABLE",

            discovererId:
              this.id,

            message:
              "Git repository history is unavailable",

            cause:
              error instanceof Error
                ? error.message
                : String(
                    error,
                  ),
          },
        ],
      };
    }

    for (
      const sha
      of shas
    ) {
      const historicalSourceId =
        createHistoricalSourceId(
          "commit",
          sha,
        );

      try {
        const commit =
          readCommitRecord(
            this.repositoryRoot,
            sha,
            refsByObject,
          );

        const eligibility =
          eligibilityForCommit(
            scope,
            historicalSourceId,
            commit.committerTimestamp,
          );

        sources.push({
          historicalSourceId,

          sourceClass:
            "commit",

          evidenceType:
            "commit",

          stableSourceKey:
            commit.sha,

          sourceChecksum:
            commit.checksum,

          provenance: {
            locator:
              `git:commit:${commit.sha}`,

            nativeId:
              commit.sha,

            repository:
              scope.repository,

            ref:
              scope.ref,

            parentIds:
              commit.parentShas,
          },

          historicalTimestamp: {
            value:
              commit.committerTimestamp,

            source:
              "git-committer-time",
          },

          discoveredAt:
            this.discoveredAt(),

          discoveryMethod:
            "git-history-v1",

          authority: {
            authorityClass:
              "repository-history",
          },

          replayEligibility:
            eligibility.replayEligibility,

          exclusionReason:
            eligibility.exclusionReason,

          supersedes:
            [],

          conflictsWith:
            [],

          metadata: {
            commitSha:
              commit.sha,

            parentShas:
              commit.parentShas,

            author: {
              name:
                commit.authorName,

              email:
                commit.authorEmail,

              timestamp:
                commit.authorTimestamp,
            },

            committer: {
              name:
                commit.committerName,

              email:
                commit.committerEmail,

              timestamp:
                commit.committerTimestamp,
            },

            subject:
              commit.subject,

            body:
              commit.body,

            changedPaths:
              commit.changedPaths,

            changedPathsByParent:
              commit
                .changedPathsByParent,

            directRefs:
              commit.refs,

            topology:
              "git-parent-graph",
          },
        });
      } catch (
        error
      ) {
        errors.push({
          code:
            "PROVENANCE_INCOMPLETE",

          discovererId:
            this.id,

          historicalSourceId,

          provenanceLocator:
            `git:commit:${sha}`,

          message:
            "Git commit could not be reconstructed completely",

          cause:
            error instanceof Error
              ? error.message
              : String(
                  error,
                ),
        });
      }
    }

    return {
      discovererId:
        this.id,

      sources:
        sources.sort(
          compareCommitSources,
        ),

      errors,
    };
  }
}
