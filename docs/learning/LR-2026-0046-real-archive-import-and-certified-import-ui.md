# LR-2026-0046 — Real archive import and certified Import UI

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: d84e009f..71cd5f33

Source commits: 71cd5f33

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-22

Learning cycle: learning-cycle:fc941c49e573ab85 · written by the Chief Agent (gpt-5.5)

---

## Summary

ZIP and folder imports changed from simulated behavior to real archive extraction and browser-side folder packaging (71cd5f332418e718311dd92c6d8b18e933b05af9; apps/lumina-runtime/src/import/ArchiveExtract.ts; apps/lumina-builder/src/services/folderArchive.ts). The Import window was restyled for the Knowledge Operations design and protected by a build-time UI contract (71cd5f332418e718311dd92c6d8b18e933b05af9; docs/ui-contracts/IMPORT_UI_CONTRACT.md; scripts/import-ui-contract.mjs).

## What changed

- Runtime now unpacks .zip, .tar.gz, and .tgz uploads instead of only simulating ZIP import. (`71cd5f33`, `apps/lumina-runtime/src/import/ArchiveExtract.ts`, `apps/lumina-runtime/src/import/importArchive.ts`)
- Archive extraction now checks entries for escaping paths, links, special files, encrypted entries, and expansion bombs before unpacking. (`71cd5f33`, `apps/lumina-runtime/src/import/ArchiveExtract.ts`)
- Rejected archive imports are staged in a folder that is discarded on refusal. (`71cd5f33`, `apps/lumina-runtime/src/import/ArchiveExtract.ts`, `apps/lumina-runtime/src/import/importArchive.ts`)
- The folder import tab now packs the selected folder as a .tar.gz in the browser. (`71cd5f33`, `apps/lumina-builder/src/services/folderArchive.ts`)
- Archive import behavior is covered by tests. (`apps/lumina-runtime/src/import/__tests__/ArchiveImport.test.ts`)
- Runtime startup now logs whether sign-ins can be verified. (`71cd5f33`, `apps/lumina-runtime/src/index.ts`)
- Runtime now refuses to start silently when the requested port is already taken. (`71cd5f33`, `apps/lumina-runtime/src/index.ts`)
- Failed imports now log scrubbed git output. (`71cd5f33`, `apps/lumina-runtime/src/routes/importProject.ts`)
- npm run dev now stops every process it started. (`71cd5f33`, `scripts/dev-supervisor.mjs`, `package.json`)
- The Import window was restyled in the Knowledge Operations design. (`71cd5f33`, `apps/lumina-builder/src/components/import/ImportModal.tsx`)
- A build-time UI contract now guards the certified Import window. (`71cd5f33`, `docs/ui-contracts/IMPORT_UI_CONTRACT.md`, `docs/ui-contracts/import-certified-ui.json`, `scripts/import-ui-contract.mjs`)

## Decisions

- The owner approved the Import window restyled in the Knowledge Operations design. (`71cd5f33`)
- The import implementation rejects unsafe archive entries before extraction instead of unpacking first. (`71cd5f33`, `apps/lumina-runtime/src/import/ArchiveExtract.ts`)
- The folder upload path uses browser-side .tar.gz packaging for folder imports. (`71cd5f33`, `apps/lumina-builder/src/services/folderArchive.ts`)
- The certified Import UI is enforced through a UI contract in the build. (`71cd5f33`, `scripts/import-ui-contract.mjs`, `docs/ui-contracts/import-certified-ui.json`)

## Lessons

- Import tabs can appear complete while only simulating behavior, so runtime import paths need end-to-end implementation. (`71cd5f33`, `apps/lumina-runtime/src/import/importArchive.ts`, `apps/lumina-builder/src/services/folderArchive.ts`)
- Archive import needs refusal checks for path escaping, links, special files, encrypted entries, and expansion bombs. (`71cd5f33`, `apps/lumina-runtime/src/import/ArchiveExtract.ts`)
- Failed imports need scrubbed git output in logs for diagnosis. (`71cd5f33`, `apps/lumina-runtime/src/routes/importProject.ts`)
- Development supervisors should stop every process they start. (`71cd5f33`, `scripts/dev-supervisor.mjs`)
- Certified UI work should include a machine-checkable UI contract. (`71cd5f33`, `docs/ui-contracts/IMPORT_UI_CONTRACT.md`, `scripts/import-ui-contract.mjs`)
