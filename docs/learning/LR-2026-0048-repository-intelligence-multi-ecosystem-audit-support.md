# LR-2026-0048 — Repository Intelligence multi-ecosystem audit support

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: e8cebedf..d42bfa5c

Source commits: 8078e633, d42bfa5c

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-23

Learning cycle: learning-cycle:1008f3c2386f6c97 · written by the Chief Agent (gpt-5.5)

---

## Summary

Repository Intelligence was expanded from Node-only understanding to recognised Python, Go, Rust, Java, Kotlin, .NET, PHP, Ruby, Swift, Dart, Flutter, C, and C++ ecosystems without executing repository code (d42bfa5c607d1da1412809b199243f41efd07d17). The work also added language-aware risk scanning, dependency checks, coverage-status reporting, and tests for broad ecosystem audits (apps/lumina-runtime/src/repository-intelligence/CodeRiskLanguages.ts; apps/lumina-runtime/src/repository-intelligence/EcosystemDependencyChecks.ts; apps/lumina-runtime/src/repository-intelligence/__tests__/AnyLanguageAudit.test.ts).

## What changed

- Repository Intelligence added ecosystem recognition and manifest handling for Python, Go, Rust, Java, Kotlin, .NET, PHP, Ruby, Swift, Dart, Flutter, C, and C++. (`d42bfa5c`, `apps/lumina-runtime/src/repository-intelligence/Ecosystems.ts`, `apps/lumina-runtime/src/repository-intelligence/ManifestParsers.ts`)
- Repository Intelligence added language-specific risky-code scanning using each language's comment and string syntax. (`d42bfa5c`, `apps/lumina-runtime/src/repository-intelligence/CodeRiskLanguages.ts`)
- Repository Intelligence added lockfile and version-constraint checks for recognised ecosystems. (`d42bfa5c`, `apps/lumina-runtime/src/repository-intelligence/EcosystemDependencyChecks.ts`)
- Repository Intelligence added partial and not-checked score-category reporting with reasons when only part of the code was covered. (`d42bfa5c`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAudit.ts`, `apps/lumina-runtime/src/repository-intelligence/RepositorySnapshot.ts`)
- Repository Intelligence added tests for any-language audits and ecosystem handling. (`d42bfa5c`, `apps/lumina-runtime/src/repository-intelligence/__tests__/AnyLanguageAudit.test.ts`, `apps/lumina-runtime/src/repository-intelligence/__tests__/Ecosystems.test.ts`)
- Workspace UI code for the in-house dashboard and mobile packaging card was removed. (`8078e633`, `apps/lumina-builder/src/components/workspaces/InHouseDevDashboard.tsx`, `apps/lumina-builder/src/components/workspaces/inhouse/MobilePackagingCard.tsx`)

## Decisions

- The audit reads manifests and configuration without executing repository code. (`8078e633`, `d42bfa5c`)
- Code with no manifest and languages not analyzed yet are named instead of guessed. (`8078e633`)
- Installed dependencies and build output from other ecosystems are skipped. (`8078e633`)
- Score categories are marked partial or not checked when audit coverage is incomplete. (`d42bfa5c`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAudit.ts`)

## Lessons

- The prior Node-only repository engine was too narrow for KoreLumina's repository-import use case. (`8078e633`, `d42bfa5c`)
- Future ecosystem additions should include tests like the any-language audit and ecosystem tests added here. (`apps/lumina-runtime/src/repository-intelligence/__tests__/AnyLanguageAudit.test.ts`, `apps/lumina-runtime/src/repository-intelligence/__tests__/Ecosystems.test.ts`)
- The first commit's message describes broad repository-intelligence package recognition, but its listed file changes are mainly workspace UI deletions and repo-audit state edits, so future records should verify scope against changed files. (`8078e633`, `apps/lumina-builder/src/components/workspaces/InHouseDevDashboard.tsx`, `apps/lumina-builder/src/components/workspaces/inhouse/MobilePackagingCard.tsx`, `apps/lumina-builder/src/components/workspaces/repo-audit/state/useRepoAudit.ts`)

## Open risks

- Some score categories can remain partial or not checked when the audit covers only part of the code. (`d42bfa5c`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAudit.ts`)
- Languages not analyzed yet are identified but not fully audited. (`8078e633`)
- Repositories with no manifest are named instead of guessed, leaving dependency understanding limited for those repositories. (`8078e633`)
- Skipping installed dependencies and build output can leave non-manifest artifacts outside the audit scope. (`8078e633`)
