# LR-2026-0019 — Executive Office section height and internal scrolling

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 49af80ff..b60464bb

Source commits: b60464bb

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-20

Learning cycle: learning-cycle:da7e8038e1277471 · written by the Chief Agent (gpt-5.5)

---

## Summary

Executive Office sections were standardized to 680 px height in both columns, with fixed headers and scrollable panel content, by changing the shared ExecutiveSection wrapper. [b60464bbfa3b7ec07447f4fb14f75c07b3f999aa; apps/lumina-builder/src/components/workspaces/executive/shared/ExecutiveSection.tsx] The fix addressed content-driven row stretching, office displacement, and uneven rows. [b60464bbfa3b7ec07447f4fb14f75c07b3f999aa]

## What changed

- Executive Office sections now use the same 680 px height in both columns. (`b60464bb`, `apps/lumina-builder/src/components/workspaces/executive/shared/ExecutiveSection.tsx`)
- Executive Office section headers stay in place while section content scrolls inside the panel. (`b60464bb`, `apps/lumina-builder/src/components/workspaces/executive/shared/ExecutiveSection.tsx`)
- The section scroll behavior uses the Knowledge Operations scroll pattern with contained overscroll, stable gutter, and shared scrollbar. (`b60464bb`, `apps/lumina-builder/src/components/workspaces/executive/shared/ExecutiveSection.tsx`)
- The certified Executive Office UI contract was updated for this presentation change. (`b60464bb`, `docs/ui-contracts/executive-office-certified-ui.json`)

## Decisions

- The implementation fixed all twelve Executive Office sections through the shared section wrapper instead of separate per-section changes. (`b60464bb`, `apps/lumina-builder/src/components/workspaces/executive/shared/ExecutiveSection.tsx`)
- The owner visually approved the presentation before it was certified. (`b60464bb`, `docs/ui-contracts/executive-office-certified-ui.json`)

## Lessons

- Content-driven section height caused long sections to stretch their row and push the office down. (`b60464bb`)
- Content-driven section height caused short sections to leave uneven rows. (`b60464bb`)
- Using the shared section wrapper was sufficient to apply the layout fix across all twelve sections. (`b60464bb`, `apps/lumina-builder/src/components/workspaces/executive/shared/ExecutiveSection.tsx`)
