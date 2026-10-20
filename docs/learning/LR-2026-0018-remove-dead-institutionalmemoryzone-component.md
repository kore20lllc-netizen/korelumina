# LR-2026-0018 — Remove dead InstitutionalMemoryZone component

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 6798557e..49af80ff

Source commits: 49af80ff

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-20

Learning cycle: learning-cycle:f2207f49381201c6 · written by the Chief Agent (gpt-5.5)

---

## Summary

The Builder work removed the unused InstitutionalMemoryZone TSX component after its syntax error hid broader type-checking failures. After removal, tsc surfaced 384 Builder type errors, mainly from missing @types/react and @types/react-dom, and build-time type-check gating was left for a separate mission. [49af80ffc50ae5f93785b03e626324bb2bba3e70]

## What changed

- The file InstitutionalMemoryZone.tsx was deleted from the Builder knowledge-v3 canvas orchestration components. (`49af80ff`)
- The deletion removed 138 lines from InstitutionalMemoryZone.tsx. (`49af80ff`)
- The component was removed because nothing imported it. (`49af80ff`)
- The component was removed because its syntax error made tsc skip type checking for the whole Builder. (`49af80ff`)

## Decisions

- The team chose to remove the dead InstitutionalMemoryZone component rather than keep unused broken code. (`49af80ff`)
- The team decided that making the Builder typecheck and gating the build on typechecking would be handled as its own mission. (`49af80ff`)

## Lessons

- Vite build did not typecheck the Builder, so the syntax error in InstitutionalMemoryZone.tsx went unnoticed. (`49af80ff`)
- Removing one dead file exposed wider Builder type-checking problems that had been hidden. (`49af80ff`)
- Unused components should still be caught by typechecking because their syntax errors can affect the whole Builder typecheck. (`49af80ff`)

## Open risks

- After the dead component was removed, tsc still reported 384 Builder type errors. (`49af80ff`)
- Most reported Builder type errors were attributed to missing @types/react and @types/react-dom. (`49af80ff`)
- The Builder build was not yet gated on typechecking in this work. (`49af80ff`)
