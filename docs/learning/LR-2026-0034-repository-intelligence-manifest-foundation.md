# LR-2026-0034 — Repository Intelligence manifest foundation

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 40fa1794..60bb546c

Source commits: 60bb546c

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-21

Learning cycle: learning-cycle:f3e13fb9ad9560c4 · written by the Chief Agent (gpt-5.5)

---

## Summary

Commit 60bb546cb246635ac29193d7ffb52b12cf1f666f added the first part of a Repo Audit engine. The work added deterministic repository snapshots, repository inventory, manifest storage, and tests in apps/lumina-runtime/src/repository-intelligence/__tests__/RepositoryIntelligence.test.ts.

## What changed

- Added a repository-intelligence module for snapshots, inventory, manifests, stores, gitignore handling, and git index handling. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/index.ts`)
- Implemented repository snapshots that list files with content hashes while skipping generated folders and git-ignored files. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/RepositorySnapshot.ts`)
- Implemented gitignore parsing following gitignore(5) rules. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/GitIgnore.ts`)
- Implemented tracked file discovery from .git/index without running git. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/GitIndex.ts`)
- Implemented repository inventory for languages, package manager and lockfile conflicts, workspace packages, frameworks, tooling, entry points, config files, environment files, and documentation files. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/RepositoryInventory.ts`)
- Implemented repository intelligence manifests stored per project and snapshot. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/RepositoryIntelligenceManifest.ts`, `apps/lumina-runtime/src/repository-intelligence/RepositoryIntelligenceStore.ts`)
- Added repository intelligence tests. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/__tests__/RepositoryIntelligence.test.ts`)

## Decisions

- Snapshots use file content hashes so the same commit yields the same manifest. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/RepositorySnapshot.ts`)
- The implementation avoids invoking git and reads tracked files from .git/index instead. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/GitIndex.ts`)
- .env content is never kept in memory. (`60bb546c`)
- Manifests are stored per project and snapshot. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/RepositoryIntelligenceStore.ts`)

## Lessons

- Reading .git/index and applying gitignore(5) rules matched git's file list exactly on the KoreLumina repository. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/GitIndex.ts`, `apps/lumina-runtime/src/repository-intelligence/GitIgnore.ts`)
- Repository intelligence should treat environment files as sensitive inputs and avoid retaining .env content. (`60bb546c`)
- Deterministic manifests depend on excluding generated folders and git-ignored files from snapshots. (`60bb546c`, `apps/lumina-runtime/src/repository-intelligence/RepositorySnapshot.ts`)

## Open risks

- The Repo Audit engine is only at its first part after this work. (`60bb546c`)
- The evidence does not include an executive approval or ADR for the repository intelligence design. (`60bb546c`)
