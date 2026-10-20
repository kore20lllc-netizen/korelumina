# LR-2026-0014 — Governed roles, canonical retirements, and Mission System v1

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 7d764771..6e01d8f0

Source commits: eb3abca5, cc9eb943, 65589244, d23ef5cf, 9cfdc973, 39e4189f, a55d4b94, 92f1c112, 37d22565, 6e01d8f0

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-20

Learning cycle: learning-cycle:6ff2112c6bc3dee6 · written by the Chief Agent (gpt-5.5)

---

## Summary

Runtime added governed staff role assignment, canonical retirement records, and Mission System v1 lifecycle support in eb3abca5a4cbfd7a6bb40557c856c655198faf3b, d23ef5cf4a357961b2cc8f18ed14fecae9252990, and 39e4189fa46653d7744157fb1c6dcec75cc96029. Mission work was linked to git trailers, owner approvals, validation checks, and learning records in a55d4b94f32adce90d575ea3e9c6e815059940dd, 92f1c112fad75a9917ccf48ca163c105219804ca, and 6e01d8f015caf6cf709cff15dd7a901339903e34. Runtime test reliability, runtime-data lock placement, and learning scheduler startup behavior were fixed in cc9eb943c10f95b80de64b9b5dda9afb4418c229, 65589244f436e69c410801ebb555932ac1a9e306, and 37d22565a80bd8efab35cfe07c09614b7c275667.

## What changed

- Runtime now exposes GET /api/admin/users and POST /api/admin/users/:id/role for super-admin staff role assignment through the Supabase admin API. (`eb3abca5`)
- Staff role assignments are recorded under runtime/governance/role-assignments with from, to, reason, who, and when. (`eb3abca5`)
- Admin > Users now uses the real directory with a reason dialog for real sign-in. (`apps/lumina-builder/src/components/workspaces/admin/UsersTab.tsx`)
- Canonical retirement records were added so current policy can exclude canonical ids while keeping their canonical store history. (`d23ef5cf`)
- KP-2026-000029 and KP-2026-000030 were retired from current policy because they were certification fixtures whose source files were no longer available. (`d23ef5cf`)
- ADR-0044 was accepted for Mission System v1. (`docs/adr/ADR-0044-mission-system-v1.md`)
- Missions are now committed Runtime records under runtime/executive/missions with objective, owner, approvals, risks, plan, validation plan, linked commits, recovery anchor, produced knowledge, and history. (`39e4189f`)
- Mission lifecycle transitions now record actor, time, and reason. (`39e4189f`)
- Git Mission trailers are now parsed and attached to approved missions after learning cycles. (`a55d4b94`)
- A linked commit starts an approved mission executing and becomes the latest recovery anchor. (`a55d4b94`)
- Chief Agent replies can now carry missionProposal payloads that Runtime records and submits for owner approval. (`92f1c112`)
- Mission completion now requires task disposition, owner build verification for the latest linked commit, no pending linked approval, required documents at HEAD, and a recovery anchor. (`6e01d8f0`)
- The first continuous-learning check now runs one minute after Runtime starts. (`37d22565`)
- Runtime project locks now live under the gitignored runtime-data root instead of following process.cwd(). (`65589244`)

## Decisions

- Runtime, not the Builder client, holds the Supabase service role key for staff role assignment. (`eb3abca5`)
- Role assignment refuses header claims, plan roles, unknown roles, missing reasons, no-op changes, and removal of the last super admin. (`eb3abca5`)
- Canonical retirement records are ignored unless decided by a human with a real reason. (`d23ef5cf`)
- ADR-0044 keeps the Chief Agent authority at PROPOSE_ONLY for missions. (`docs/adr/ADR-0044-mission-system-v1.md`)
- ADR-0044 supersedes the external Mission Board with Runtime mission records. (`docs/adr/ADR-0044-mission-system-v1.md`)
- Only the owner may approve, reject, block, unblock, cancel, or archive missions. (`39e4189f`)
- Mission execution is represented by owner commits carrying a Mission trailer. (`a55d4b94`)
- Mission proposal approval and mission route approval are one gate. (`92f1c112`)
- Task status and build verification are owner-only mission validation actions. (`6e01d8f0`)

## Lessons

- Canonicalization-gate tests needed isolated stores because shared per-process state made correct refusals look like failures. (`cc9eb943`)
- Mission Ownership tests should resolve the repository root instead of depending on the current working directory. (`cc9eb943`)
- Operational lock state should live under runtime-data, not in a cwd-dependent runtime-locks folder. (`65589244`)
- Development-only destructive browser actions must import their reset function and stay hidden outside development builds. (`65589244`)
- A 30-minute first learning interval missed seven owner commits during restart-heavy development. (`37d22565`)
- Mission linking failures should be recorded without failing the learning cycle. (`a55d4b94`)
- Malformed mission proposals should be dropped with the reason kept and should not fail the Chief Agent reply. (`92f1c112`)

## Open risks

- The Executive Office Mission section remains a proposed mission with pending approval. (`decision:reasoning:executive-office:mvg3xz24-tgsoo9`, `approval:decision:reasoning:executive-office:mvg3xz24-tgsoo9`)
- Missions cannot complete until required documents are committed at HEAD. (`6e01d8f0`)
- A new linked commit requires a new owner build verification before mission completion. (`6e01d8f0`)
