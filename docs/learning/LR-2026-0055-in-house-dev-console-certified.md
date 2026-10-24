# LR-2026-0055 — In-House Dev console certified

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 9baff9e0..632617fd

Source commits: 632617fd

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-23

Learning cycle: learning-cycle:ddbdaba966f0c068 · written by the Chief Agent (gpt-5.5)

---

## Summary

In-House Dev was rebuilt from inactive module tiles and a made-up mobile packaging card into a Runtime-backed Knowledge Operations console for repair engagements, attention items, tools, and audit state. 632617fd07721f503bf9d8245bc8899924f59e2a The certified UI is now reachable from the sidebar and guarded by a build-time UI contract. 632617fd07721f503bf9d8245bc8899924f59e2a

## What changed

- The old In-House Dev dashboard was removed after module tiles were described as doing nothing. (`632617fd`, `apps/lumina-builder/src/components/workspaces/InHouseDevDashboard.tsx`)
- The mobile packaging card was removed after it was described as running on made-up data. (`632617fd`, `apps/lumina-builder/src/components/workspaces/inhouse/MobilePackagingCard.tsx`)
- A new In-House Dev workspace was added for the Knowledge Operations console. (`632617fd`, `apps/lumina-builder/src/components/workspaces/inhouse/InHouseDevWorkspace.tsx`)
- A command deck was added for the In-House Dev console layout. (`apps/lumina-builder/src/components/workspaces/inhouse/layout/InHouseCommandDeck.tsx`)
- An Engagements section was added so engineers can take, work, review, and deliver agreed repair work. (`632617fd`, `apps/lumina-builder/src/components/workspaces/inhouse/sections/EngagementsSection.tsx`)
- In-House sections were added for attention items, internal tools, and project audit state. (`632617fd`, `apps/lumina-builder/src/components/workspaces/inhouse/sections/InHouseSections.tsx`)
- The In-House console state hook was added to read console state from Runtime. (`632617fd`, `apps/lumina-builder/src/components/workspaces/inhouse/state/useInHouseConsole.ts`)
- The repo audit state hook was updated so every project's audit state can be read by the console. (`632617fd`, `apps/lumina-builder/src/components/workspaces/repo-audit/state/useRepoAudit.ts`)
- Sidebar navigation was updated so in-house engineers can reach the In-House Dev console. (`632617fd`, `apps/lumina-builder/src/components/layout/Sidebar.tsx`)
- Index routing was updated to use the new In-House Dev workspace. (`apps/lumina-builder/src/pages/Index.tsx`)
- A UI contract document, certified UI JSON, contract script, and package wiring were added to guard the certified console in the build. (`632617fd`, `docs/ui-contracts/INHOUSE_DEV_UI_CONTRACT.md`, `docs/ui-contracts/inhouse-dev-certified-ui.json`, `scripts/inhouse-dev-ui-contract.mjs`, `package.json`)

## Decisions

- The team chose to replace the inactive dashboard and made-up mobile packaging card instead of keeping them. (`632617fd`, `apps/lumina-builder/src/components/workspaces/InHouseDevDashboard.tsx`, `apps/lumina-builder/src/components/workspaces/inhouse/MobilePackagingCard.tsx`)
- The Engagements queue was chosen as the lead surface for In-House Dev. (`632617fd`, `apps/lumina-builder/src/components/workspaces/inhouse/sections/EngagementsSection.tsx`)
- The console was required to read attention items, internal tools, and project audit state from Runtime. (`632617fd`, `apps/lumina-builder/src/components/workspaces/inhouse/state/useInHouseConsole.ts`, `apps/lumina-builder/src/components/workspaces/repo-audit/state/useRepoAudit.ts`)
- The owner approved the In-House Dev console. (`632617fd`)
- The certified UI contract was chosen as the build guard for the In-House Dev console. (`632617fd`, `docs/ui-contracts/INHOUSE_DEV_UI_CONTRACT.md`, `docs/ui-contracts/inhouse-dev-certified-ui.json`, `scripts/inhouse-dev-ui-contract.mjs`, `package.json`)

## Lessons

- Do not ship workspace module tiles that do nothing. (`632617fd`, `apps/lumina-builder/src/components/workspaces/InHouseDevDashboard.tsx`)
- Do not ship operational console cards backed by made-up data. (`632617fd`, `apps/lumina-builder/src/components/workspaces/inhouse/MobilePackagingCard.tsx`)
- Runtime-backed state is the preferred pattern for operational repair and audit console data. (`632617fd`, `apps/lumina-builder/src/components/workspaces/inhouse/state/useInHouseConsole.ts`, `apps/lumina-builder/src/components/workspaces/repo-audit/state/useRepoAudit.ts`)
- Certified workspace UI should have a contract file and build script to prevent drift. (`632617fd`, `docs/ui-contracts/INHOUSE_DEV_UI_CONTRACT.md`, `docs/ui-contracts/inhouse-dev-certified-ui.json`, `scripts/inhouse-dev-ui-contract.mjs`)

## Open risks

- Future In-House Dev UI changes must keep the certified UI contract, JSON fixture, and build script in sync. (`docs/ui-contracts/INHOUSE_DEV_UI_CONTRACT.md`, `docs/ui-contracts/inhouse-dev-certified-ui.json`, `scripts/inhouse-dev-ui-contract.mjs`, `package.json`)
- The console depends on Runtime-backed In-House and repo audit state being available. (`632617fd`, `apps/lumina-builder/src/components/workspaces/inhouse/state/useInHouseConsole.ts`, `apps/lumina-builder/src/components/workspaces/repo-audit/state/useRepoAudit.ts`)
