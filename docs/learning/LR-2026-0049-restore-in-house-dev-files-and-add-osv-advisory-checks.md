# LR-2026-0049 — Restore In-House Dev files and add OSV advisory checks

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: d42bfa5c..2601a62f

Source commits: df7f7f0d, 2601a62f

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-23

Learning cycle: learning-cycle:78d145abc0d903e5 · written by the Chief Agent (gpt-5.5)

---

## Summary

The work restored In-House Dev workspace files after an earlier mistaken commit left a non-building checkout, as described in df7f7f0de58e23d38770ea1cca01507693cae1e9. The work also added OSV-based advisory checking across ecosystems using lockfile or exact-pinned versions in 2601a62fb4bca0b433cd23c8def7092bed7264a2.

## What changed

- The In-House Dev dashboard file was restored. (`df7f7f0d`, `apps/lumina-builder/src/components/workspaces/InHouseDevDashboard.tsx`)
- The mobile packaging card for the In-House Dev workspace was restored. (`df7f7f0d`, `apps/lumina-builder/src/components/workspaces/inhouse/MobilePackagingCard.tsx`)
- The Index page was rewired back to the restored In-House Dev files. (`df7f7f0d`, `apps/lumina-builder/src/pages/Index.tsx`)
- Repository audit state changes from the mistaken commit were removed. (`df7f7f0d`, `apps/lumina-builder/src/components/workspaces/repo-audit/state/useRepoAudit.ts`)
- Lockfile and exact-pin version extraction was added for repository intelligence. (`2601a62f`, `apps/lumina-runtime/src/repository-intelligence/LockfileVersions.ts`)
- OSV advisory querying was added for repository intelligence. (`2601a62f`, `apps/lumina-runtime/src/repository-intelligence/OsvAdvisories.ts`)
- Repository audits now include OSV advisory results. (`2601a62f`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAudit.ts`)
- OSV advisory behavior was covered by tests. (`2601a62f`, `apps/lumina-runtime/src/repository-intelligence/__tests__/OsvAdvisories.test.ts`)

## Decisions

- The team restored the In-House Dev files because commit 8078e633 had committed those changes by mistake and produced a checkout that did not build. (`df7f7f0d`)
- The new console was kept in .git/ms11d.patch until MS-2026-0015. (`df7f7f0d`)
- OSV was chosen for advisory checks because npm audit covers Node only. (`2601a62f`)
- The runtime sends only package names and versions to OSV. (`2601a62f`, `apps/lumina-runtime/src/repository-intelligence/OsvAdvisories.ts`)
- Each vulnerable package is reported with worst severity, CVE aliases, and fixed versions. (`2601a62f`, `apps/lumina-runtime/src/repository-intelligence/OsvAdvisories.ts`)
- Packages without exact versions are named in the security category instead of being reported clean. (`2601a62f`)
- Ecosystems not covered by OSV are named in the security category instead of being reported clean. (`2601a62f`)
- An unreachable OSV service is named in the security category instead of causing a clean result. (`2601a62f`)
- KORELUMINA_OSV_ADVISORIES=off disables OSV advisory checking. (`2601a62f`)

## Lessons

- A commit can become non-buildable when it rewires Index.tsx and deletes an old dashboard without including the replacement console files. (`df7f7f0d`, `apps/lumina-builder/src/pages/Index.tsx`)
- Repository Intelligence work should not be mixed with In-House Dev workspace changes in the same mistaken commit. (`df7f7f0d`)
- Cross-ecosystem vulnerability reporting needs exact versions from lockfiles or exact pins. (`2601a62f`, `apps/lumina-runtime/src/repository-intelligence/LockfileVersions.ts`)
- Security audits should distinguish unsupported or unreachable advisory coverage from a clean result. (`2601a62f`)
- Adding focused tests for advisory handling is part of the OSV integration work. (`2601a62f`, `apps/lumina-runtime/src/repository-intelligence/__tests__/OsvAdvisories.test.ts`)

## Open risks

- The new console was not yet landed and remained in .git/ms11d.patch until MS-2026-0015. (`df7f7f0d`)
- Packages without exact versions cannot be checked as clean by the OSV advisory path. (`2601a62f`)
- Ecosystems that OSV does not cover remain security-category findings rather than clean results. (`2601a62f`)
- An unreachable OSV service prevents advisory coverage from being reported as clean. (`2601a62f`)
- OSV advisory coverage can be disabled with KORELUMINA_OSV_ADVISORIES=off. (`2601a62f`)
