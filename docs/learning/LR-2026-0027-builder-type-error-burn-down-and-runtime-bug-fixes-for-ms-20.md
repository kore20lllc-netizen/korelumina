# LR-2026-0027 — Builder type-error burn-down and runtime bug fixes for MS-2026-0006

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: e0c92b1d..29ce4db4

Source commits: 02e19c8e, 615eeda6, 29ce4db4

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-21

Learning cycle: learning-cycle:8f567bc52f9a8add · written by the Chief Agent (gpt-5.5)

---

## Summary

The work removed unused Builder files, fixed live runtime bugs, and reduced type errors from 127 after dead-code cleanup to 54 after later fixes, with UI contracts unchanged in each commit. Evidence: 02e19c8e782d637a6898cca8a69610879d4c8662, 615eeda647bd96061e1c8feee7b678702c7c3b89, 29ce4db456d2c154cc0507be00ef3784ff3b66ca.

## What changed

- Twenty-nine Builder files that were traced as never loaded were removed. (`02e19c8e`)
- The removed files included unused generated UI components, the old toast chain, ProductionNavigator, a reset dialog, an archived mock service, and an editor store. (`02e19c8e`)
- StoredProject was updated to declare lastEditedAt and runtime because those fields are written at runtime. (`02e19c8e`)
- AppearancePreview was fixed to render its title and description instead of passing them as attributes. (`02e19c8e`, `apps/lumina-builder/src/components/workspaces/appearance/parts/AppearancePreview.tsx`)
- Knowledge barrel exports were updated to stop re-exporting removed modules. (`02e19c8e`, `apps/lumina-builder/src/components/workspaces/knowledge/layout/index.ts`)
- GlobalImportDropZone was fixed so dropped ZIP files reach the import modal. (`615eeda6`, `apps/lumina-builder/src/components/import/GlobalImportDropZone.tsx`)
- The top bar default mode was changed from dev to developer so a valid mode is selected. (`615eeda6`)
- The top bar Mark all read path was fixed because it called a missing context function. (`615eeda6`, `apps/lumina-builder/src/context/WorkspaceContext.tsx`)
- WorkspaceContext now exports ImportPrefill, SkillMode, and Project for files that import those types. (`615eeda6`, `apps/lumina-builder/src/context/WorkspaceContext.tsx`)
- Genesis record types were re-exported where Genesis panels import them. (`615eeda6`, `apps/lumina-builder/src/services/runtime/genesisReplayRead.ts`)
- The Builder app TypeScript lib was set to ES2021 for replaceAll while leaving the target unchanged. (`615eeda6`, `apps/lumina-builder/tsconfig.app.json`)
- RoleSwitcher was fixed by restoring and importing ResetMockDataDialog. (`29ce4db4`, `apps/lumina-builder/src/components/workspaces/settings/RoleSwitcher.tsx`, `apps/lumina-builder/src/components/workspaces/settings/dialogs/ResetMockDataDialog.tsx`)
- ResetMockDataDialog now resets data through adminService.resetAllData. (`29ce4db4`, `apps/lumina-builder/src/components/workspaces/settings/dialogs/ResetMockDataDialog.tsx`)
- PricingView and SettingsView now derive the current plan from the plan role. (`29ce4db4`, `apps/lumina-builder/src/components/workspaces/PricingView.tsx`, `apps/lumina-builder/src/components/workspaces/SettingsView.tsx`)
- Appearance drawer sliders were bound to appearance state so they can move. (`29ce4db4`, `apps/lumina-builder/src/components/workspace-appearance/sections/SliderSection.tsx`)
- Five destructive confirmations were changed to use the danger LuminaButton variant. (`29ce4db4`)
- TransformModal was fixed so opening a transform in Designer does not throw on usageProvider and activates the project. (`29ce4db4`, `apps/lumina-builder/src/components/transform/TransformModal.tsx`)
- LuminaSurface now forwards refs so GlowCard ripple behavior can receive the ref. (`29ce4db4`, `apps/lumina-builder/src/components/lumina/surface/LuminaSurface.tsx`)
- PromptComposer typewriter option names were corrected. (`29ce4db4`, `apps/lumina-builder/src/components/workspaces/ai/PromptComposer.tsx`)
- LuminaInspectorSection was restored to the Lumina barrel after an export collision dropped it. (`29ce4db4`, `apps/lumina-builder/src/components/lumina/index.ts`)

## Decisions

- The team removed only files that were traced from the Builder entry point as never loaded. (`02e19c8e`)
- projectRepository was kept and fixed because team tests use it. (`02e19c8e`)
- AppearancePreview was kept and fixed because the Appearance workspace uses it. (`02e19c8e`, `apps/lumina-builder/src/components/workspaces/appearance/parts/AppearancePreview.tsx`)
- Plan display was based on the plan role because ADR-0043 says the usage snapshot does not carry the plan. (`29ce4db4`)
- Destructive confirmations were moved to the danger variant because LuminaButton does not have a destructive variant. (`29ce4db4`)
- ResetMockDataDialog uses adminService.resetAllData because lib/seed has no reset path. (`29ce4db4`, `apps/lumina-builder/src/components/workspaces/settings/dialogs/ResetMockDataDialog.tsx`)

## Lessons

- Dead generated UI and knowledge files can hide many type errors without being under a UI contract. (`02e19c8e`)
- Exporting WorkspaceContext types surfaced 12 hidden errors that were fixed in the same change. (`615eeda6`, `apps/lumina-builder/src/context/WorkspaceContext.tsx`)
- A setter call with unsupported extra arguments can open a modal without the intended files. (`615eeda6`, `apps/lumina-builder/src/components/import/GlobalImportDropZone.tsx`)
- Default enum-like values must match the UI mode names or no top-bar mode appears selected. (`615eeda6`)
- Removing files as dead code can be wrong when development-only settings still import them. (`29ce4db4`, `apps/lumina-builder/src/components/workspaces/settings/RoleSwitcher.tsx`, `apps/lumina-builder/src/components/workspaces/settings/dialogs/ResetMockDataDialog.tsx`)
- Component wrappers that drop refs can break downstream visual behavior such as GlowCard ripple. (`29ce4db4`, `apps/lumina-builder/src/components/lumina/surface/LuminaSurface.tsx`)
- Reading plan data from the wrong snapshot left Current plan blank and Cancel always shown. (`29ce4db4`, `apps/lumina-builder/src/components/workspaces/PricingView.tsx`, `apps/lumina-builder/src/components/workspaces/SettingsView.tsx`)

## Open risks

- Fifty-four type errors remain after the final commit. (`29ce4db4`)
- The remaining type errors are all in Knowledge workspaces and tests. (`29ce4db4`)
