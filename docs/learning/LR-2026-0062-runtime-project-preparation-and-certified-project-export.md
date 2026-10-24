# LR-2026-0062 — Runtime project preparation and certified project export

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 29210dc0..62e19bff

Source commits: fb7b7e18, 62e19bff

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-24

Learning cycle: learning-cycle:1c7536bb132fd034 · written by the Chief Agent (gpt-5.5)

---

## Summary

Runtime project preparation was moved off synchronous dependency checks and installs so Runtime would not freeze during long installs, and unchanged dependencies are skipped by fingerprinting. Source: fb7b7e18e11a3db26dfb2268ae8d734931b5db38. Project export was added so managers can download a project zip while excluding keys, dependencies, build output, .git, and symbolic links. Source: 62e19bff0d3b7f26544419152457aba96c706662.

## What changed

- Runtime dependency checks and installs now run asynchronously instead of blocking Runtime during project preparation. (`fb7b7e18`, `apps/lumina-runtime/src/runtime/ensureProjectIsolation.ts`)
- Concurrent starts of the same project now share one dependency install. (`fb7b7e18`, `apps/lumina-runtime/src/runtime/ensureProjectIsolation.ts`)
- Runtime now records the manifest and lockfile fingerprint after a validated install so unchanged dependencies are not reinstalled. (`fb7b7e18`, `apps/lumina-runtime/src/runtime/ensureProjectIsolation.ts`)
- Tests were added for project isolation behavior around dependency preparation. (`fb7b7e18`, `apps/lumina-runtime/src/runtime/__tests__/ensureProjectIsolation.test.ts`)
- Runtime added project export implementation, zip writing, tests, and a project export route. (`62e19bff`, `apps/lumina-runtime/src/export/ProjectExport.ts`, `apps/lumina-runtime/src/export/ZipWriter.ts`, `apps/lumina-runtime/src/export/__tests__/ProjectExport.test.ts`, `apps/lumina-runtime/src/routes/projectExport.ts`)
- Builder added an export dialog and runtime project export service. (`62e19bff`, `apps/lumina-builder/src/components/export/ExportDialog.tsx`, `apps/lumina-builder/src/services/runtime/projectExport.ts`)
- Project export buttons were added to project cards and the Developer deck. (`62e19bff`, `apps/lumina-builder/src/components/workspaces/projects/sections/ProjectsSection.tsx`, `apps/lumina-builder/src/components/workspaces/developer/layout/DeveloperCommandDeck.tsx`)
- Export UI contracts and certified UI fixtures were added or updated for Developer, Export, and Projects surfaces. (`62e19bff`, `docs/ui-contracts/EXPORT_UI_CONTRACT.md`, `docs/ui-contracts/export-certified-ui.json`, `docs/ui-contracts/DEVELOPER_UI_CONTRACT.md`, `docs/ui-contracts/developer-certified-ui.json`, `docs/ui-contracts/PROJECTS_UI_CONTRACT.md`, `docs/ui-contracts/projects-certified-ui.json`)

## Decisions

- Project managers can download project exports on every plan under ADR-0047. (`62e19bff`)
- Runtime builds the project zip itself rather than relying only on the Builder client. (`62e19bff`, `apps/lumina-runtime/src/export/ProjectExport.ts`, `apps/lumina-runtime/src/export/ZipWriter.ts`)
- Project exports exclude every .env file except .env.example because .env files can hold keys. (`62e19bff`, `apps/lumina-runtime/src/export/ProjectExport.ts`)
- Project exports exclude dependencies, build output, .git, and symbolic links. (`62e19bff`, `apps/lumina-runtime/src/export/ProjectExport.ts`)
- Export zips are checked by an independent reader and by unzip. (`62e19bff`, `apps/lumina-runtime/src/export/__tests__/ProjectExport.test.ts`)
- The owner approved the export window and new buttons. (`62e19bff`)

## Lessons

- Synchronous dependency installation can freeze Runtime, the Executive Office, the dashboard, and screens for the full install duration. (`fb7b7e18`)
- The dependency check before installation also must not be synchronous. (`fb7b7e18`)
- Lovable projects installed from bun lockfiles can fail npm dependency checks. (`fb7b7e18`)
- Failed npm checks for bun-lockfile projects can cause dependencies to be deleted and reinstalled on every start. (`fb7b7e18`)
- Recording manifest and lockfile fingerprints after validated installs prevents repeated installs when dependencies are unchanged. (`fb7b7e18`, `apps/lumina-runtime/src/runtime/ensureProjectIsolation.ts`)
- Export functionality should be protected by UI contracts when adding new user-facing buttons. (`62e19bff`, `docs/ui-contracts/EXPORT_UI_CONTRACT.md`, `docs/ui-contracts/export-certified-ui.json`)

## Open risks

- Exported projects omit secret-bearing .env files, so customers must set secret configuration up again after download. (`62e19bff`, `apps/lumina-runtime/src/export/ProjectExport.ts`)
- Exported projects omit dependencies and build output, so customers must rebuild or reinstall outside KoreLumina. (`62e19bff`, `apps/lumina-runtime/src/export/ProjectExport.ts`)
- Exported projects omit .git, so repository history is not included in the downloaded zip. (`62e19bff`, `apps/lumina-runtime/src/export/ProjectExport.ts`)
- Exported projects omit symbolic links, so projects that rely on symlinks may need manual restoration after download. (`62e19bff`, `apps/lumina-runtime/src/export/ProjectExport.ts`)
