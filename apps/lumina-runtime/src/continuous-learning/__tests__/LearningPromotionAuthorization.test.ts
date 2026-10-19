import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  FileLearningPromotionAuthorizationStore,
  LEARNING_RECORD_SCOPE,
  validateStandingLearningPromotionAuthorization,
} from "../index.js";

const pkg = (overrides: Record<string, unknown> = {}) =>
  ({ id: "KP-1", authority: "learning", scope: LEARNING_RECORD_SCOPE, ...overrides }) as never;

function store() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lpa-"));
  return new FileLearningPromotionAuthorizationStore(() => root);
}

test("only a human can grant or revoke the standing authorization", () => {
  const s = store();
  assert.throws(() => s.authorize("chief-agent", 1), /requires_human_actor/);
  assert.throws(() => s.authorize("agent:x", 1), /requires_human_actor/);
  assert.equal(s.authorize("human:founder", 1).status, "active");
  assert.throws(() => s.revoke("chief-agent", 2), /requires_human_actor/);
});

test("authorizes only Learning Records under the learning policy", () => {
  const s = store();
  assert.equal(validateStandingLearningPromotionAuthorization(s, pkg(), "learning-records", "1.0"), "learning_promotion_authorization_missing");
  s.authorize("human:founder", 1);
  assert.equal(validateStandingLearningPromotionAuthorization(s, pkg(), "learning-records", "1.0"), null);
  assert.equal(validateStandingLearningPromotionAuthorization(s, pkg({ authority: "architecture" }), "learning-records", "1.0"), "learning_promotion_authorization_authority_mismatch");
  assert.equal(validateStandingLearningPromotionAuthorization(s, pkg({ scope: "something else" }), "learning-records", "1.0"), "learning_promotion_authorization_scope_mismatch");
  assert.equal(validateStandingLearningPromotionAuthorization(s, pkg(), "other-policy", "1.0"), "learning_promotion_authorization_policy_mismatch");
});

test("a revoked authorization stops automatic promotion", () => {
  const s = store();
  s.authorize("human:founder", 1);
  s.revoke("human:founder", 2);
  assert.equal(validateStandingLearningPromotionAuthorization(s, pkg(), "learning-records", "1.0"), "learning_promotion_authorization_revoked");
});
