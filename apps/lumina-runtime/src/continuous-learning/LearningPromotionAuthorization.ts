import fs from "node:fs";
import path from "node:path";

import type { KnowledgePackage } from "../knowledge-preservation/package/index.js";
import { resolveContinuousLearningRoot } from "./ContinuousLearningLedger.js";
import {
  LEARNING_RECORD_AUTHORITY,
  LEARNING_RECORD_SCOPE,
} from "./LearningRecordWriter.js";

/*
 * ADR-0042 Decision 4 (CL-1d): one standing authorization, recorded by the
 * owner, lets Learning Records approved by the learning review policy be
 * promoted to canonical knowledge without a per-package executive decision.
 *
 * It is deliberately narrow: only packages of authority "learning" with the
 * Learning Record scope, bound to the named policy version. Every other
 * class still needs its per-package executive promotion decision.
 */

export const LEARNING_REVIEW_POLICY_ID = "learning-records";
export const LEARNING_REVIEW_POLICY_VERSION = "1.0";

export interface LearningPromotionAuthorization {
  version: "learning-promotion-authorization:v1";
  status: "active" | "revoked";
  policyId: string;
  policyVersion: string;
  authority: string;
  scope: string;
  authorizedBy: string;
  authorizedAt: number;
  basis: string;
  revokedBy?: string;
  revokedAt?: number;
}

function isHumanActor(actorId: string): boolean {
  return actorId.trim().toLowerCase().startsWith("human:");
}

export class FileLearningPromotionAuthorizationStore {
  constructor(
    private readonly root: () => string = resolveContinuousLearningRoot,
  ) {}

  private file(): string {
    return path.join(this.root(), "promotion-authorization.json");
  }

  read(): LearningPromotionAuthorization | null {
    try {
      return JSON.parse(
        fs.readFileSync(this.file(), "utf8"),
      ) as LearningPromotionAuthorization;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  write(record: LearningPromotionAuthorization): void {
    fs.mkdirSync(this.root(), { recursive: true });
    const target = this.file();
    const temporary = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    fs.renameSync(temporary, target);
  }

  authorize(actorId: string, at: number): LearningPromotionAuthorization {
    if (!isHumanActor(actorId)) {
      throw new Error("learning_promotion_authorization_requires_human_actor");
    }
    const record: LearningPromotionAuthorization = {
      version: "learning-promotion-authorization:v1",
      status: "active",
      policyId: LEARNING_REVIEW_POLICY_ID,
      policyVersion: LEARNING_REVIEW_POLICY_VERSION,
      authority: LEARNING_RECORD_AUTHORITY,
      scope: LEARNING_RECORD_SCOPE,
      authorizedBy: actorId.trim(),
      authorizedAt: at,
      basis:
        "ADR-0042 Decision 4: Learning Records approved by the learning review policy are promoted without a per-package decision.",
    };
    this.write(record);
    return record;
  }

  revoke(actorId: string, at: number): LearningPromotionAuthorization {
    if (!isHumanActor(actorId)) {
      throw new Error("learning_promotion_authorization_requires_human_actor");
    }
    const current = this.read();
    if (!current) {
      throw new Error("learning_promotion_authorization_not_found");
    }
    const record = { ...current, status: "revoked" as const, revokedBy: actorId.trim(), revokedAt: at };
    this.write(record);
    return record;
  }
}

export function validateStandingLearningPromotionAuthorization(
  store: Pick<FileLearningPromotionAuthorizationStore, "read">,
  knowledgePackage: KnowledgePackage,
  policyId: string,
  policyVersion: string,
): string | null {
  const record = store.read();
  if (!record) return "learning_promotion_authorization_missing";
  if (record.status !== "active") return "learning_promotion_authorization_revoked";
  if (!isHumanActor(record.authorizedBy)) {
    return "learning_promotion_authorization_not_human";
  }
  if (record.policyId !== policyId || record.policyVersion !== policyVersion) {
    return "learning_promotion_authorization_policy_mismatch";
  }
  if (
    knowledgePackage.authority !== LEARNING_RECORD_AUTHORITY ||
    knowledgePackage.authority !== record.authority
  ) {
    return "learning_promotion_authorization_authority_mismatch";
  }
  if (knowledgePackage.scope !== record.scope) {
    return "learning_promotion_authorization_scope_mismatch";
  }
  return null;
}
