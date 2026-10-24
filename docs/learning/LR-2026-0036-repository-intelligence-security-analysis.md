# LR-2026-0036 — Repository Intelligence security analysis

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 2f2bc9f7..927498fc

Source commits: 927498fc

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-22

Learning cycle: learning-cycle:ed7e605e0d09b2b5 · written by the Chief Agent (gpt-5.5)

---

## Summary

Commit 927498fc1a15c52721542ac4018c28e0b1de8091 added Repository Intelligence scans for secrets, risky code, and npm advisories. The work reports secret findings without values, treats failed advisory checks as unavailable, and was hand-checked on the KoreLumina repository and an imported customer app.

## What changed

- Added Repository Intelligence security analysis covering secrets, risky code, and npm advisories. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/SecretScan.ts`, `apps/lumina-runtime/src/repository-intelligence/CodeRiskScan.ts`, `apps/lumina-runtime/src/repository-intelligence/AdvisoryAudit.ts`)
- Secret scanning recognizes 17 credential formats and committed environment files. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/SecretScan.ts`)
- Supabase keys are decoded so only service_role keys are flagged. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/SecretScan.ts`)
- Secret findings include file, line, and kind, but never the secret value. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/SecretScan.ts`)
- Risky-code scanning detects eval, new Function, raw HTML, variable-built shell commands, shell: true, disabled TLS checks, open CORS, Math.random for secrets, and SQL built from interpolated values. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/CodeRiskScan.ts`)
- Risky-code matches are limited to code, and process-related rules are gated on child_process. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/CodeRiskScan.ts`)
- Advisory auditing runs npm audit against the registry. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/AdvisoryAudit.ts`)
- Security analysis test coverage was added. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/__tests__/SecurityAnalysis.test.ts`)

## Decisions

- Advisory checks that cannot run are reported as unavailable with their reason, not as clean. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/AdvisoryAudit.ts`)
- Secret scan output intentionally excludes secret values from findings. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/SecretScan.ts`)
- Supabase detection intentionally flags service_role keys only after decoding. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/SecretScan.ts`)
- Process-risk rules require child_process context. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/CodeRiskScan.ts`)

## Lessons

- Security scan behavior was checked by hand on both the KoreLumina repository and an imported customer app. (`927498fc`)
- Advisory scanning must distinguish unavailable audit execution from a clean result. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/AdvisoryAudit.ts`)
- Secret findings should identify location and kind without exposing credential values. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/SecretScan.ts`)

## Open risks

- npm audit can be unavailable when it cannot run, leaving advisory results unavailable rather than clean. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/AdvisoryAudit.ts`)
- Secret detection is limited to the 17 recognizable credential formats implemented in the scan. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/SecretScan.ts`)
- Risky-code detection is limited to matches in code. (`927498fc`, `apps/lumina-runtime/src/repository-intelligence/CodeRiskScan.ts`)
