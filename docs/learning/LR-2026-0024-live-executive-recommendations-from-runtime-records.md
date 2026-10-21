# LR-2026-0024 — Live executive recommendations from Runtime records

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 7d3086db..e8ec6182

Source commits: e8ec6182

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-20

Learning cycle: learning-cycle:2217d70b9a7eae1a · written by the Chief Agent (gpt-5.5)

---

## Summary

Executive dashboard recommendations now come from fixed rules over existing Runtime records and name their source records for checking, instead of using a snapshot (e8ec6182a4548e5b81c5d88bdbf05fa1d7b49944). The platform route now counts local-only Learning Records and Runtime records, and the Planning Center adds mission context to task names to prevent wrong-mission task edits (e8ec6182a4548e5b81c5d88bdbf05fa1d7b49944).

## What changed

- Executive dashboard recommendations were changed from a snapshot to fixed-rule recommendations derived from Runtime records. (`e8ec6182`, `apps/lumina-builder/src/components/workspaces/executive/state/executiveRecommendations.ts`)
- Recommendation rules now cover pending decisions, invalid activation certifications, missions one step from done, open tasks, approved missions not started, planned owner missions, canonical reviews waiting, learning held or behind, and local-only records. (`e8ec6182`, `apps/lumina-builder/src/components/workspaces/executive/state/executiveRecommendations.ts`)
- Each dashboard recommendation now names the record it comes from so it can be checked. (`e8ec6182`, `apps/lumina-builder/src/components/workspaces/executive/state/executiveRecommendations.ts`)
- The executive platform route now counts uncommitted Learning Records and Runtime records that exist only on the local machine. (`e8ec6182`, `apps/lumina-runtime/src/routes/executivePlatform.ts`)
- The Planning Center now names each task with its mission. (`e8ec6182`, `apps/lumina-builder/src/components/workspaces/executive/sections/PlanningCenter.tsx`)
- The certified executive office UI contract was updated after dashboard presentation approval. (`e8ec6182`, `docs/ui-contracts/executive-office-certified-ui.json`)

## Decisions

- The dashboard should use live Runtime records rather than snapshot recommendations because the dashboard must be fully live. (`e8ec6182`)
- Recommendations should be produced by fixed rules and not generated or guessed. (`e8ec6182`)
- Recommendation UI should name the source record because recommendations must be checkable. (`e8ec6182`)
- Planning Center task labels should include the mission because identical task IDs across missions caused a task to be changed on the wrong mission. (`e8ec6182`, `apps/lumina-builder/src/components/workspaces/executive/sections/PlanningCenter.tsx`)

## Lessons

- Snapshot dashboard recommendations became stale enough to replace with live recommendations from records. (`e8ec6182`)
- Identical task IDs across missions are unsafe in UI actions unless the mission context is shown. (`e8ec6182`)
- Dashboard recommendations are easier to verify when each recommendation names the source record. (`e8ec6182`)
- Owner visual approval was used before certifying the dashboard presentation. (`e8ec6182`, `docs/ui-contracts/executive-office-certified-ui.json`)
