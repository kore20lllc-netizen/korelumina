# LR-2026-0040 — Repository Audit API

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 7dde6b32..11750d34

Source commits: 11750d34

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-22

Learning cycle: learning-cycle:4087d7c12e11b4c2 · written by the Chief Agent (gpt-5.5)

---

## Summary

The work added a Repository Audit API for starting scans or deep audits, streaming progress, and reading reports, history, and fix plans. 11750d34063cc08fd84001133532e82fbb04b3c3 The work also changed repository snapshot and secret scan behavior to pause every 100 files, reducing the longest Runtime stall during an audit on the KoreLumina repository from 4.1 s to 0.87 s. 11750d34063cc08fd84001133532e82fbb04b3c3

## What changed

- Added repository audit run support in the Runtime through new RepositoryAuditRuns code and route wiring. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAuditRuns.ts`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`, `apps/lumina-runtime/src/index.ts`)
- Added POST /api/runtime/repository-audit/runs to start a repository scan or a deep audit. (`11750d34`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`)
- Added server-sent event progress streaming with full replay for late viewers. (`11750d34`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAuditRuns.ts`)
- Added read access for latest report, history, individual reports, and fix plans for callers who can view the project. (`11750d34`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`)
- Changed fix plans to list remedies for real findings by rule without applying fixes automatically. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAudit.ts`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`)
- Changed repository snapshot scanning to pause every 100 files. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/RepositorySnapshot.ts`)
- Changed secret scanning to pause every 100 files. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/SecretScan.ts`)
- Added tests for repository audit routes. (`11750d34`, `apps/lumina-runtime/src/routes/__tests__/repositoryAudit.test.ts`)
- Added SecurityAnalysis test coverage related to repository intelligence changes. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/__tests__/SecurityAnalysis.test.ts`)

## Decisions

- Only callers who can manage the project can start a deep audit because a deep audit runs project code. (`11750d34`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`)
- The system allows only one audit per project at a time. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAuditRuns.ts`)
- An audit is not run inside its request. (`11750d34`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAuditRuns.ts`)
- Fix plans do not apply changes automatically. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAudit.ts`)
- Progress is streamed as server-sent events and replayed in full to late viewers. (`11750d34`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`)
- Snapshot and secret scan work pauses every 100 files to reduce Runtime stalls during audits. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/RepositorySnapshot.ts`, `apps/lumina-runtime/src/repository-intelligence/SecretScan.ts`)

## Lessons

- Yielding during snapshot and secret scans reduced the KoreLumina repository audit's longest Runtime stall from 4.1 s to 0.87 s. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/RepositorySnapshot.ts`, `apps/lumina-runtime/src/repository-intelligence/SecretScan.ts`)
- Audit start requests should enqueue or start background work rather than running the audit inside the request. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAuditRuns.ts`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`)
- Late viewers need full progress replay for repository audits. (`11750d34`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`)
- Fix planning should separate recommendations from automatic mutation. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAudit.ts`)

## Open risks

- Deep audits run project code, so authorization for deep audit starts remains security-sensitive. (`11750d34`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`)
- Fix plans apply nothing automatically, so remediation still requires a separate manual or future execution path. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAudit.ts`)
- Only one audit can run per project at a time, so concurrent audit demand for the same project is intentionally constrained. (`11750d34`, `apps/lumina-runtime/src/repository-intelligence/RepositoryAuditRuns.ts`)
- Project viewers can read reports, history, and fix plans, so audit output visibility depends on project view permissions. (`11750d34`, `apps/lumina-runtime/src/routes/repositoryAudit.ts`)
