# CLAUDE.md — Working Boundary for Claude in KoreLumina

This file tells Claude (Claude Code) how to work in this repository.
It applies `docs/constitution/AI_GOVERNANCE.md`,
`docs/architecture/KORELUMINA_RECONSTRUCTION_RULES.md` and
`docs/engineering/KORELUMINA_ENGINEERING_WORKFLOW_STANDARD.md` to day-to-day work.
If anything here conflicts with the Canon or the Constitution, they win.

Principle: **Claude advises and implements. The repository owner decides.**

---

## 1. Read before working

At the start of every session, read:

1. `CONTINUATION_CONTEXT.md` — current phase, known-good state, next tasks
2. `docs/canon/VISION_2050.md` and `BLUEPRINT.md` — direction and domains
3. `GOVERNANCE.md` — Definition of Done
4. The ticket or handoff being worked on (e.g. `docs/handoffs/`)

## 2. Operating modes

The owner states the mode. If unclear, Claude asks.

- **Architecture Mode** — planning, reviews, audits, specs. Claude writes no production code.
- **Implementation Mode** — one ticket at a time: investigate, implement, build, validate, then propose a commit.

## 3. Claude MAY do without asking

- Read any file, search the codebase, inspect git history
- Run read-only commands (`git status`, `git log`, `git diff`, `ls`, `grep`, `tools/reconstruction/inspect.sh`)
- Run builds, type checks and validation commands
- Start the local dev servers listed in `CONTINUATION_CONTEXT.md`
- Edit files that belong to the **current, owner-approved ticket**
- Draft documentation, specs, EDRs and handoffs (as drafts for review)

## 4. Claude MUST ASK FIRST

- Starting a new ticket, or touching files outside the current ticket's scope
- Choosing PATCH vs FULL FILE REWRITE when the 20% rule is borderline
- Installing, removing or upgrading dependencies
- Creating, switching or deleting branches
- Every `git commit` (show the diff summary and message first)
- Every `git push`, and opening or merging pull requests
- Deleting or moving any file or folder
- Any change to `docs/canon/`, `docs/constitution/`, `BLUEPRINT.md`, `GOVERNANCE.md`
- Any new platform domain, strategic asset or architectural concept (needs an EDR — Architecture Baseline 1.0 is frozen)
- Stopping or killing running processes
- Running anything against external services (Supabase, deploy targets, APIs)

## 5. Claude NEVER does

- Approve its own architectural changes or modify governance on its own
- Push to `main`, force-push, rewrite history, or `git reset --hard` shared branches
- Read, print, copy or commit secrets (`.env` values, keys, tokens)
- Mix multiple architectural responsibilities in one ticket
- Patch speculative problems or fix symptoms without a root cause
- Break the Builder or Preview, or spawn duplicate runtimes / new ports
- Leave half-migrated files or transitional public APIs
- Claim something works without running the build and validating it
- Use throwaway utilities in `/tmp` for reconstruction work (use `tools/reconstruction/`)

## 6. Ticket workflow

1. **Investigate** — read the minimum context; identify root cause, scope, ownership
2. **Report** — state root cause and the proposed strategy (PATCH or FULL REWRITE) and wait for "go"
3. **Implement** — only the approved scope
4. **Build** — run the relevant build commands
5. **Validate** — runtime, UI, API and preview checks as applicable (green build alone is not enough)
6. **Summarize** — what changed, evidence it works, what knowledge was preserved
7. **Commit** — only after owner approval, with a message describing architectural intent

## 7. Validation commands

```bash
npm --workspace apps/lumina-runtime run build
npm --workspace apps/lumina-runtime run dev
npm --workspace apps/lumina-builder run dev
curl "http://localhost:4100/api/runtime/status?projectId=elegance-sync-app"
```

## 8. Definition of Done (from GOVERNANCE.md)

Implementation complete, validation passed, documentation updated,
recovery guidance exists, knowledge preserved, Blueprint traceability noted.

## 9. Communication

- Be explicit about what was verified and what was not
- When unsure, stop and ask rather than guess
- Flag any conflict between documents instead of silently choosing one
