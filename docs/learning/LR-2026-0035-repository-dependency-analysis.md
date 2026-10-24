# LR-2026-0035 — Repository dependency analysis

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 60bb546c..2f2bc9f7

Source commits: 2f2bc9f7

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-21

Learning cycle: learning-cycle:95e868b749d4ee1e · written by the Chief Agent (gpt-5.5)

---

## Summary

Repository Intelligence added dependency analysis with stable finding records and source-based import extraction. The analyzer covers undeclared, hoisted, unused, duplicated, unpinned, remote, lockfile, and npm-ci consistency dependency issues. Sources: 2f2bc9f7ad51ce2da153da2eac822cf540dceb4f, apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts, apps/lumina-runtime/src/repository-intelligence/SourceImports.ts

## What changed

- Repository Intelligence added dependency analysis for repository dependencies. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts`)
- Repository findings now use one shared shape with a stable ID and evidence. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/RepositoryFinding.ts`)
- Import detection now reads imports from code only. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/SourceImports.ts`)
- Comments, string literals, and generated code in template strings no longer count as imports. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/SourceImports.ts`)
- Project aliases are recognized as whole path segments. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/SourceImports.ts`)
- The dependency analyzer reports undeclared imports with severity based on product, test, tooling, and archived code context. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts`)
- The dependency analyzer reports reliance on root hoisting. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts`)
- The dependency analyzer reports undeclared workspace packages. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts`)
- The dependency analyzer reports possibly unused dependencies while excluding peers of used packages and commands run by scripts. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts`)
- The dependency analyzer reports dependencies declared twice. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts`)
- The dependency analyzer reports unpinned and remote dependency sources. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts`)
- The dependency analyzer reports missing or conflicting lockfiles. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts`)
- The dependency analyzer reports npm lockfiles that disagree with package.json as npm ci would. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts`)
- Repository inventory was extended for dependency analysis support. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/RepositoryInventory.ts`)
- Repository Intelligence exports were updated for the new dependency analysis functionality. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/index.ts`)
- Automated tests were added for dependency analysis. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/__tests__/DependencyAnalysis.test.ts`)

## Decisions

- The implementation chose a shared RepositoryFinding shape with stable IDs and evidence for dependency findings. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/RepositoryFinding.ts`)
- The implementation chose source-code import extraction instead of counting comments, string literals, or generated code in template strings. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/SourceImports.ts`)
- The implementation chose whole-path-segment recognition for project aliases. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/SourceImports.ts`)
- The implementation chose npm-ci-style comparison when checking whether npm lockfiles disagree with package.json. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts`)

## Lessons

- Dependency import analysis should ignore comments, string literals, and generated code in template strings to avoid counting non-code references as imports. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/SourceImports.ts`)
- Project alias matching should use whole path segments to avoid partial alias matches. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/SourceImports.ts`)
- Possibly unused dependency checks should exclude peers of used packages and commands run by scripts. (`2f2bc9f7`, `apps/lumina-runtime/src/repository-intelligence/DependencyAnalysis.ts`)
- The dependency analyzer was checked by hand on the KoreLumina repository and an imported customer app. (`2f2bc9f7`)
