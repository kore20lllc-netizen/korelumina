# ADR-0042 — Continuous Learning v1

## Status

Proposed

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: How the activated Chief Agent learns automatically from engineering work done after Genesis: what is captured, how it becomes knowledge, what counts as human approval, and when it becomes available to Chief Agent reasoning.

---

## Context

CA-005 (Learning Constitution), Article X: Continuous Learning begins after activation. It may consume governed evidence from engineering work, conversations, missions, deployments, incidents, audits, and human corrections. It must follow the Knowledge Constitution: evidence → Knowledge IR → Knowledge Package → validation and human review → Canonical Knowledge → future use. It may not create canonical authority, alter curriculum, or bypass human approval silently.

The Chief Agent was activated on 2026-10-18 at `PROPOSE_ONLY` (ADR-0041). Since then it reasons over certified document content (KO-6).

### Verified state on 2026-10-18

- **Nothing new reaches the Chief Agent.** It knows only the 18 canonical items certified on 2026-10-17. No process captures new commits, documents, ADRs, or executive decisions.
- **The learning destinations are not built.** Executive events route to `learning`, `experience`, and `organizational-memory`, and all three report `No handler is registered`.
- **Incremental capture already works.** Genesis has run 23 replays, most bounded by time. A dry run on a scratch clone with `historicalStart` = 2026-10-17 admitted exactly the new work: 25 commits, ADR-0040, ADR-0041, and 4 changed documents, and skipped the 1,693 older sources.
- **Commits never become knowledge by themselves.** The Genesis admission policy treats commits as correlation evidence (lineage and chronology). Only approved documents become Knowledge Packages. An earlier path that turned commits into packages was archived as over-production.

So the missing piece is not capture. It is turning a body of engineering work into governed knowledge, automatically.

### The owner's constraint

KoreLumina is run by one person. Reviewing every commit, or every learning output, by hand does not scale to thousands of commits. Work is already approved once: the owner reviews it with the engineering assistant and then commits it. A second manual review of the same work adds no new judgment.

---

## Problem

1. No checkpoint records what the Chief Agent has already learned from.
2. No trigger captures new work.
3. Engineering work (commits, decisions, fixes, mistakes) has no route to knowledge, because only approved documents do.
4. Executive records (Chief Agent decisions and your approvals) are not used for learning.

---

## Alternatives Considered

**1. Promote commits directly to knowledge.**
Rejected. The admission policy deliberately keeps commits as correlation evidence; the previous attempt produced packages without governance identity and was archived.

**2. Let the Chief Agent write canonical knowledge directly.**
Rejected. CA-005 and ADR-0041 forbid it: the Chief Agent may not create canonical authority or bypass human review.

**3. Chief Agent drafts a Learning Record; the owner approves each one by hand.**
Rejected. Correct governance, but it requires a manual review per learning cycle, then a second Canonical Review of its package. A one-person organization cannot sustain that at the volume of real engineering work.

**4. The owner's commit is the approval; learning and promotion are automatic, with exceptions held for review.** (Chosen.)
The human judgment CA-005 requires is the owner reviewing and committing the work. Learning from committed work is then automatic, governed by an active review policy, recorded, and reversible. Only exceptions reach the owner.

---

## Decision

### 1. The commit is the approval

A commit by the owner's identity (currently `kore20lllc-netizen <kore20lllc@gmail.com>`) on a governed branch is the human approval of that work, for learning. This is the Founder's written delegation under ADR-0041 Decision 1, recorded in this ADR.

Work from any other author (future team members, agents, customers, automated tools) is captured but not learned from automatically; it is held for review.

### 2. Learning checkpoint

A tracked record, `runtime/governance/continuous-learning/checkpoint.json`, holds the last commit the Chief Agent has learned up to, and the history of every learning cycle. The first checkpoint is the Day-0 certification (2026-10-17).

### 3. Automatic learning cycle

While the Runtime runs, it checks for new commits every 30 minutes, and on demand ("Learn now"). When there are new owner commits since the checkpoint, it runs one cycle (never two at once):

1. **Capture.** A bounded Genesis replay from the checkpoint admits the window's commits as correlation evidence and its changed approved documents and ADRs through the normal path.
2. **Synthesis.** The Chief Agent writes one **Learning Record** for the window from the commits (messages and changed files), changed documents and ADRs, and executive decisions and approvals in the window. It states what changed, decisions made and why, lessons and pitfalls, and open risks.
3. **Mechanical checks.** Before anything is kept, the Runtime verifies:
   - every statement cites a commit SHA, file path, or record ID that exists in the window; uncited statements are removed;
   - the window contains only owner commits;
   - the Chief Agent reported no conflict with governing knowledge;
   - confidence is at or above the threshold (default 0.6).
4. **Write and admit.** If the checks pass, the record is written to `docs/learning/` with `Status: Approved`, citing the owner commits it was learned from, and the same cycle admits it: Knowledge Package → policy review → promotion. No manual step. The Runtime never runs git itself: the new file is simply part of your next commit, like any other change in the working tree.
5. **Use.** Once canonical, the Chief Agent reasons with it (KO-6 gives it the certified text).
6. **Checkpoint.** The checkpoint advances only when the cycle completes.

### 4. Policy review instead of manual review

An active Canonical Review policy for authority class `learning` approves Learning Record packages that passed the checks, and the existing autonomous governed promotion makes them canonical. This uses the review-policy machinery already in the Runtime (and resolves, for this class, the scope limitation recorded as KO-4a).

Every automatic approval and promotion is recorded in the executive audit trail with the cycle, the source commits, and the policy that approved it.

### 5. Exceptions: the only things you are asked about

A cycle is held, and shown to you, only when:
- a check in step 3 fails (uncited content, conflict with governing knowledge, low confidence);
- the window includes commits by anyone other than the owner;
- a governing document (Canon, Constitution, amendments, Blueprint, governance) changed in a way that would supersede canonical knowledge. These keep their existing Canonical Review, because CA-005 Article XI requires approval by the authority that governs that document class.

Everything else is learned without asking. You can read any Learning Record at any time, and revoke one (it is superseded and stops being used; history is kept).

### 5a. Learning Record registry

`docs/learning/` is the canonical source registry for learning records, following ADR-0040:
- authority class `learning`, subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge; a learning record can never override them;
- required fields: Status, Version, Owner, Scope, Window (from/to commit), Source commits, Approval basis (this ADR);
- no customer data, personal data, credentials, or secrets.

### 5b. Authority

The Chief Agent remains `PROPOSE_ONLY` for actions. Writing a Learning Record is not an action on the platform: it is the governed output of learning, authorized by this ADR, limited to `docs/learning/`, and reversible.

### 6. Curriculum drift

New canonical knowledge makes the Day-0 and corpus certifications stale. As decided in ADR-0041, this is drift, not invalidation: the Chief Agent stays active, the UI shows the drift, and you re-certify on your own schedule.

### 7. Out of scope for v1

- Claude Code session conversations. They are captured only when their substance is committed (code, ADRs, documents) or pasted into a Learning Record during review.
- Runtime incidents, deployments, and customer missions (no event sources yet).
- The `learning`, `experience`, and `organizational-memory` executive destinations. They stay unhandled until later tickets.

---

## Consequences

Positive:
- The Chief Agent learns from every owner-approved change without any extra manual review.
- Nothing is lost if a cycle is delayed: the window always starts at the checkpoint.
- What it learns is readable, cited, recorded, in git, and reversible.
- No new knowledge path: Learning Records use the same admission and promotion as every governed document.

Negative:
- A Learning Record can be wrong even with valid citations. Mitigations: it is the lowest authority class, it can never override governing knowledge, every claim cites its source, and you can revoke it.
- One model call per cycle.

Trade-offs:
- Learning is batched per window, not per commit.
- Governing-document changes still need Canonical Review; they are rare and high-impact.

---

## Blueprint References

- `docs/architecture/amendments/CA-005_LEARNING_CONSTITUTION.md`: Article X, Continuous Learning; Article XIII, invariants.
- `docs/architecture/00_PLATFORM_CONSTITUTION.md`: Laws 6, 8, 9, 11, 12.
- `docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md`: Learning Workflow.
- `docs/adr/ADR-0040-business-domain-knowledge-registry.md`: registry pattern.
- `docs/adr/ADR-0041-chief-agent-activation.md`: PROPOSE_ONLY, drift.

---

## Implementation Impact (each step is its own ticket)

1. **CL-1a: Checkpoint and capture.** Checkpoint store; bounded replay from the checkpoint; owner-identity check; `GET/POST /api/learning/cycles`; automatic 30-minute check.
2. **CL-1b: Learning Record registry.** `docs/learning/` discovery and `learning` classification (as ADR-0040 did for business/domain).
3. **CL-1c: Synthesis and checks.** Chief Agent writes a cited Learning Record; mechanical citation, author, conflict, and confidence checks.
4. **CL-1d: Automatic admission.** Write and commit the record, review policy for `learning`, autonomous promotion, audit records, exception hold, revoke.
5. **CL-1e: First cycle.** Run on the work since 2026-10-17, including UI-1 to KO-6.

---

## Validation

- Tests prove the checkpoint advances only after a successful capture, and that a failed cycle leaves it unchanged.
- Tests prove a record keeps only statements citing sources in its window, that a non-owner commit holds the cycle, and that a failed check writes nothing to `docs/`.
- Tests prove the review policy approves only `learning` packages that passed the checks, and that a revoked record stops being used.
- A dry run on a scratch clone shows the window's sources match `git log` since the checkpoint.
- The first real cycle: the Learning Record is written, admitted, promoted with no manual step, and then cited by the Chief Agent when asked about the work.

---

## Related Tickets

- CL-1 (this decision), CL-1a to CL-1e.
- KO-4a (review policies), EW-0 (Executive Workspace, where learning cycles will be shown).
