# ADR-0044 — Mission System v1

## Status

Accepted

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: How missions become real Runtime records: what a mission is, who may move it through its lifecycle, how engineering work attaches to it, when it is validated and complete, and what the Executive Office Mission, Planning, Agent and Execution sections show. Implements the approved Chief Agent Mission System (docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md) under ADR-0041 (PROPOSE_ONLY) and ADR-0042 (continuous learning).

---

## Context

The approved Mission System says everything KoreLumina accomplishes is a mission, with a fixed lifecycle (Created → Planned → Approved → Delegated → Executing → Validating → Completed → Knowledge Extracted → Archived), mandatory validation, and knowledge as a deliverable. The Chief Agent owns missions; specialist agents own tasks.

### Verified state on 2026-10-19

- **No mission exists anywhere in Runtime.** There is no mission record, store, route or event source. The Executive Office Mission, Planning, Agent and Execution sections are design previews.
- **Work is tracked outside the platform.** Tickets live on an external Mission Board and in commit subjects (EW-1, SEC-1c, F-31 …). The Chief Agent cannot see them except through commit text.
- **How work actually happens.** The owner and Claude design and build; the owner applies, verifies and commits. ADR-0042 makes the owner's commit the approval, and continuous learning turns each commit window into a cited Learning Record.
- **The Chief Agent is at PROPOSE_ONLY** (ADR-0041). It may reason and propose; it may not approve, delegate or execute. The governed decision → approval → delegation → action → execution pipeline exists and correctly stops before execution.
- **Live operational state reaches reasoning** (EW-2), so the Chief Agent can reason about missions once they are records.
- **No specialist agent exists.** Only the Chief Agent does.

## Problem

Make missions first-class, observable Runtime records that follow the approved lifecycle, attach to the work that really happens (owner commits), validate and complete on evidence rather than claims, and feed knowledge, without giving the Chief Agent authority ADR-0041 withholds and without inventing agents that do not exist.

## Alternatives Considered

1. **Keep missions on the external board.** Rejected: the Chief Agent cannot see, reason about or learn from them, and the Executive Office stays a preview.
2. **Let the Chief Agent run missions end to end.** Rejected: requires autonomy above PROPOSE_ONLY, which ADR-0041 withholds.
3. **Missions as Runtime records, proposed by the Chief Agent or the owner, approved by the owner, executed through the owner's commits, validated and completed on evidence.** Chosen.

## Decision

1. **A mission is a governed Runtime record** in `runtime/executive/missions/`, committed like other executive records. It carries the approved structure: identifier (`MS-YYYY-NNNN`), title, description, objective, type, priority, owner (always the Chief Agent), participants, related repositories and services, required approvals, plan, validation plan, recovery anchor, risks, linked work, and produced knowledge.

2. **The lifecycle is enforced, with authority by step.**
   - *Draft / Planned*: the Chief Agent or the owner creates a mission and its plan. A Chief Agent mission is a proposal.
   - *Approved*: only the owner approves, through the Approval Center. A Chief Agent proposal becomes an ordinary approval addressed to the owner.
   - *Executing*: automatic, when the first owner commit linked to the mission lands.
   - *Validating → Completed*: automatic, only when every validation check passes (Decision 5).
   - *Knowledge Extracted*: automatic, when a canonical Learning Record cites the mission's commits.
   - *Archived*: the owner archives. *Blocked* and *Cancelled* are owner actions with a reason.
   - Every transition is appended to the mission's history with who, when and why. The Chief Agent never approves, delegates, executes, completes or archives (ADR-0041).

3. **Work attaches through commit trailers.** An owner commit carrying `Mission: MS-2026-0001` belongs to that mission. Continuous learning already reads every owner commit; it records the link, and the mission's latest linked commit is its recovery anchor. Non-owner commits are held, as in ADR-0042.

4. **Planning is the mission's plan.** A plan is an ordered list of epics and tasks with acceptance criteria. The Chief Agent drafts plans by reasoning over governed knowledge and live operational state; the owner approves the plan with the mission. Objectives above missions reuse the existing objective record and are created by the owner.

5. **Validation is evidence, not a claim.** A mission completes only when:
   - every planned task is done or explicitly dropped by the owner with a reason;
   - the last linked commit passed `npm run build` (recorded by the owner's verification, or by Runtime when it can run the build);
   - no approval linked to the mission is pending;
   - documentation required by the plan is committed;
   - a recovery anchor (commit) is recorded;
   - knowledge extraction is due, and completes the lifecycle when a canonical Learning Record cites the mission.

6. **Agents and execution show only what exists.** The Agent Center lists the Chief Agent with its real status and missions; specialist agents appear as "Not built" until they exist. The Execution Center shows a mission's linked commits, learning cycles, validation results and runtime events for its projects. Nothing is simulated.

7. **The external Mission Board is superseded.** Open board tickets are imported once as missions, and the board is no longer the source of truth.

## Consequences

- The Executive Office Mission, Planning, Agent and Execution sections become live, with no design-preview data left.
- The Chief Agent can propose, plan and reason about missions, and learn from completed ones, while every authority step stays with the owner.
- Commit messages gain one convention: a `Mission:` trailer.
- Missions add records under `runtime/executive/missions` to bookkeeping commits.

## Implementation Impact (each step is its own ticket)

- MS-1: Mission record, store, lifecycle state machine with transition authority and history; routes; tests.
- MS-2: Commit trailer linking in continuous learning; Executing and recovery anchor from linked commits; knowledge extraction from Learning Records.
- MS-3: Chief Agent mission and plan proposals through the existing approval flow.
- MS-4: Validation checks and completion.
- MS-5: Executive Office Mission, Planning, Agent and Execution sections wired; design-preview data removed.
- MS-6: One-time import of open Mission Board tickets.

## Validation

- A Chief Agent mission proposal never reaches Approved without an owner approval.
- An owner commit with a `Mission:` trailer moves an Approved mission to Executing and becomes its recovery anchor; a non-owner commit does not.
- A mission with any failed check cannot complete.
- A completed mission reaches Knowledge Extracted only when a canonical Learning Record cites its commits.
- Every transition appears in the mission's history with actor, time and reason.

## Related Tickets

MS-1 to MS-6. Builds on ADR-0041, ADR-0042, EW-2.
