import assert from "node:assert/strict";
import test from "node:test";

import { isHumanOnlyExecutivePath } from "../../../routes/runtimeBoundary.js";
import { ExecutiveAcknowledgementService, acknowledgementId } from "../index.js";

/* MS-2026-0004 (E2.T2): the owner acknowledges a specific Critical condition. */

test("the owner acknowledges a condition once, with who and when", () => {
  let now = 1_000;
  const service = new ExecutiveAcknowledgementService(() => now);
  const first = service.acknowledge({ conditionKey: "learning-cycle-failed:learning-cycle:ab12", title: "The latest learning cycle failed" }, "human:founder");
  assert.equal(first.id, acknowledgementId("learning-cycle-failed:learning-cycle:ab12"));
  assert.equal(first.acknowledgedBy, "human:founder");
  assert.equal(first.acknowledgedAt, 1_000);

  now = 2_000;
  const again = service.acknowledge({ conditionKey: "learning-cycle-failed:learning-cycle:ab12", title: "again", note: "seen" }, "human:founder");
  assert.deepEqual(again, first, "the first acknowledgement stands");

  service.acknowledge({ conditionKey: "learning-cycle-failed:learning-cycle:cd34", title: "Another failure" }, "human:founder");
  assert.deepEqual(service.list().map((entry) => entry.conditionKey), ["learning-cycle-failed:learning-cycle:cd34", "learning-cycle-failed:learning-cycle:ab12"]);
});

test("only a human acknowledges, and the condition must be named", () => {
  const service = new ExecutiveAcknowledgementService();
  assert.throws(() => service.acknowledge({ conditionKey: "activation:SUSPENDED:a1", title: "x" }, "chief-agent"), /acknowledgement_human_actor_required/);
  assert.throws(() => service.acknowledge({ conditionKey: "../../etc", title: "x" }, "human:founder"), /acknowledgement_condition_key_invalid/);
  assert.throws(() => service.acknowledge({ conditionKey: "activation:SUSPENDED:a1" }, "human:founder"), /acknowledgement_title_required/);
  assert.equal(isHumanOnlyExecutivePath("/acknowledgements"), true);
});
