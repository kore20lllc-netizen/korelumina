# LR-2026-0051 — Repo Audit diagnosis access for Business and Enterprise

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: ebde217b..3c939d74

Source commits: 3c939d74

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-23

Learning cycle: learning-cycle:ccca4561a034632a · written by the Chief Agent (gpt-5.5)

---

## Summary

Repo Audit diagnosis was released to Business and Enterprise users with role-limited project visibility, scanning, export, and a Repair explanation path. Staff Repo Audit behavior remained unchanged, and the Repo Audit UI contract was recertified. Citations: 3c939d741394717b5f3a859b3e09772f1c559cac

## What changed

- Business and Enterprise users can reach Repo Audit from the sidebar. (`3c939d74`, `apps/lumina-builder/src/components/layout/Sidebar.tsx`)
- Business and Enterprise users see only their imported projects in Repo Audit. (`3c939d74`, `apps/lumina-builder/src/components/workspaces/repo-audit/state/useRepoAudit.ts`)
- Business and Enterprise users can scan and export Repo Audit reports. (`3c939d74`, `apps/lumina-builder/src/components/workspaces/repo-audit/RepoAuditWorkspace.tsx`, `apps/lumina-builder/src/components/workspaces/repo-audit/layout/RepoAuditCommandDeck.tsx`)
- Business and Enterprise users see a Repair section instead of the fix plan and deep audit. (`3c939d74`, `apps/lumina-builder/src/components/workspaces/repo-audit/sections/RepoAuditSections.tsx`)
- The Repair section explains that KoreLumina engineers plan and make fixes. (`3c939d74`, `apps/lumina-builder/src/components/workspaces/repo-audit/sections/RepoAuditSections.tsx`)
- Staff see Repo Audit unchanged. (`3c939d74`)
- Repo Audit access logic was added in a dedicated service. (`apps/lumina-builder/src/services/repoAuditAccess.ts`)
- Repo Audit page entry handling was updated. (`apps/lumina-builder/src/pages/Index.tsx`)
- The certified Repo Audit UI contract was updated. (`docs/ui-contracts/repo-audit-certified-ui.json`)

## Decisions

- ADR-0046 released Repo Audit diagnosis to Business and Enterprise. (`3c939d74`)
- ADR-0046 kept the staff Repo Audit view unchanged. (`3c939d74`)
- ADR-0046 chose to hide the fix plan and deep audit from Business and Enterprise. (`3c939d74`)
- The owner approved the Business and Enterprise Repo Audit view. (`3c939d74`)
- The Repo Audit UI contract was recertified after the role-specific view change. (`3c939d74`, `docs/ui-contracts/repo-audit-certified-ui.json`)

## Lessons

- Repo Audit role-gating is cross-cutting because this change touched navigation, page entry, access logic, workspace state, command controls, sections, and UI contract files. (`apps/lumina-builder/src/components/layout/Sidebar.tsx`, `apps/lumina-builder/src/pages/Index.tsx`, `apps/lumina-builder/src/services/repoAuditAccess.ts`, `apps/lumina-builder/src/components/workspaces/repo-audit/state/useRepoAudit.ts`, `apps/lumina-builder/src/components/workspaces/repo-audit/layout/RepoAuditCommandDeck.tsx`, `apps/lumina-builder/src/components/workspaces/repo-audit/sections/RepoAuditSections.tsx`, `docs/ui-contracts/repo-audit-certified-ui.json`)
- Role-specific UI changes should be recertified against the UI contract. (`3c939d74`, `docs/ui-contracts/repo-audit-certified-ui.json`)
- Business and Enterprise diagnosis access should preserve staff workflows when releasing a limited customer view. (`3c939d74`)

## Open risks

- Business and Enterprise users depend on KoreLumina engineers for repair planning and fixes. (`3c939d74`, `apps/lumina-builder/src/components/workspaces/repo-audit/sections/RepoAuditSections.tsx`)
- Business and Enterprise users do not receive the fix plan or deep audit in this release. (`3c939d74`)
