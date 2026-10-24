# LR-2026-0059 — Runtime-backed Developer workspace and certified AI mark

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: de1828f6..24142538

Source commits: 24142538

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-24

Learning cycle: learning-cycle:a9f2452e1bd62812 · written by the Chief Agent (gpt-5.5)

---

## Summary

The Developer workspace was rebuilt from scripted behavior into Runtime-backed file, dev-server, logs, and AI Assist workflows in commit 24142538205433797706edfc1af4c029bd23bac8. The same work fixed draft id handling and added the shared KoreLumina AI mark with UI contract coverage in apps/lumina-builder/src/services/runtime/drafts.ts and docs/ui-contracts/DEVELOPER_UI_CONTRACT.md.

## What changed

- The old Developer workspace implementation was removed and replaced with a new modular workspace under apps/lumina-builder/src/components/workspaces/developer/DeveloperWorkspace.tsx. (`24142538`, `apps/lumina-builder/src/components/workspaces/DeveloperWorkspace.tsx`, `apps/lumina-builder/src/components/workspaces/developer/DeveloperWorkspace.tsx`)
- AI Assist now drafts with the configured model instead of returning canned snippets. (`24142538`, `apps/lumina-builder/src/components/workspaces/developer/state/useAIAssist.ts`)
- AI Assist now shows each affected file as a diff before changes are applied. (`24142538`, `apps/lumina-builder/src/components/workspaces/developer/sections/AIAssistPane.tsx`)
- AI Assist now writes files only when Apply is used. (`24142538`, `apps/lumina-builder/src/components/workspaces/developer/state/useAIAssist.ts`)
- AI Assist now supports Undo after applying changes. (`24142538`, `apps/lumina-builder/src/components/workspaces/developer/state/useAIAssist.ts`)
- Developer file operations now use Runtime-backed conflict-safe saves. (`24142538`, `apps/lumina-builder/src/components/workspaces/developer/state/useDeveloperFiles.ts`)
- Developer dev-server controls now include restart behavior and separate logs. (`24142538`, `apps/lumina-builder/src/components/workspaces/developer/state/useRuntimeControl.ts`, `apps/lumina-builder/src/components/workspaces/developer/sections/LogsPane.tsx`)
- The draft client was changed after it read the wrong id field and rejected every draft as failed. (`24142538`, `apps/lumina-builder/src/services/runtime/drafts.ts`)
- The living Lumina form was introduced as the shared KoreLumina AI mark. (`24142538`, `apps/lumina-builder/src/components/ai/LuminaAIMark.tsx`)
- The Chief Agent logo now uses the shared KoreLumina AI mark. (`24142538`, `apps/lumina-builder/src/components/workspaces/executive/shared/ChiefAgentLogo.tsx`)
- A Developer UI contract and certification JSON were added. (`24142538`, `docs/ui-contracts/DEVELOPER_UI_CONTRACT.md`, `docs/ui-contracts/developer-certified-ui.json`)
- A developer UI contract script was added to guard the approved UI contract in the build. (`24142538`, `scripts/developer-ui-contract.mjs`, `package.json`)

## Decisions

- The team chose Runtime-backed Developer workspace behavior over scripted behavior because the old workspace did not read or change the real project. (`24142538`)
- The team chose a diff-and-Apply workflow for AI Assist so generated changes are reviewable before write. (`24142538`, `apps/lumina-builder/src/components/workspaces/developer/sections/AIAssistPane.tsx`)
- The team chose to make the living Lumina form the shared KoreLumina AI mark after owner approval of the look. (`24142538`, `apps/lumina-builder/src/components/ai/LuminaAIMark.tsx`)
- The team chose to guard the Developer UI with a build-time contract. (`24142538`, `docs/ui-contracts/DEVELOPER_UI_CONTRACT.md`, `scripts/developer-ui-contract.mjs`)

## Lessons

- Scripted AI actions can create false confidence when they do not inspect or modify the real project. (`24142538`)
- Draft clients must verify response field names because the wrong id field caused every draft to be rejected as failed. (`24142538`, `apps/lumina-builder/src/services/runtime/drafts.ts`)
- Conflict-safe saves should remain part of Developer file editing workflows. (`24142538`, `apps/lumina-builder/src/components/workspaces/developer/state/useDeveloperFiles.ts`)
- Build-time UI contracts are useful for preserving an approved shared mark. (`24142538`, `docs/ui-contracts/DEVELOPER_UI_CONTRACT.md`, `scripts/developer-ui-contract.mjs`)
