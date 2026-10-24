# LR-2026-0052 — Repo Audit landing page wording aligned to ADR-0046

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 3c939d74..85b14433

Source commits: 85b14433

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-23

Learning cycle: learning-cycle:71f7ba612ad039d3 · written by the Chief Agent (gpt-5.5)

---

## Summary

Commit 85b14433bf82ded94df3176bd69b7fa3f017d8e7 changed the landing page Repo Audit messaging so Business and Enterprise customers diagnose imported repositories and KoreLumina engineers repair them. Commit 85b14433bf82ded94df3176bd69b7fa3f017d8e7 also added pricing FAQ support for that division of responsibility.

## What changed

- The Repo Audit landing section was changed from promising an AI repair plan and one-click fixes to describing repository diagnosis for Business and Enterprise customers. (`85b14433`, `apps/lumina-builder/src/components/landing/RepoAuditFeature.tsx`)
- The Repo Audit workflow and locked-state copy were updated to say that KoreLumina engineers perform repairs. (`85b14433`, `apps/lumina-builder/src/components/landing/RepoAuditFeature.tsx`)
- The Run a Repo Audit button copy was updated to match the diagnosis-and-engineer-repair model. (`85b14433`, `apps/lumina-builder/src/components/landing/RepoAuditFeature.tsx`)
- A pricing FAQ entry was added to explain the diagnosis-and-engineer-repair model. (`85b14433`, `apps/lumina-builder/src/components/landing/Pricing.tsx`)

## Decisions

- The product wording follows ADR-0046 by assigning repository diagnosis to customers and repository repair to KoreLumina engineers. (`85b14433`)
- The landing page no longer positions Repo Audit as an AI repair plan or one-click-fix capability. (`85b14433`, `apps/lumina-builder/src/components/landing/RepoAuditFeature.tsx`)

## Lessons

- Landing page capability claims must be checked against ADR-0046 before publication. (`85b14433`)
- Repo Audit messaging needs consistency across the feature section, CTA copy, locked-state copy, and pricing FAQ. (`85b14433`, `apps/lumina-builder/src/components/landing/RepoAuditFeature.tsx`, `apps/lumina-builder/src/components/landing/Pricing.tsx`)

## Open risks

- The provided window does not show whether other pages still mention AI repair plans or one-click fixes. (`85b14433`)
