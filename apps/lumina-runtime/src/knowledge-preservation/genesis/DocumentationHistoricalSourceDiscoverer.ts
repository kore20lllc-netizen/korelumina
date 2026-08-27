import {
  createHash,
} from "node:crypto";

import {
  execFileSync,
} from "node:child_process";

import {
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";

import path from "node:path";

import type {
  EvidenceType,
} from "../evidence/index.js";

import type {
  GenesisReplayScope,
} from "./GenesisSourceManifest.js";

import type {
  HistoricalSource,
  HistoricalSourceClass,
} from "./HistoricalSource.js";

import {
  createDerivedHistoricalSourceId,
} from "./HistoricalSourceIdentity.js";

import type {
  HistoricalSourceDiscoverer,
  HistoricalSourceDiscoveryError,
  HistoricalSourceDiscoveryResult,
} from "./HistoricalSourceDiscovery.js";

const DEFAULT_DOCUMENT_ROOTS =
  [
    "BLUEPRINT.md",
    "docs/canon",
    "docs/constitution",
    "docs/governance",
    "docs/adr",
    "docs/rfc",
    "docs/architecture",
    "docs/chief-agent",
    "docs/specification",
    "docs/specifications",
    "docs/roadmap",
    "docs/roadmaps",
    "docs/certification",
  ] as const;

export interface DocumentationHistoricalTimestamp {
  value:
    number;

  source:
    string;
}

export type DocumentationHistoricalTimestampResolver =
  (
    input: {
      repositoryRoot:
        string;

      repositoryRelativePath:
        string;
    },
  ) =>
    DocumentationHistoricalTimestamp |
    null;

export interface DocumentationHistoricalSourceDiscovererOptions {
  repositoryRoot:
    string;

  documentRoots?:
    readonly string[];

  discovererId?:
    string;

  discoveredAt?:
    () => number;

  historicalTimestampResolver?:
    DocumentationHistoricalTimestampResolver;

  sectionDocumentPaths?:
    readonly string[];
}

interface DocumentClassification {
  sourceClass:
    HistoricalSourceClass;

  evidenceType:
    EvidenceType;

  authorityClass:
    string;

  documentClassification:
    string;
}


interface DocumentationSection {
  title:
    string;

  slug:
    string;

  lineStart:
    number;

  lineEnd:
    number;

  content:
    string;
}


function sectionSlug(
  title:
    string,
): string {
  return title
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    ) || "section";
}


function parseDocumentSections(
  content:
    string,
): DocumentationSection[] {
  const lines =
    content.split(
      /\r?\n/,
    );

  const headings:
    {
      title:
        string;

      line:
        number;
    }[] = [];

  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    const match =
      (
        lines[index] ??
        ""
      ).match(
        /^#{1,6}\s+(.+?)\s*$/,
      );

    if (
      !match?.[1]
    ) {
      continue;
    }

    headings.push({
      title:
        match[1].trim(),

      line:
        index + 1,
    });
  }

  return headings.map(
    (
      heading,
      index,
    ) => {
      const next =
        headings[
          index + 1
        ];

      const lineEnd =
        next
          ? next.line - 1
          : lines.length;

      return {
        title:
          heading.title,

        slug:
          sectionSlug(
            heading.title,
          ),

        lineStart:
          heading.line,

        lineEnd,

        content:
          lines
            .slice(
              heading.line - 1,
              lineEnd,
            )
            .join(
              "\n",
            ),
      };
    },
  );
}


interface ParsedDocumentMetadata {
  title:
    string;

  authority?:
    string;

  approvalState?:
    string;

  status?:
    string;

  owner?:
    string;

  scope?:
    string;

  version?:
    string;

  effectiveFrom?:
    string;

  effectiveTo?:
    string;

  approvalDate?:
    string;
}

function toPosixPath(
  value:
    string,
): string {
  return value
    .split(
      path.sep,
    )
    .join(
      "/",
    );
}

function normalizeRepositoryRelativePath(
  repositoryRoot:
    string,

  absolutePath:
    string,
): string {
  const relative =
    path.relative(
      repositoryRoot,
      absolutePath,
    );

  if (
    relative ===
      "" ||
    relative ===
      ".." ||
    relative.startsWith(
      `..${path.sep}`,
    ) ||
    path.isAbsolute(
      relative,
    )
  ) {
    throw new Error(
      "genesis_documentation_path_outside_repository",
    );
  }

  return toPosixPath(
    relative,
  );
}

function assertInsideRepository(
  repositoryRoot:
    string,

  candidate:
    string,
): void {
  const relative =
    path.relative(
      repositoryRoot,
      candidate,
    );

  if (
    relative ===
      ".." ||
    relative.startsWith(
      `..${path.sep}`,
    ) ||
    path.isAbsolute(
      relative,
    )
  ) {
    throw new Error(
      "genesis_documentation_path_outside_repository",
    );
  }
}

function collectMarkdownFiles(
  repositoryRoot:
    string,

  documentRoots:
    readonly string[],
): readonly string[] {
  const files:
    string[] =
      [];

  const visit =
    (
      absoluteDirectory:
        string,
    ) => {
      assertInsideRepository(
        repositoryRoot,
        absoluteDirectory,
      );

      const entries =
        readdirSync(
          absoluteDirectory,
          {
            withFileTypes:
              true,
          },
        )
          .slice()
          .sort(
            (
              left,
              right,
            ) =>
              left.name.localeCompare(
                right.name,
              ),
          );

      for (
        const entry
        of entries
      ) {
        const absolute =
          path.join(
            absoluteDirectory,
            entry.name,
          );

        if (
          entry.isSymbolicLink()
        ) {
          continue;
        }

        if (
          entry.isDirectory()
        ) {
          visit(
            absolute,
          );

          continue;
        }

        if (
          entry.isFile() &&
          entry.name
            .toLowerCase()
            .endsWith(
              ".md",
            )
        ) {
          files.push(
            absolute,
          );
        }
      }
    };

  for (
    const configuredRoot
    of [
      ...documentRoots,
    ].sort()
  ) {
    const absoluteRoot =
      path.resolve(
        repositoryRoot,
        configuredRoot,
      );

    assertInsideRepository(
      repositoryRoot,
      absoluteRoot,
    );

    try {
      const info =
        statSync(
          absoluteRoot,
        );

      if (
        info.isDirectory()
      ) {
        visit(
          absoluteRoot,
        );

        continue;
      }

      if (
        info.isFile() &&
        absoluteRoot
          .toLowerCase()
          .endsWith(
            ".md",
          )
      ) {
        files.push(
          absoluteRoot,
        );
      }
    } catch (
      error
    ) {
      const code =
        (
          error as {
            code?:
              string;
          }
        ).code;

      if (
        code ===
        "ENOENT"
      ) {
        continue;
      }

      throw error;
    }
  }

  return files.sort(
    (
      left,
      right,
    ) =>
      normalizeRepositoryRelativePath(
        repositoryRoot,
        left,
      ).localeCompare(
        normalizeRepositoryRelativePath(
          repositoryRoot,
          right,
        ),
      ),
  );
}

function classifyDocument(
  repositoryRelativePath:
    string,
): DocumentClassification {
  const normalized =
    repositoryRelativePath
      .toLowerCase();

  const basename =
    path.posix.basename(
      repositoryRelativePath,
    );

  if (
    normalized ===
      "blueprint.md"
  ) {
    return {
      sourceClass:
        "architecture-document",

      evidenceType:
        "document",

      authorityClass:
        "blueprint",

      documentClassification:
        "blueprint",
    };
  }

  if (
    normalized.startsWith(
      "docs/constitution/",
    )
  ) {
    return {
      sourceClass:
        "document",

      evidenceType:
        "document",

      authorityClass:
        "constitution",

      documentClassification:
        "constitution",
    };
  }

  if (
    normalized.startsWith(
      "docs/certification/",
    )
  ) {
    return {
      sourceClass:
        "document",

      evidenceType:
        "document",

      authorityClass:
        "certification",

      documentClassification:
        "certification",
    };
  }

  if (
    normalized.startsWith(
      "docs/adr/",
    ) ||
    /^adr[-_ ]?\d+/i.test(
      basename,
    )
  ) {
    return {
      sourceClass:
        "ADR",

      evidenceType:
        "ADR",

      authorityClass:
        "architecture-decision",

      documentClassification:
        "adr",
    };
  }

  if (
    normalized.startsWith(
      "docs/rfc/",
    ) ||
    /^rfc[-_ ]?\d+/i.test(
      basename,
    )
  ) {
    return {
      sourceClass:
        "RFC",

      evidenceType:
        "RFC",

      authorityClass:
        "request-for-comments",

      documentClassification:
        "rfc",
    };
  }

  if (
    normalized.startsWith(
      "docs/architecture/",
    )
  ) {
    return {
      sourceClass:
        "architecture-document",

      evidenceType:
        "document",

      authorityClass:
        "architecture",

      documentClassification:
        "architecture",
    };
  }

  if (
    normalized.startsWith(
      "docs/specification/",
    ) ||
    normalized.startsWith(
      "docs/specifications/",
    )
  ) {
    return {
      sourceClass:
        "specification",

      evidenceType:
        "specification",

      authorityClass:
        "specification",

      documentClassification:
        "specification",
    };
  }

  if (
    normalized.startsWith(
      "docs/roadmap/",
    ) ||
    normalized.startsWith(
      "docs/roadmaps/",
    )
  ) {
    return {
      sourceClass:
        "roadmap",

      evidenceType:
        "roadmap",

      authorityClass:
        "roadmap",

      documentClassification:
        "roadmap",
    };
  }

  if (
    normalized.startsWith(
      "docs/canon/",
    )
  ) {
    return {
      sourceClass:
        "document",

      evidenceType:
        "document",

      authorityClass:
        "canonical-document",

      documentClassification:
        "canonical",
    };
  }

  if (
    normalized.startsWith(
      "docs/governance/",
    )
  ) {
    return {
      sourceClass:
        "document",

      evidenceType:
        "document",

      authorityClass:
        "governance",

      documentClassification:
        "governance",
    };
  }

  return {
    sourceClass:
      "document",

    evidenceType:
      "document",

    authorityClass:
      "documentation",

    documentClassification:
      "document",
  };
}

function metadataValue(
  line:
    string,

  key:
    string,
): string | undefined {
  const escaped =
    key.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

  const match =
    line.match(
      new RegExp(
        `^\\s*(?:[-*]\\s*)?${escaped}\\s*:\\s*(.+?)\\s*$`,
        "i",
      ),
    );

  const value =
    match?.[1]
      ?.trim();

  return value ||
    undefined;
}

function sectionMetadataValue(
  lines:
    readonly string[],

  key:
    string,
): string | undefined {
  const escaped =
    key.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

  const headingPattern =
    new RegExp(
      `^\\s*#{2,6}\\s+${escaped}\\s*$`,
      "i",
    );

  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    if (
      !headingPattern.test(
        lines[index] ?? "",
      )
    ) {
      continue;
    }

    for (
      let valueIndex =
        index + 1;
      valueIndex <
        lines.length;
      valueIndex += 1
    ) {
      const candidate =
        (
          lines[valueIndex] ??
          ""
        ).trim();

      if (
        candidate.length ===
        0
      ) {
        continue;
      }

      if (
        /^#{1,6}\s+/.test(
          candidate,
        )
      ) {
        return undefined;
      }

      return candidate
        .replace(
          /[.]$/,
          "",
        )
        .trim() ||
        undefined;
    }
  }

  return undefined;
}


function parseDocumentMetadata(
  content:
    string,

  repositoryRelativePath:
    string,
): ParsedDocumentMetadata {
  const lines =
    content
      .split(
        /\r?\n/,
      )
      .slice(
        0,
        160,
      );

  let title:
    string | undefined;

  let authority:
    string | undefined;

  let approvalState:
    string | undefined;

  let status:
    string | undefined;

  let owner:
    string | undefined;

  let scope:
    string | undefined;

  let version:
    string | undefined;

  let effectiveFrom:
    string | undefined;

  let effectiveTo:
    string | undefined;

  let approvalDate:
    string | undefined;

  for (
    const line
    of lines
  ) {
    if (
      !title
    ) {
      const heading =
        line.match(
          /^#\s+(.+?)\s*$/,
        );

      if (
        heading?.[1]
      ) {
        title =
          heading[1]
            .trim();
      }
    }

    authority ??=
      metadataValue(
        line,
        "Authority",
      );

    approvalState ??=
      metadataValue(
        line,
        "Approval State",
      );

    status ??=
      metadataValue(
        line,
        "Status",
      );

    owner ??=
      metadataValue(
        line,
        "Owner",
      );

    scope ??=
      metadataValue(
        line,
        "Scope",
      );

    version ??=
      metadataValue(
        line,
        "Version",
      );

    effectiveFrom ??=
      metadataValue(
        line,
        "Effective From",
      ) ??
      metadataValue(
        line,
        "Effective Date",
      );

    effectiveTo ??=
      metadataValue(
        line,
        "Effective To",
      );

    approvalDate ??=
      metadataValue(
        line,
        "Approval Date",
      ) ??
      metadataValue(
        line,
        "approval_date",
      );
  }

  status ??=
    sectionMetadataValue(
      lines,
      "Status",
    );

  return {
    title:
      title ??
      path.posix.basename(
        repositoryRelativePath,
        path.posix.extname(
          repositoryRelativePath,
        ),
      ),

    authority,

    approvalState,

    status,

    owner,

    scope,

    version,

    effectiveFrom,

    effectiveTo,

    approvalDate,
  };
}


/*
 * Repository documentation uses richer human governance states than
 * the downstream Documentation Governance Validator.
 *
 * Preserve the observed state in metadata. Normalize to the
 * manufacturing approval contract only when repository evidence makes
 * approval deterministic.
 *
 * This function MUST NOT infer missing owner, scope, version, or other
 * authority identity.
 */
function normalizedManufacturingApprovalState(
  input: {
    repositoryRelativePath:
      string;

    parsed:
      ParsedDocumentMetadata;
  },
): string | undefined {
  const explicitApproval =
    input.parsed.approvalState
      ?.trim();

  if (
    explicitApproval
  ) {
    return explicitApproval;
  }

  const observedStatus =
    input.parsed.status
      ?.trim()
      .toLowerCase();

  if (
    observedStatus ===
      "canonical" ||
    observedStatus ===
      "authoritative"
  ) {
    return "approved";
  }

  const normalizedPath =
    input.repositoryRelativePath
      .toLowerCase();

  const isConstitutionalAmendmentRecord =
    normalizedPath.startsWith(
      "docs/architecture/amendments/",
    ) &&
    /^ca-\d+/i.test(
      path.posix.basename(
        input.repositoryRelativePath,
      ),
    );

  if (
    isConstitutionalAmendmentRecord &&
    observedStatus ===
      "constitutional amendment record" &&
    input.parsed.approvalDate
      ?.trim()
  ) {
    return "approved";
  }

  return input.parsed.status;
}


function checksumFor(
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

function evidenceTypeIncluded(
  scope:
    GenesisReplayScope,

  evidenceType:
    EvidenceType,
): boolean {
  if (
    scope.excludedEvidenceTypes.includes(
      evidenceType,
    )
  ) {
    return false;
  }

  return scope.includedEvidenceTypes.includes(
    evidenceType,
  );
}

function eligibilityFor(
  input: {
    scope:
      GenesisReplayScope;

    historicalSourceId:
      HistoricalSource[
        "historicalSourceId"
      ];

    evidenceType:
      EvidenceType;

    historicalTimestamp:
      number;
  },
): {
  replayEligibility:
    HistoricalSource[
      "replayEligibility"
    ];

  exclusionReason?:
    string;
} {
  if (
    !evidenceTypeIncluded(
      input.scope,
      input.evidenceType,
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
    input.scope
      .explicitlyExcludedSourceIds
      .includes(
        input.historicalSourceId,
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
    input.scope.historicalStart !==
      undefined &&
    input.historicalTimestamp <
      input.scope.historicalStart
  ) {
    return {
      replayEligibility:
        "excluded",

      exclusionReason:
        "before_replay_scope",
    };
  }

  if (
    input.scope.historicalEnd !==
      undefined &&
    input.historicalTimestamp >
      input.scope.historicalEnd
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

export function resolveDocumentationHistoricalTimestampFromGit(
  input: {
    repositoryRoot:
      string;

    repositoryRelativePath:
      string;
  },
): DocumentationHistoricalTimestamp | null {
  try {
    const output =
      execFileSync(
        "git",
        [
          "log",
          "-1",
          "--format=%ct",
          "--",
          input.repositoryRelativePath,
        ],
        {
          cwd:
            input.repositoryRoot,

          encoding:
            "utf8",

          stdio: [
            "ignore",
            "pipe",
            "ignore",
          ],
        },
      )
        .trim();

    if (
      !/^\d+$/.test(
        output,
      )
    ) {
      return null;
    }

    return {
      value:
        Number(
          output,
        ) *
        1000,

      source:
        "git-last-change-time",
    };
  } catch {
    return null;
  }
}

export class DocumentationHistoricalSourceDiscoverer
  implements HistoricalSourceDiscoverer
{
  readonly id:
    string;

  readonly sourceClasses =
    [
      "ADR",
      "RFC",
      "architecture-document",
      "document",
      "specification",
      "roadmap",
    ] as const;

  private readonly repositoryRoot:
    string;

  private readonly documentRoots:
    readonly string[];

  private readonly sectionDocumentPaths:
    ReadonlySet<string>;

  private readonly discoveredAt:
    () => number;

  private readonly historicalTimestampResolver:
    DocumentationHistoricalTimestampResolver;

  constructor(
    options:
      DocumentationHistoricalSourceDiscovererOptions,
  ) {
    this.repositoryRoot =
      realpathSync(
        options.repositoryRoot,
      );

    this.documentRoots =
      options.documentRoots ??
      DEFAULT_DOCUMENT_ROOTS;

    this.sectionDocumentPaths =
      new Set(
        (
          options.sectionDocumentPaths ??
          []
        ).map(
          value =>
            value
              .replaceAll(
                "\\",
                "/",
              )
              .replace(
                /^\.\//,
                "",
              )
              .trim(),
        ).filter(
          value =>
            value.length >
            0,
        ),
      );

    this.id =
      options.discovererId ??
      "documentation-v1";

    this.discoveredAt =
      options.discoveredAt ??
      (() =>
        Date.now());

    this.historicalTimestampResolver =
      options.historicalTimestampResolver ??
      resolveDocumentationHistoricalTimestampFromGit;
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

    const files =
      collectMarkdownFiles(
        this.repositoryRoot,
        this.documentRoots,
      );

    for (
      const absolutePath
      of files
    ) {
      const repositoryRelativePath =
        normalizeRepositoryRelativePath(
          this.repositoryRoot,
          absolutePath,
        );

      const content =
        readFileSync(
          absolutePath,
          "utf8",
        );

      const checksum =
        checksumFor(
          content,
        );

      const classification =
        classifyDocument(
          repositoryRelativePath,
        );

      const historicalSourceId =
        createDerivedHistoricalSourceId(
          classification.evidenceType,
          {
            provenanceLocator:
              repositoryRelativePath,
          },
        );

      const timestamp =
        this.historicalTimestampResolver({
          repositoryRoot:
            this.repositoryRoot,

          repositoryRelativePath,
        });

      if (
        !timestamp
      ) {
        errors.push({
          code:
            "TIMESTAMP_UNAVAILABLE",

          discovererId:
            this.id,

          historicalSourceId,

          provenanceLocator:
            repositoryRelativePath,

          message:
            "trustworthy historical document timestamp unavailable",
        });

        sources.push({
          historicalSourceId,

          sourceClass:
            classification.sourceClass,

          evidenceType:
            classification.evidenceType,

          stableSourceKey:
            repositoryRelativePath,

          sourceChecksum:
            checksum,

          provenance: {
            locator:
              repositoryRelativePath,

            repository:
              scope.repository,

            ref:
              scope.ref,
          },

          historicalTimestamp: {
            value:
              0,

            source:
              "unavailable",
          },

          discoveredAt:
            this.discoveredAt(),

          discoveryMethod:
            "documentation-v1",

          authority: {
            authorityClass:
              classification.authorityClass,
          },

          replayEligibility:
            "blocked",

          exclusionReason:
            "historical_timestamp_unavailable",

          supersedes:
            [],

          conflictsWith:
            [],

          metadata: {
            documentClassification:
              classification
                .documentClassification,

            sourceLocation:
              repositoryRelativePath,
          },
        });

        continue;
      }

      const parsed =
        parseDocumentMetadata(
          content,
          repositoryRelativePath,
        );

      const eligibility =
        eligibilityFor({
          scope,

          historicalSourceId,

          evidenceType:
            classification.evidenceType,

          historicalTimestamp:
            timestamp.value,
        });

      sources.push({
        historicalSourceId,

        sourceClass:
          classification.sourceClass,

        evidenceType:
          classification.evidenceType,

        stableSourceKey:
          repositoryRelativePath,

        sourceChecksum:
          checksum,

        provenance: {
          locator:
            repositoryRelativePath,

          repository:
            scope.repository,

          ref:
            scope.ref,
        },

        historicalTimestamp:
          timestamp,

        discoveredAt:
          this.discoveredAt(),

        discoveryMethod:
          "documentation-v1",

        authority: {
          authorityClass:
            parsed.authority ??
            classification.authorityClass,

          approvalState:
            normalizedManufacturingApprovalState({
              repositoryRelativePath,

              parsed,
            }),

          owner:
            parsed.owner,

          scope:
            parsed.scope,

          version:
            parsed.version,

          effectiveFrom:
            parsed.effectiveFrom,

          effectiveTo:
            parsed.effectiveTo,
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
          title:
            parsed.title,

          status:
            parsed.status,

          observedApprovalState:
            parsed.approvalState,

          approvalDate:
            parsed.approvalDate,

          documentClassification:
            classification
              .documentClassification,

          sourceLocation:
            repositoryRelativePath,
        },
      });

      if (
        this.sectionDocumentPaths.has(
          repositoryRelativePath,
        )
      ) {
        const sections =
          parseDocumentSections(
            content,
          );

        for (
          const section
          of sections
        ) {
          const sectionLocator =
            [
              repositoryRelativePath,
              "#section:",
              section.slug,
              ":",
              section.lineStart,
              "-",
              section.lineEnd,
            ].join(
              "",
            );

          const sectionHistoricalSourceId =
            createDerivedHistoricalSourceId(
              classification.evidenceType,
              {
                provenanceLocator:
                  sectionLocator,
              },
            );

          const sectionEligibility =
            eligibilityFor({
              scope,

              historicalSourceId:
                sectionHistoricalSourceId,

              evidenceType:
                classification.evidenceType,

              historicalTimestamp:
                timestamp.value,
            });

          sources.push({
            historicalSourceId:
              sectionHistoricalSourceId,

            sourceClass:
              classification.sourceClass,

            evidenceType:
              classification.evidenceType,

            stableSourceKey:
              sectionLocator,

            sourceChecksum:
              checksumFor(
                section.content,
              ),

            provenance: {
              locator:
                sectionLocator,

              repository:
                scope.repository,

              ref:
                scope.ref,

              parentIds: [
                historicalSourceId,
              ],
            },

            historicalTimestamp:
              timestamp,

            discoveredAt:
              this.discoveredAt(),

            discoveryMethod:
              "documentation-section-v1",

            authority: {
              authorityClass:
                parsed.authority ??
                classification.authorityClass,

              approvalState:
                normalizedManufacturingApprovalState({
                  repositoryRelativePath,

                  parsed,
                }),

              owner:
                parsed.owner,

              scope:
                parsed.scope,

              version:
                parsed.version,

              effectiveFrom:
                parsed.effectiveFrom,

              effectiveTo:
                parsed.effectiveTo,
            },

            replayEligibility:
              sectionEligibility
                .replayEligibility,

            exclusionReason:
              sectionEligibility
                .exclusionReason,

            supersedes:
              [],

            conflictsWith:
              [],

            metadata: {
              title:
                section.title,

              status:
                parsed.status,

              observedApprovalState:
                parsed.approvalState,

              approvalDate:
                parsed.approvalDate,

              documentClassification:
                classification
                  .documentClassification,

              sourceLocation:
                repositoryRelativePath,

              lineStart:
                section.lineStart,

              lineEnd:
                section.lineEnd,

              sectionTitle:
                section.title,

              sectionSlug:
                section.slug,

              parentHistoricalSourceId:
                historicalSourceId,
            },
          });
        }
      }
    }

    return {
      discovererId:
        this.id,

      sources,

      errors,
    };
  }
}
