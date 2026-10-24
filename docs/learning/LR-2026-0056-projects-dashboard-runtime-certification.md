# LR-2026-0056 — Projects dashboard runtime certification

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 632617fd..bfeb5684

Source commits: bfeb5684

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-23

Learning cycle: learning-cycle:c1d2c3614884799c · written by the Chief Agent (gpt-5.5)

---

## Summary

The projects dashboard was rebuilt to remove misleading usage, revenue, status, duplicate, and rename UI behavior and to show only Runtime-backed project data. The owner approved the certified design, and a UI contract was added to guard it in the build. bfeb5684a2e7eef883a13c1db71f74f2ff636503

## What changed

- The old workspace dashboard component was removed. (`apps/lumina-builder/src/components/workspaces/DashboardView.tsx`, `bfeb5684`)
- A new Projects workspace was added. (`apps/lumina-builder/src/components/workspaces/projects/ProjectsWorkspace.tsx`, `bfeb5684`)
- The Projects dashboard now shows each project's origin, live runtime state, framework, and last update. (`bfeb5684`, `apps/lumina-builder/src/components/workspaces/projects/sections/ProjectsSection.tsx`)
- The Projects dashboard now shows latest grade and open repairs only for users who may audit them. (`bfeb5684`, `apps/lumina-builder/src/components/workspaces/projects/state/useProjectsView.ts`)
- Project presentation state was separated into shared project presentation logic. (`apps/lumina-builder/src/components/workspaces/projects/shared/projectPresentation.ts`, `bfeb5684`)
- Runtime service support was changed for the Projects dashboard. (`apps/lumina-builder/src/services/runtimeService.ts`, `bfeb5684`)
- A Projects UI contract document and certified UI JSON fixture were added. (`docs/ui-contracts/PROJECTS_UI_CONTRACT.md`, `docs/ui-contracts/projects-certified-ui.json`, `bfeb5684`)
- A Projects UI contract validation script was added and wired through package configuration. (`scripts/projects-ui-contract.mjs`, `package.json`, `bfeb5684`)

## Decisions

- The dashboard must show only what Runtime records. (`bfeb5684`)
- The usage line was removed because it was always zero and included a revenue figure on a customer's own page. (`bfeb5684`)
- Draft and warm labels were removed because every project had been labeled draft and warm. (`bfeb5684`)
- Duplicate and rename actions were removed because they did nothing. (`bfeb5684`)
- Audit fields were limited to users who may audit the project. (`bfeb5684`)
- The owner approved the Projects dashboard design. (`bfeb5684`)
- The build now guards the Projects UI contract. (`bfeb5684`, `scripts/projects-ui-contract.mjs`, `package.json`)

## Lessons

- Do not display metrics on customer-facing project pages unless Runtime records support them. (`bfeb5684`)
- Do not ship project actions that have no working behavior. (`bfeb5684`)
- UI contracts should be added to the build for certified dashboard behavior. (`docs/ui-contracts/PROJECTS_UI_CONTRACT.md`, `docs/ui-contracts/projects-certified-ui.json`, `scripts/projects-ui-contract.mjs`, `package.json`, `bfeb5684`)
- Project dashboards should separate audit-only information from general project presentation. (`bfeb5684`, `apps/lumina-builder/src/components/workspaces/projects/state/useProjectsView.ts`)
