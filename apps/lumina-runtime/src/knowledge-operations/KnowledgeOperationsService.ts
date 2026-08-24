import {
  repositoryAcquisitionService,
} from "../knowledge-acquisition/index.js";

import type {
  KnowledgeAcquisitionMetrics,
} from "../knowledge-acquisition/index.js";

import type {
  CanonicalKnowledgeItem,
} from "../canonical-knowledge/index.js";

import type {
  KnowledgeManufacturingRunService,
} from "../knowledge-preservation/manufacturing/index.js";

import type {
  KnowledgePackage,
  KnowledgePackageService,
} from "../knowledge-preservation/package/index.js";

import type {
  KnowledgeOperationsSnapshot,
  KnowledgeOperationsStatus,
} from "@korelumina/platform-sdk";

import {
  evaluateKnowledgeOperationsEvidenceAdmission,
} from "./KnowledgeOperationsEvidenceAdmissionPolicy.js";

export interface KnowledgeProviderSummary {
  id: string;
  name: string;
  sourceType: string;
  status: "available" | "planned";
}

export interface KnowledgeOperationsCanonicalReadStore {
  list():
    CanonicalKnowledgeItem[];
}


export interface KnowledgeOperationsRuntimeTruth {
  packageService:
    KnowledgePackageService;

  manufacturingRunService:
    KnowledgeManufacturingRunService;

  canonicalStore:
    KnowledgeOperationsCanonicalReadStore;
}

function normalizeStatus(
  status:
    string | undefined,
): KnowledgeOperationsStatus {
  if (
    status === "running" ||
    status === "completed" ||
    status === "failed"
  ) {
    return status;
  }

  return "idle";
}

function canonicalSourceItemId(
  item:
    CanonicalKnowledgeItem,
): string | null {
  if (
    !item.id.startsWith(
      "canonical:",
    )
  ) {
    return null;
  }

  const sourceId =
    item.id.slice(
      "canonical:".length,
    );

  return sourceId.trim()
    ? sourceId
    : null;
}

function packageKnowledgeItemIds(
  packages:
    readonly KnowledgePackage[],
): Set<string> {
  const ids =
    new Set<string>();

  for (
    const knowledgePackage
    of packages
  ) {
    for (
      const itemId
      of knowledgePackage.knowledgeItemIds
    ) {
      if (
        itemId.trim()
      ) {
        ids.add(
          itemId,
        );
      }
    }
  }

  return ids;
}

function packageEvidenceIds(
  packages:
    readonly KnowledgePackage[],
): Set<string> {
  const ids =
    new Set<string>();

  for (
    const knowledgePackage
    of packages
  ) {
    for (
      const evidenceId
      of knowledgePackage.sourceEvidenceRefs
    ) {
      if (
        evidenceId.trim()
      ) {
        ids.add(
          evidenceId,
        );
      }
    }
  }

  return ids;
}

const DOCUMENTATION_EVIDENCE_TYPES =
  new Set([
    "ADR",
    "RFC",
    "document",
    "source-file",
    "specification",
    "roadmap",
    "milestone",
  ]);

const GIT_EVIDENCE_TYPES =
  new Set([
    "commit",
    "tag",
    "branch",
  ]);

const RUNTIME_EVIDENCE_TYPES =
  new Set([
    "runtime-event",
    "engineering-execution",
    "build-output",
    "incident-log",
  ]);

interface MeasuredSourceCoverage {
  byType:
    Record<string, number>;

  documentation:
    number;

  git:
    number;

  conversations:
    number;

  runtime:
    number;

  issues:
    number;

  pullRequests:
    number;
}

function measuredSourceCoverage(
  packages:
    readonly KnowledgePackage[],

  evidenceTotal:
    number,
): MeasuredSourceCoverage {
  /*
   * One evidence record may generate multiple Knowledge IR items.
   * Coverage must therefore count unique Evidence IDs, not IR rows.
   */
  const evidenceByType =
    new Map<
      string,
      Set<string>
    >();

  for (
    const knowledgePackage
    of packages
  ) {
    for (
      const item
      of knowledgePackage.items
    ) {
      const sourceType =
        item.compiler
          .evidenceSourceType;

      let evidenceIds =
        evidenceByType.get(
          sourceType,
        );

      if (
        !evidenceIds
      ) {
        evidenceIds =
          new Set<string>();

        evidenceByType.set(
          sourceType,
          evidenceIds,
        );
      }

      for (
        const evidenceId
        of item.evidenceRefs
      ) {
        if (
          evidenceId.trim()
        ) {
          evidenceIds.add(
            evidenceId,
          );
        }
      }
    }
  }

  const byType:
    Record<string, number> =
      {};

  for (
    const [
      sourceType,
      evidenceIds,
    ]
    of evidenceByType
  ) {
    byType[sourceType] =
      evidenceIds.size;
  }

  const unionCount =
    (
      sourceTypes:
        ReadonlySet<string>,
    ) => {
      const ids =
        new Set<string>();

      for (
        const sourceType
        of sourceTypes
      ) {
        for (
          const evidenceId
          of evidenceByType.get(
            sourceType,
          ) ?? []
        ) {
          ids.add(
            evidenceId,
          );
        }
      }

      return ids.size;
    };

  const ratio =
    (
      count:
        number,
    ) =>
      evidenceTotal >
        0
        ? count /
          evidenceTotal
        : 0;

  return {
    byType,

    documentation:
      ratio(
        unionCount(
          DOCUMENTATION_EVIDENCE_TYPES,
        ),
      ),

    git:
      ratio(
        unionCount(
          GIT_EVIDENCE_TYPES,
        ),
      ),

    conversations:
      ratio(
        unionCount(
          new Set([
            "conversation",
          ]),
        ),
      ),

    runtime:
      ratio(
        unionCount(
          RUNTIME_EVIDENCE_TYPES,
        ),
      ),

    issues:
      ratio(
        unionCount(
          new Set([
            "issue",
          ]),
        ),
      ),

    pullRequests:
      ratio(
        unionCount(
          new Set([
            "pull-request",
          ]),
        ),
      ),
  };
}

function packageBackedCanonicalSourceIds(
  canonicalItems:
    readonly CanonicalKnowledgeItem[],

  packageItemIds:
    ReadonlySet<string>,
): Set<string> {
  const ids =
    new Set<string>();

  for (
    const canonical
    of canonicalItems
  ) {
    if (
      canonical.status !==
      "canonical"
    ) {
      continue;
    }

    const sourceItemId =
      canonicalSourceItemId(
        canonical,
      );

    if (
      sourceItemId &&
      packageItemIds.has(
        sourceItemId,
      )
    ) {
      ids.add(
        sourceItemId,
      );
    }
  }

  return ids;
}

function measuredKnowledgeTruth(
  runtime:
    KnowledgeOperationsRuntimeTruth,
) {
  const allPackages =
    runtime.packageService
      .list();

  const manufacturingRuns =
    runtime.manufacturingRunService
      .list();

  const runsByEvidenceId =
    new Map(
      manufacturingRuns.map(
        (run) => [
          run.evidenceId,
          run,
        ],
      ),
    );

  const packagesByEvidenceId =
    new Map<
      string,
      KnowledgePackage
    >();

  for (
    const knowledgePackage
    of allPackages
  ) {
    for (
      const evidenceId
      of knowledgePackage
        .sourceEvidenceRefs
    ) {
      packagesByEvidenceId.set(
        evidenceId,
        knowledgePackage,
      );
    }
  }

  const repositoryRoot =
    process.cwd()
      .endsWith(
        "/apps/lumina-runtime",
      )
      ? process.cwd()
          .slice(
            0,
            -"/apps/lumina-runtime".length,
          )
      : process.cwd();

  const allEvidenceIds =
    new Set([
      ...runsByEvidenceId.keys(),
      ...packagesByEvidenceId.keys(),
    ]);

  const admittedEvidenceIds =
    new Set<string>();

  for (
    const evidenceId
    of allEvidenceIds
  ) {
    const decision =
      evaluateKnowledgeOperationsEvidenceAdmission({
        evidenceId,

        run:
          runsByEvidenceId.get(
            evidenceId,
          ),

        knowledgePackage:
          packagesByEvidenceId.get(
            evidenceId,
          ),

        repositoryRoot,
      });

    if (
      decision.admitted
    ) {
      admittedEvidenceIds.add(
        evidenceId,
      );
    }
  }

  const packages =
    allPackages.filter(
      (knowledgePackage) =>
        knowledgePackage
          .sourceEvidenceRefs
          .some(
            (evidenceId) =>
              admittedEvidenceIds.has(
                evidenceId,
              ),
          ),
    );


  const allCanonicalItems =
    runtime.canonicalStore
      .list()
      .filter(
        (item) =>
          item.status ===
          "canonical",
      );

  /*
   * Canonical Knowledge is operationally visible only when
   * its evidence lineage intersects the production-admitted
   * Evidence corpus.
   *
   * Persisted test/certification canonical records remain in
   * the Canonical store for historical traceability, but they
   * MUST NOT contribute to Knowledge Operations truth.
   */
  const canonicalItems =
    allCanonicalItems.filter(
      (item) =>
        item.evidenceRefs.some(
          (evidenceId) =>
            admittedEvidenceIds.has(
              evidenceId,
            ),
        ),
    );

  const packagedItemIds =
    packageKnowledgeItemIds(
      packages,
    );

  const promotedItemIds =
    packageBackedCanonicalSourceIds(
      canonicalItems,
      packagedItemIds,
    );

  const candidateItemIds =
    new Set(
      [
        ...packagedItemIds,
      ].filter(
        (itemId) =>
          !promotedItemIds.has(
            itemId,
          ),
      ),
    );

  /*
   * Manufacturing runs are created at the Evidence Intake
   * boundary before compiler execution. This makes their
   * evidence IDs the authoritative count of admitted evidence,
   * including evidence that later fails manufacturing.
   *
   * Package evidence is included for persisted historical
   * compatibility in case a package predates its run record.
   */
  const evidenceIds =
    admittedEvidenceIds;

  const promotionRate =
    packagedItemIds.size >
      0
      ? promotedItemIds.size /
        packagedItemIds.size
      : 0;

  const sourceCoverage =
    measuredSourceCoverage(
      packages,
      evidenceIds.size,
    );

  return {
    evidenceTotal:
      evidenceIds.size,

    candidateItems:
      candidateItemIds.size,

    canonicalItems:
      canonicalItems.length,

    packagedItems:
      packagedItemIds.size,

    promotedPackageItems:
      promotedItemIds.size,

    promotionRate,

    sourceCoverage,
  };
}


export class KnowledgeOperationsService {
  constructor(
    private readonly runtimeTruth?:
      KnowledgeOperationsRuntimeTruth,
  ) {}

  async acquireRepository(
    repositoryId:
      string,

    repositoryRoot:
      string,
  ) {
    return repositoryAcquisitionService
      .acquire(
        repositoryId,
        repositoryRoot,
      );
  }

  getRepositoryStatus(
    repositoryId:
      string,
  ) {
    return repositoryAcquisitionService
      .getStatus(
        repositoryId,
      );
  }

  getRepositoryMetrics(
    repositoryId:
      string,
  ): readonly KnowledgeAcquisitionMetrics[] {
    return repositoryAcquisitionService
      .getMetrics(
        repositoryId,
      );
  }

  getSnapshot():
    KnowledgeOperationsSnapshot {
    const statuses =
      repositoryAcquisitionService
        .listStatuses();

    const latest =
      statuses.at(-1);

    const status =
      normalizeStatus(
        latest?.status,
      );

    const acquisitionEvidence =
      latest?.acquiredEvidence ??
      0;

    const preservedEvidence =
      latest?.preservedEvidence ??
      0;

    const acquisitionProgress =
      acquisitionEvidence >
        0
        ? (
            preservedEvidence /
            acquisitionEvidence
          ) *
          100
        : 0;

    const truth =
      this.runtimeTruth
        ? measuredKnowledgeTruth(
            this.runtimeTruth,
          )
        : {
            evidenceTotal:
              0,

            candidateItems:
              0,

            canonicalItems:
              0,

            packagedItems:
              0,

            promotedPackageItems:
              0,

            promotionRate:
              0,

            sourceCoverage: {
              byType:
                {},

              documentation:
                0,

              git:
                0,

              conversations:
                0,

              runtime:
                0,

              issues:
                0,

              pullRequests:
                0,
            },
          };

    return {
      generatedAt:
        Date.now(),

      summary: {
        totalKnowledgeItems:
          truth.candidateItems +
          truth.canonicalItems,

        totalEvidence:
          truth.evidenceTotal,

        /*
         * No governed numeric Knowledge Health algorithm exists yet.
         *
         * The V2 contract defines the required health domains but not
         * their weighting, thresholds, or aggregation semantics.
         *
         * Null means explicitly not measured.
         */
        healthScore:
          null,

        promotionRate:
          truth.promotionRate,
      },

      /*
       * Acquisition remains repository-acquisition truth.
       * Do not substitute manufacturing counts here.
       */
      acquisition: {
        status,

        repository:
          latest?.repositoryRoot,

        stage:
          status,

        filesScanned:
          acquisitionEvidence,

        evidenceExtracted:
          acquisitionEvidence,

        progress:
          acquisitionProgress,
      },

      recovery: {
        status,

        repositoryRoot:
          latest?.repositoryRoot,

        processedEvidence:
          preservedEvidence,

        totalEvidence:
          acquisitionEvidence,

        progress:
          acquisitionProgress,
      },

      evidence: {
        total:
          truth.evidenceTotal,

        byType:
          truth.sourceCoverage
            .byType,
      },

      knowledge: {
        candidateItems:
          truth.candidateItems,

        canonicalItems:
          truth.canonicalItems,

        promotionRate:
          truth.promotionRate,
      },

      /*
       * Coverage is the proportion of all admitted evidence
       * represented by each governed evidence-source family.
       *
       * Failed/unclassified Evidence remains in the denominator,
       * so missing classification cannot inflate coverage.
       */
      coverage: {
        documentation:
          truth.sourceCoverage
            .documentation,

        git:
          truth.sourceCoverage
            .git,

        conversations:
          truth.sourceCoverage
            .conversations,

        runtime:
          truth.sourceCoverage
            .runtime,

        issues:
          truth.sourceCoverage
            .issues,

        pullRequests:
          truth.sourceCoverage
            .pullRequests,
      },
    };
  }

  listProviders():
    KnowledgeProviderSummary[] {
    return [
      {
        id:
          "repository",

        name:
          "Repository",

        sourceType:
          "repository",

        status:
          "available",
      },

      {
        id:
          "conversation",

        name:
          "Conversation",

        sourceType:
          "conversation",

        status:
          "planned",
      },

      {
        id:
          "git",

        name:
          "Git",

        sourceType:
          "git",

        status:
          "planned",
      },

      {
        id:
          "runtime",

        name:
          "Runtime",

        sourceType:
          "runtime",

        status:
          "planned",
      },
    ];
  }
}

/*
 * Legacy router compatibility only.
 *
 * Production /api/knowledge/operations is wired with the
 * authoritative Runtime instance from src/index.ts.
 */
export const knowledgeOperationsService =
  new KnowledgeOperationsService();
