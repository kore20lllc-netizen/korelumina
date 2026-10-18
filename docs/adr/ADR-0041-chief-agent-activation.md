# ADR-0041 — Chief Agent Activation

## Status

Accepted

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: How the Chief Agent moves from education-only state into operational responsibility, what that responsibility includes at first, how activation is enforced, suspended and revoked, and what must be true before it can be granted.

---

## Context

CA-005 (Learning Constitution), Article IX, defines activation as "the human-authorized transition from education-only state into operational Chief Agent responsibility" and lists eight conditions:

1. completed and accepted Initial Competency;
2. an approved Educational Corpus version;
3. access to governed Canonical Knowledge and Organizational Memory projections;
4. operational access constrained by explicit role and mission boundaries;
5. visible human override and approval gates;
6. Runtime truth integration for operational state;
7. observability, auditability, rollback, and recovery paths;
8. explicit human authorization by the responsible constitutional authority.

It also states that activation does not grant authority to rewrite constitutional curriculum, promote knowledge to canonical status, fabricate Runtime state, bypass governance, or expand autonomy without approval.

CA-005 leaves two items **UNRESOLVED**: no ADR establishes the activation lifecycle, and no human office is named for activation. The Operational Learning Model reconciliation lists an **Activation Authority Registry** as missing.

### State on 2026-10-17

The education gates are complete and valid:

| Gate | State |
|---|---|
| Day-0 Genesis certification | VALID |
| Educational Corpus | CURRENT, 18 items, all Day-0 modules 100% |
| Educational Corpus certification | VALID |
| Initial Competency certification | VALID |
| Human acceptance of Initial Competency | ACCEPTED |
| Production workspace authorization | AUTHORIZED (workspace not created) |

Investigation of the Runtime found three facts that shape this decision:

- **F-13: Chief Agent reasoning already runs without activation.** At startup the Runtime registers Chief Agent reasoning on the executive dispatcher (`index.ts`). Reasoning events call an external text-generation model and create proposed executive decisions. No executive code reads any education or activation state. "Not activated" is therefore a label today, not an enforced boundary.
- **F-14: Executive routes have no access control.** None of the executive routes (events, decisions, approvals, approve/reject, delegations, actions, authorize-execution, execute-operation, execute-mutation) use `requireRuntimeAccess`, and the Runtime listens on all network interfaces. Any device that can reach the machine can approve or execute executive actions.
- **F-15: Reasoning is bound to one AI provider.** The reasoning provider is constructed with a fixed OpenAI client. The Business Charter commits KoreLumina to provider choice and AI independence.

---

## Problem

1. There is no defined, enforced transition into operational responsibility.
2. Chief Agent behaviour that CA-005 reserves for after activation is already reachable before it.
3. CA-005 condition 4 (operational access constrained by role) is not met by the current executive routes.
4. No human role is named as the activation authority, and no record of activation exists.
5. It is undefined what happens to an active Chief Agent when curriculum changes, or how activation is withdrawn.

---

## Alternatives Considered

**1. Treat production workspace authorization as activation.**
Rejected. CA-005 separates competency acceptance, workspace, and activation; the existing authorization record explicitly keeps `chiefAgentActivationAuthorized: false`. Collapsing them removes a human decision.

**2. Activate by configuration flag.**
Rejected. A flag has no provenance, no binding to the certified curriculum, no audit trail, and no reason. It cannot satisfy condition 8.

**3. Activate with broad autonomy and rely on existing approval gates.**
Rejected. The approval gates are not protected (F-14), and CA-005 forbids expanding autonomy without approval. Autonomy must start minimal and grow only by explicit decision.

**4. Suspend the Chief Agent whenever any upstream certification goes stale.**
Rejected as the default. After activation, Continuous Learning adds canonical knowledge, which makes Day-0 stale by design. Automatic suspension on every promotion would make the Chief Agent unusable and punish the learning CA-005 requires. Staleness is surfaced as curriculum drift instead (see Decision 6), with explicit suspension reserved for invalidation, not drift.

**5. A governed activation record, an enforced gate, and propose-only first autonomy.** (Chosen.)

---

## Decision

### 1. Activation authority

The **Activation Authority** is the Founder, Kore20 LLC, acting as repository owner, recorded with authority role `HUMAN_GOVERNANCE` (the role already used for production workspace authorization). This resolves the CA-005 UNRESOLVED office for activation. The Founder may delegate in writing; a delegation is itself a governance record.

### 2. Activation record

Activation is a single human decision recorded as an immutable, versioned record (`chief-agent-activation:v1`) containing:

- `activationId` (content-derived, like other certifications);
- the bound IDs of the Day-0 certification, Educational Corpus certification, Initial Competency certification, human acceptance, and production workspace authorization;
- `activatedBy`, `authorityRole`, `activatedAt`, `reason`;
- `autonomyLevel` (see Decision 4);
- `state`: `ACTIVE`, `SUSPENDED`, or `REVOKED`.

Records are append-only. Suspension, resumption, revocation, and autonomy changes are new records referencing the prior one, each with a human reason.

The activation record must survive machine loss, so it is persisted in a **tracked** governance location (not `runtime-data/`, which is gitignored; see F-9), and committed by the owner.

### 3. Enforced activation gate

A single `ChiefAgentActivationGate` answers one question: may the Chief Agent act operationally now? It returns `ACTIVE` only if the latest activation record is `ACTIVE` and every bound upstream record still exists and is not revoked.

The gate is enforced at the Runtime boundary, fail-closed:

- the executive dispatcher refuses Chief Agent reasoning, decision proposals, delegation, and action execution with `chief_agent_not_activated` unless the gate is `ACTIVE`;
- Education, Knowledge Operations, Genesis, and review routes are unaffected;
- the UI shows the gate state and its reason, never a fallback.

This closes F-13: before activation, the Chief Agent can learn but cannot operate.

### 4. Initial autonomy: propose-only

Activation v1 grants autonomy level **`PROPOSE_ONLY`**. The Chief Agent may:

- reason over governed Canonical Knowledge and Organizational Memory projections;
- read Runtime truth for operational state;
- propose decisions, missions, and actions, each with evidence, assumptions, and confidence;
- request human approval.

The Chief Agent may not, at this level:

- approve anything, including its own proposals;
- execute operations or mutations;
- delegate to agents without a human-approved delegation;
- promote knowledge to canonical status or change curriculum;
- spend customer credits or infrastructure (Customer Decision Policy).

Every higher autonomy level requires its own decision record and a new activation record. Expanding autonomy is never implicit.

### 5. Prerequisite: protected executive routes (closes F-14)

Activation cannot be recorded until:

- every executive route requires Runtime access (`requireRuntimeAccess` or stronger);
- human-only routes (approve, reject, authorize-execution, execute-operation, execute-mutation, delegation accept) reject any request whose actor is the Chief Agent or another agent;
- the Runtime binds to `127.0.0.1` by default, with network exposure only by explicit configuration.

### 6. Curriculum drift after activation

After activation, new canonical knowledge may make the Day-0 or corpus certifications stale. This is **drift**, not invalidation:

- the gate stays `ACTIVE`;
- the UI and the Mission Board show "curriculum drift since activation" with what changed;
- the owner re-certifies on their own schedule (CA-005 recertification intervals remain UNRESOLVED).

The gate moves to `SUSPENDED` automatically only on **invalidation**: an upstream record is revoked, the activation record is missing or corrupt, or the Runtime cannot read the governance state.

### 7. Human override, rollback, and recovery

- **Suspend**: the owner can suspend at any time; effect is immediate at the gate. Suspension leaves the Chief Agent in education-only state.
- **Resume**: requires a new human record, and fails if the bound records are no longer valid.
- **Revoke**: ends the activation permanently; a new activation requires the full process.
- Rollback of activation is suspension; no knowledge or history is deleted.

### 8. Observability and audit

Every gate decision that refuses an operation, every activation record, and every Chief Agent proposal is written to the executive audit trail with the activation ID it ran under. The Mission Board shows the activation state.

### 9. AI provider (F-15)

Activation does not depend on a specific provider. Before activation, the reasoning provider must be configurable (KoreLumina-managed or bring-your-own), consistent with the Business Charter. Provider choice is configuration, not a governance record.

---

## CA-005 Article IX conformance

| Condition | Satisfied by |
|---|---|
| 1. Accepted Initial Competency | Bound IDs in the activation record; gate checks they exist |
| 2. Approved Educational Corpus version | Bound corpus certification ID |
| 3. Governed knowledge access | Reasoning materializes only canonical items and Organizational Memory projections (existing materializer) |
| 4. Role-constrained operational access | Decision 5 (protected routes) and Decision 4 (propose-only) |
| 5. Visible human override and approval gates | Decision 7; existing approval routes, now protected |
| 6. Runtime truth integration | Reasoning reads Runtime state from the Runtime registry; it never asserts it |
| 7. Observability, audit, rollback, recovery | Decisions 7 and 8 |
| 8. Explicit human authorization | Decision 1 and 2 |

---

## Rationale

The education pipeline already follows one pattern: an immutable, content-derived human record bound to the records before it, with staleness detection. Activation follows the same pattern, so it is reviewable and recoverable the same way. Propose-only autonomy lets the Chief Agent start doing useful work (analysis, proposals) with zero ability to change anything on its own, which matches Vision 2050: AI advises, analyzes, recommends; humans govern and approve.

Fixing F-13 and F-14 is part of this decision rather than separate work, because without them activation would be a label on a system that can already act.

---

## Consequences

Positive:

- The education boundary becomes real: no operational Chief Agent behaviour before activation.
- Executive approval and execution routes become protected for all users, not only for the Chief Agent.
- Activation, suspension, and revocation are recorded, explainable, and survive machine loss.

Negative:

- Any current use of executive reasoning before activation stops working until activation.
- Network access to the Runtime from other devices stops unless explicitly configured.

Trade-offs:

- Drift is tolerated after activation; a stale curriculum is visible but does not stop the Chief Agent.
- Propose-only autonomy means every action still needs a human, which costs owner time until a later decision raises autonomy.

---

## Blueprint References

- `docs/canon/VISION_2050.md`: Human Leadership.
- `docs/architecture/amendments/CA-005_LEARNING_CONSTITUTION.md`: Articles IX and X; UNRESOLVED activation authority.
- `docs/architecture/reconciliation/CHIEF_AGENT_OPERATIONAL_LEARNING_MODEL.md`: missing Activation Authority Registry.
- `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md`: Human Approval Gates.
- `docs/architecture/LANDING_CONTRACT.md`: Customer Decision Policy.
- `docs/business/KORELUMINA_BUSINESS_CHARTER.md`: Business boundaries; AI choice.

---

## Implementation Impact (each step is its own ticket, approved before code)

1. **KO-5a: Protect executive routes** (F-14): access checks, human-only routes, localhost binding.
2. **KO-5b: Activation gate** (F-13): `ChiefAgentActivationGate`, dispatcher enforcement, refusal codes, UI state.
3. **KO-5c: Activation records**: record model, persistence in a tracked location, PUT/GET routes, suspend/resume/revoke.
4. **KO-5d: Configurable reasoning provider** (F-15).
5. **KO-5e: Activation**: the owner records activation at `PROPOSE_ONLY`.

---

## Validation

- Tests prove the dispatcher refuses Chief Agent reasoning, proposals, delegation, and execution without an `ACTIVE` gate, and allows proposals with one.
- Tests prove human-only routes refuse agent actors, and all executive routes refuse non-local callers without the Runtime token.
- Tests prove drift keeps the gate `ACTIVE` while invalidation suspends it.
- A rehearsal in a scratch copy: activate, propose, suspend, confirm refusal, resume, revoke.

---

## Related Tickets

- KO-5 (this decision), KO-5a to KO-5e.

---

## Related Reconciliation

- CA-005 UNRESOLVED: activation lifecycle ADR; activation authority office.
- Operational Learning Model: Activation Authority Registry (missing).
