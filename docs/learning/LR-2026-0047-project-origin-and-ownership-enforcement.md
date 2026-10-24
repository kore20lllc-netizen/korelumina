# LR-2026-0047 — Project origin and ownership enforcement

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 71cd5f33..e8cebedf

Source commits: e8cebedf

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-22

Learning cycle: learning-cycle:66554f01af58ada3 · written by the Chief Agent (gpt-5.5)

---

## Summary

Runtime now records where imported projects came from and enforces ownership on project metadata changes (e8cebedf55d4fba84bfe742076fd0b84d1666575). The work fixed a metadata route takeover risk where the browser could submit any owner without a check (e8cebedf55d4fba84bfe742076fd0b84d1666575).

## What changed

- Runtime records project origin for imports as a git host and URL or an uploaded archive. (`e8cebedf`, `apps/lumina-runtime/src/projects/projectOrigin.ts`)
- Runtime resolves older git imports from their source URL. (`e8cebedf`, `apps/lumina-runtime/src/import/importRepository.ts`)
- Imported projects are owned by the caller who imports them. (`e8cebedf`, `apps/lumina-runtime/src/projects/projectOwnership.ts`, `apps/lumina-runtime/src/routes/importProject.ts`)
- Project metadata changes now enforce owner or admin access for owned projects. (`e8cebedf`, `apps/lumina-runtime/src/routes/projectMetadata.ts`, `apps/lumina-runtime/src/projects/projectOwnership.ts`)
- Unowned projects are claimed only by the signed-in caller. (`e8cebedf`, `apps/lumina-runtime/src/routes/projectMetadata.ts`, `apps/lumina-runtime/src/projects/projectOwnership.ts`)
- Metadata merges preserve existing owner and team fields. (`e8cebedf`, `apps/lumina-runtime/src/projects/projectMetadataStore.ts`)
- Project listing now includes origin data. (`e8cebedf`, `apps/lumina-runtime/src/projects/listProjects.ts`)
- Tests were added for project origin and ownership behavior. (`e8cebedf`, `apps/lumina-runtime/src/projects/__tests__/ProjectOriginAndOwnership.test.ts`)

## Decisions

- The system records project origin because diagnosis and paid repair are for imported projects. (`e8cebedf`)
- The importer becomes the owner of an imported project. (`e8cebedf`)
- Owned projects can be changed only by their owner or an admin. (`e8cebedf`)
- Merges must not erase owner or team metadata. (`e8cebedf`, `apps/lumina-runtime/src/projects/projectMetadataStore.ts`)

## Lessons

- Accepting an owner value from the browser without checking access allowed project takeover. (`e8cebedf`, `apps/lumina-runtime/src/routes/projectMetadata.ts`)
- Ownership checks belong in the runtime metadata path, not in browser-provided fields. (`e8cebedf`, `apps/lumina-runtime/src/routes/projectMetadata.ts`, `apps/lumina-runtime/src/projects/projectOwnership.ts`)
- Backward compatibility was needed for older git imports that only had a source URL. (`e8cebedf`, `apps/lumina-runtime/src/import/importRepository.ts`)
- Origin and ownership behavior should stay covered by tests. (`apps/lumina-runtime/src/projects/__tests__/ProjectOriginAndOwnership.test.ts`)
