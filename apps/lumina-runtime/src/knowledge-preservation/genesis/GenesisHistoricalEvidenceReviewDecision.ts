import {
  createHash,
} from "node:crypto";

import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import path from "node:path";

import {
  resolveKnowledgeStoragePath,
} from "../storage/index.js";

import type {
  GenesisSourceManifestEntry,
} from "./GenesisSourceManifest.js";

import {
  classifyGenesisHistoricalAdmission,
} from "./GenesisHistoricalAdmissionGovernancePolicy.js";


export const GENESIS_HISTORICAL_EVIDENCE_REVIEW_DECISION_VERSION =
  "1.0";


export type GenesisHistoricalEvidenceReviewDisposition =
  | "APPROVE_MANUFACTURING"
  | "REJECT_MANUFACTURING";


export interface GenesisHistoricalEvidenceReviewAuthority {
  authorityClass:
    string;

  authorityOwner:
    string;

  authorityScope:
    string;

  authorityVersion:
    string;

  approvalState:
    "approved";
}


export interface GenesisHistoricalEvidenceReviewDecision {
  decisionId:
    string;

  decisionVersion:
    typeof GENESIS_HISTORICAL_EVIDENCE_REVIEW_DECISION_VERSION;

  historicalSourceId:
    string;

  evidenceId:
    string;

  sourceChecksum:
    string;

  disposition:
    GenesisHistoricalEvidenceReviewDisposition;

  authority:
    GenesisHistoricalEvidenceReviewAuthority |
    null;

  reviewerId:
    string;

  decidedAt:
    number;

  rationale:
    string;
}


export interface CreateGenesisHistoricalEvidenceReviewDecisionInput {
  historicalSourceId:
    string;

  evidenceId:
    string;

  sourceChecksum:
    string;

  disposition:
    GenesisHistoricalEvidenceReviewDisposition;

  authority?:
    GenesisHistoricalEvidenceReviewAuthority |
    null;

  reviewerId:
    string;

  decidedAt:
    number;

  rationale:
    string;
}


export interface GenesisHistoricalEvidenceReviewDecisionResolver {
  resolve(
    historicalSourceId:
      string,

    evidenceId:
      string,
  ):
    GenesisHistoricalEvidenceReviewDecision |
    null;
}


export interface GenesisHistoricalEvidenceReviewDecisionStore
  extends GenesisHistoricalEvidenceReviewDecisionResolver
{
  save(
    decision:
      GenesisHistoricalEvidenceReviewDecision,
  ): void;
}


function requireNonBlank(
  value:
    string,

  field:
    string,
): void {
  if (
    !value.trim()
  ) {
    throw new Error(
      `genesis_historical_evidence_review_invalid:${field}`,
    );
  }
}


function canonicalDecisionIdentity(
  input:
    Pick<
      CreateGenesisHistoricalEvidenceReviewDecisionInput,
      | "historicalSourceId"
      | "evidenceId"
      | "sourceChecksum"
      | "disposition"
      | "authority"
      | "reviewerId"
      | "decidedAt"
      | "rationale"
    >,
): string {
  const digest =
    createHash(
      "sha256",
    )
      .update(
        JSON.stringify({
          historicalSourceId:
            input.historicalSourceId,

          evidenceId:
            input.evidenceId,

          sourceChecksum:
            input.sourceChecksum,

          disposition:
            input.disposition,

          authority:
            input.authority ??
            null,

          reviewerId:
            input.reviewerId,

          decidedAt:
            input.decidedAt,

          rationale:
            input.rationale,
        }),
        "utf8",
      )
      .digest(
        "hex",
      );

  return `genesis-historical-evidence-review:${digest}`;
}


export function createGenesisHistoricalEvidenceReviewDecision(
  input:
    CreateGenesisHistoricalEvidenceReviewDecisionInput,
): GenesisHistoricalEvidenceReviewDecision {
  requireNonBlank(
    input.historicalSourceId,
    "historicalSourceId",
  );

  requireNonBlank(
    input.evidenceId,
    "evidenceId",
  );

  requireNonBlank(
    input.sourceChecksum,
    "sourceChecksum",
  );

  requireNonBlank(
    input.reviewerId,
    "reviewerId",
  );

  requireNonBlank(
    input.rationale,
    "rationale",
  );

  if (
    !Number.isFinite(
      input.decidedAt,
    ) ||
    input.decidedAt <
      0
  ) {
    throw new Error(
      "genesis_historical_evidence_review_invalid:decidedAt",
    );
  }

  const authority =
    input.authority ??
    null;

  if (
    input.disposition ===
    "APPROVE_MANUFACTURING"
  ) {
    if (!authority) {
      throw new Error(
        "genesis_historical_evidence_review_approval_requires_authority",
      );
    }

    requireNonBlank(
      authority.authorityClass,
      "authority.authorityClass",
    );

    requireNonBlank(
      authority.authorityOwner,
      "authority.authorityOwner",
    );

    requireNonBlank(
      authority.authorityScope,
      "authority.authorityScope",
    );

    requireNonBlank(
      authority.authorityVersion,
      "authority.authorityVersion",
    );

    if (
      authority.approvalState !==
      "approved"
    ) {
      throw new Error(
        "genesis_historical_evidence_review_approval_requires_approved_state",
      );
    }
  }

  if (
    input.disposition ===
      "REJECT_MANUFACTURING" &&
    authority !==
      null
  ) {
    throw new Error(
      "genesis_historical_evidence_review_rejection_cannot_supply_authority",
    );
  }

  return {
    decisionId:
      canonicalDecisionIdentity({
        ...input,
        authority,
      }),

    decisionVersion:
      GENESIS_HISTORICAL_EVIDENCE_REVIEW_DECISION_VERSION,

    historicalSourceId:
      input.historicalSourceId,

    evidenceId:
      input.evidenceId,

    sourceChecksum:
      input.sourceChecksum,

    disposition:
      input.disposition,

    authority,

    reviewerId:
      input.reviewerId,

    decidedAt:
      input.decidedAt,

    rationale:
      input.rationale,
  };
}


export function assertValidGenesisHistoricalEvidenceReviewDecision(
  decision:
    GenesisHistoricalEvidenceReviewDecision,
): void {
  const expected =
    createGenesisHistoricalEvidenceReviewDecision({
      historicalSourceId:
        decision.historicalSourceId,

      evidenceId:
        decision.evidenceId,

      sourceChecksum:
        decision.sourceChecksum,

      disposition:
        decision.disposition,

      authority:
        decision.authority,

      reviewerId:
        decision.reviewerId,

      decidedAt:
        decision.decidedAt,

      rationale:
        decision.rationale,
    });

  if (
    decision.decisionVersion !==
    GENESIS_HISTORICAL_EVIDENCE_REVIEW_DECISION_VERSION
  ) {
    throw new Error(
      "genesis_historical_evidence_review_version_mismatch",
    );
  }

  if (
    decision.decisionId !==
    expected.decisionId
  ) {
    throw new Error(
      "genesis_historical_evidence_review_identity_mismatch",
    );
  }
}


export function manifestEntryWithHistoricalEvidenceReview(
  source:
    GenesisSourceManifestEntry,

  evidenceId:
    string,

  review:
    GenesisHistoricalEvidenceReviewDecision,
): GenesisSourceManifestEntry {
  assertValidGenesisHistoricalEvidenceReviewDecision(
    review,
  );

  if (
    review.historicalSourceId !==
    source.historicalSourceId
  ) {
    throw new Error(
      "genesis_historical_evidence_review_source_identity_mismatch",
    );
  }

  if (
    review.evidenceId !==
    evidenceId
  ) {
    throw new Error(
      "genesis_historical_evidence_review_evidence_identity_mismatch",
    );
  }

  if (
    review.sourceChecksum !==
    source.sourceChecksum
  ) {
    throw new Error(
      "genesis_historical_evidence_review_checksum_mismatch",
    );
  }

  const current =
    classifyGenesisHistoricalAdmission(
      source,
    );

  if (
    current.classification !==
    "requires-governance-review"
  ) {
    throw new Error(
      "genesis_historical_evidence_review_requires_reviewable_source",
    );
  }

  if (
    review.disposition !==
    "APPROVE_MANUFACTURING"
  ) {
    throw new Error(
      "genesis_historical_evidence_review_not_approved",
    );
  }

  if (
    !review.authority
  ) {
    throw new Error(
      "genesis_historical_evidence_review_authority_missing",
    );
  }

  const reviewed:
    GenesisSourceManifestEntry = {
      ...source,

      authorityClass:
        review.authority
          .authorityClass,

      authorityOwner:
        review.authority
          .authorityOwner,

      authorityScope:
        review.authority
          .authorityScope,

      authorityVersion:
        review.authority
          .authorityVersion,

      approvalState:
        review.authority
          .approvalState,
    };

  const resulting =
    classifyGenesisHistoricalAdmission(
      reviewed,
    );

  if (
    resulting.classification !==
      "knowledge-seeding-eligible" ||
    !resulting.invokeKnowledgeManufacturing
  ) {
    throw new Error(
      "genesis_historical_evidence_review_does_not_satisfy_manufacturing_policy",
    );
  }

  return reviewed;
}


function storageKey(
  historicalSourceId:
    string,

  evidenceId:
    string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      JSON.stringify({
        historicalSourceId,
        evidenceId,
      }),
      "utf8",
    )
    .digest(
      "hex",
    );
}


function stableJson(
  value:
    unknown,
): string {
  return JSON.stringify(
    value,
    null,
    2,
  );
}


export class FileGenesisHistoricalEvidenceReviewDecisionStore
  implements GenesisHistoricalEvidenceReviewDecisionStore
{
  readonly storageRoot:
    string;


  constructor(
    options: {
      storageRoot?:
        string;
    } = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        resolveKnowledgeStoragePath(
          "historical-evidence-review-decisions",
        ),
      );
  }


  private fileFor(
    historicalSourceId:
      string,

    evidenceId:
      string,
  ): string {
    return path.join(
      this.storageRoot,
      `${storageKey(
        historicalSourceId,
        evidenceId,
      )}.json`,
    );
  }


  save(
    decision:
      GenesisHistoricalEvidenceReviewDecision,
  ): void {
    assertValidGenesisHistoricalEvidenceReviewDecision(
      decision,
    );

    const file =
      this.fileFor(
        decision.historicalSourceId,
        decision.evidenceId,
      );

    const existing =
      this.resolve(
        decision.historicalSourceId,
        decision.evidenceId,
      );

    if (existing) {
      if (
        stableJson(
          existing,
        ) !==
        stableJson(
          decision,
        )
      ) {
        throw new Error(
          "genesis_historical_evidence_review_decision_conflict",
        );
      }

      return;
    }

    mkdirSync(
      this.storageRoot,
      {
        recursive:
          true,
      },
    );

    const temporary =
      `${file}.tmp-${process.pid}`;

    try {
      writeFileSync(
        temporary,
        `${stableJson(
          decision,
        )}\n`,
        "utf8",
      );

      renameSync(
        temporary,
        file,
      );
    } finally {
      rmSync(
        temporary,
        {
          force:
            true,
        },
      );
    }
  }


  resolve(
    historicalSourceId:
      string,

    evidenceId:
      string,
  ):
    GenesisHistoricalEvidenceReviewDecision |
    null {
    const file =
      this.fileFor(
        historicalSourceId,
        evidenceId,
      );

    let raw:
      string;

    try {
      raw =
        readFileSync(
          file,
          "utf8",
        );
    } catch (
      error
    ) {
      if (
        (
          error as {
            code?:
              string;
          }
        ).code ===
        "ENOENT"
      ) {
        return null;
      }

      throw error;
    }

    const decision =
      JSON.parse(
        raw,
      ) as GenesisHistoricalEvidenceReviewDecision;

    assertValidGenesisHistoricalEvidenceReviewDecision(
      decision,
    );

    if (
      decision.historicalSourceId !==
        historicalSourceId ||
      decision.evidenceId !==
        evidenceId
    ) {
      throw new Error(
        "genesis_historical_evidence_review_storage_identity_mismatch",
      );
    }

    return decision;
  }
}
