import fs from "node:fs";
import path from "node:path";

import type {
  CanonicalReviewDecision,
  CanonicalReviewService,
} from "./CanonicalReviewService.js";

import {
  classifyCanonicalReview,
} from "./CanonicalReviewPolicy.js";

import type {
  KnowledgePackageService,
} from "../package/index.js";

export type CanonicalReviewBatchStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "remediation_required";

export interface CanonicalReviewBatch {
  id:
    string;

  packageIds:
    string[];

  status:
    CanonicalReviewBatchStatus;

  reviewerId:
    string | null;

  decision:
    CanonicalReviewDecision | null;

  reason:
    string | null;

  createdAt:
    number;

  reviewedAt:
    number | null;
}

function resolveRepositoryRoot(): string {
  let current =
    process.cwd();

  for (
    let depth = 0;
    depth < 8;
    depth += 1
  ) {
    if (
      fs.existsSync(
        path.join(
          current,
          "package.json",
        ),
      ) &&
      fs.existsSync(
        path.join(
          current,
          "apps",
          "lumina-runtime",
          "package.json",
        ),
      )
    ) {
      return current;
    }

    const parent =
      path.dirname(
        current,
      );

    if (
      parent === current
    ) {
      break;
    }

    current =
      parent;
  }

  throw new Error(
    "korelumina_repository_root_not_found",
  );
}

const batchRoot =
  path.join(
    resolveRepositoryRoot(),
    "runtime",
    "knowledge",
    "review-batches",
  );

function batchPath(
  id:
    string,
): string {
  return path.join(
    batchRoot,
    `${id}.json`,
  );
}

function allocateBatchId(
  now:
    number,
): string {
  const year =
    new Date(
      now,
    ).getUTCFullYear();

  fs.mkdirSync(
    batchRoot,
    {
      recursive:
        true,
    },
  );

  const prefix =
    `KRB-${year}-`;

  const existing =
    fs.readdirSync(
      batchRoot,
    )
      .filter(
        (name) =>
          name.startsWith(
            prefix,
          ) &&
          name.endsWith(
            ".json",
          ),
      );

  let max =
    0;

  for (
    const name
    of existing
  ) {
    const match =
      name.match(
        /^KRB-\d{4}-(\d{6})\.json$/,
      );

    if (
      !match
    ) {
      continue;
    }

    max =
      Math.max(
        max,
        Number.parseInt(
          match[1],
          10,
        ),
      );
  }

  return `${prefix}${String(
    max + 1,
  ).padStart(
    6,
    "0",
  )}`;
}

function saveBatch(
  batch:
    CanonicalReviewBatch,
): void {
  fs.mkdirSync(
    batchRoot,
    {
      recursive:
        true,
    },
  );

  fs.writeFileSync(
    batchPath(
      batch.id,
    ),
    JSON.stringify(
      batch,
      null,
      2,
    ),
    "utf8",
  );
}

export function loadCanonicalReviewBatch(
  id:
    string,
): CanonicalReviewBatch | null {
  const file =
    batchPath(
      id,
    );

  if (
    !fs.existsSync(
      file,
    )
  ) {
    return null;
  }

  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8",
    ),
  ) as CanonicalReviewBatch;
}

export function listCanonicalReviewBatches():
  CanonicalReviewBatch[] {
  if (
    !fs.existsSync(
      batchRoot,
    )
  ) {
    return [];
  }

  return fs
    .readdirSync(
      batchRoot,
    )
    .filter(
      (name) =>
        name.endsWith(
          ".json",
        ),
    )
    .map(
      (name) =>
        loadCanonicalReviewBatch(
          name.slice(
            0,
            -5,
          ),
        ),
    )
    .filter(
      (
        batch,
      ): batch is CanonicalReviewBatch =>
        batch !== null,
    )
    .sort(
      (
        left,
        right,
      ) =>
        right.createdAt -
        left.createdAt,
    );
}

export class CanonicalReviewBatchService {
  constructor(
    private readonly packageService:
      KnowledgePackageService,

    private readonly reviewService:
      CanonicalReviewService,
  ) {}

  create(
    packageIds:
      readonly string[],

    now =
      Date.now(),
  ): CanonicalReviewBatch {
    const uniquePackageIds =
      [
        ...new Set(
          packageIds
            .map(
              (id) =>
                id.trim(),
            )
            .filter(
              Boolean,
            ),
        ),
      ];

    if (
      uniquePackageIds.length ===
      0
    ) {
      throw new Error(
        "canonical_review_batch_packages_required",
      );
    }

    const eligiblePackages =
      uniquePackageIds.map(
        (packageId) => {
          const knowledgePackage =
            this.packageService.get(
              packageId,
            );

          if (
            !knowledgePackage
          ) {
            throw new Error(
              `knowledge_package_not_found:${packageId}`,
            );
          }

          const classification =
            classifyCanonicalReview(
              knowledgePackage,
            );

          if (
            classification.mode !==
            "batch_candidate"
          ) {
            throw new Error(
              `knowledge_package_not_batch_eligible:${packageId}:${classification.mode}`,
            );
          }

          return knowledgePackage;
        },
      );

    const authority =
      eligiblePackages[0]
        ?.authority ??
      null;

    const scope =
      eligiblePackages[0]
        ?.scope ??
      null;

    const incompatible =
      eligiblePackages.find(
        (knowledgePackage) =>
          knowledgePackage.authority !==
            authority ||
          knowledgePackage.scope !==
            scope,
      );

    if (
      incompatible
    ) {
      throw new Error(
        `canonical_review_batch_governance_mismatch:${incompatible.id}`,
      );
    }

    const batch:
      CanonicalReviewBatch = {
      id:
        allocateBatchId(
          now,
        ),

      packageIds:
        uniquePackageIds,

      status:
        "pending",

      reviewerId:
        null,

      decision:
        null,

      reason:
        null,

      createdAt:
        now,

      reviewedAt:
        null,
    };

    saveBatch(
      batch,
    );

    return batch;
  }

  review(
    batchId:
      string,

    input: {
      decision:
        CanonicalReviewDecision;

      reviewerId:
        string;

      reason?:
        string;

      reviewedAt?:
        number;
    },
  ): CanonicalReviewBatch {
    const batch =
      loadCanonicalReviewBatch(
        batchId,
      );

    if (
      !batch
    ) {
      throw new Error(
        "canonical_review_batch_not_found",
      );
    }

    if (
      batch.status !==
      "pending"
    ) {
      throw new Error(
        "canonical_review_batch_already_decided",
      );
    }

    const reviewedAt =
      input.reviewedAt ??
      Date.now();

    for (
      const packageId
      of batch.packageIds
    ) {
      const knowledgePackage =
        this.packageService.get(
          packageId,
        );

      if (
        !knowledgePackage
      ) {
        throw new Error(
          `knowledge_package_not_found:${packageId}`,
        );
      }

      const classification =
        classifyCanonicalReview(
          knowledgePackage,
        );

      if (
        classification.mode !==
        "batch_candidate"
      ) {
        throw new Error(
          `knowledge_package_no_longer_batch_eligible:${packageId}:${classification.mode}`,
        );
      }
    }

    for (
      const packageId
      of batch.packageIds
    ) {
      this.reviewService.review({
        packageId,

        decision:
          input.decision,

        reviewerId:
          input.reviewerId,

        reviewedAt,

        reason:
          input.reason ??
          `canonical-review-batch:${batch.id}`,

        evidenceConsidered:
          this.packageService
            .get(
              packageId,
            )
            ?.sourceEvidenceRefs ??
          [],
      });
    }

    const updated:
      CanonicalReviewBatch = {
      ...batch,

      status:
        input.decision,

      reviewerId:
        input.reviewerId,

      decision:
        input.decision,

      reason:
        input.reason ??
        null,

      reviewedAt,
    };

    saveBatch(
      updated,
    );

    return updated;
  }
}
