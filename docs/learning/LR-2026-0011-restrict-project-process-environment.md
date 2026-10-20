# LR-2026-0011 — Restrict project process environment

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: a978fe02..a299d7a5

Source commits: a299d7a5

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-19

Learning cycle: learning-cycle:c21a7c56f55422bd · written by the Chief Agent (gpt-5.5)

---

## Summary

Runtime previously spread its whole environment into project processes, exposing platform AI keys and Runtime tokens to project code; project processes now receive an allowlisted environment instead. a299d7a54dcabe42f35e87079034b5ef7cbe0cd3 The change added tests and runtime code for project process environment isolation. a299d7a54dcabe42f35e87079034b5ef7cbe0cd3

## What changed

- Project processes no longer receive Runtime's full environment. (`a299d7a5`)
- Dependency install, dependency health checks, and the dev server now receive an allowlisted environment instead of Runtime's full environment. (`a299d7a5`)
- The allowlist includes paths and home, tool locations, temp, locale and terminal, registry proxy and CA settings, Windows system paths, and the launcher's own settings. (`a299d7a5`)
- Secrets, npm_config_*, and NODE_OPTIONS stay in Runtime. (`a299d7a5`)
- A project process environment module was added. (`apps/lumina-runtime/src/runtime/projectProcessEnvironment.ts`)
- Project process environment tests were added. (`apps/lumina-runtime/src/runtime/__tests__/projectProcessEnvironment.test.ts`)
- Runtime process launching was changed to use the restricted project environment. (`apps/lumina-runtime/src/runtime/startup/RuntimeProcessLauncher.ts`)
- Project isolation code was updated with the environment restriction. (`apps/lumina-runtime/src/runtime/ensureProjectIsolation.ts`)

## Decisions

- The team chose an allowlist model for project process environment variables. (`a299d7a5`)
- The allowlist was chosen because a probe project launched through the real launcher could read OPENAI_API_KEY, ANTHROPIC_API_KEY, KORELUMINA_RUNTIME_INTERNAL_TOKEN, and GITHUB_TOKEN. (`a299d7a5`)
- Private registry access remains outside the Runtime secret environment and uses the user's own ~/.npmrc. (`a299d7a5`)
- Project-owned keys are expected to be provided by the project's own .env. (`a299d7a5`)

## Lessons

- Spreading Runtime's whole environment into project processes exposed platform secrets to imported or customer projects. (`a299d7a5`)
- A probe project started through the real launcher was effective at detecting secret leakage. (`a299d7a5`)
- The same probe saw none of the listed Runtime secrets after the allowlisted environment change. (`a299d7a5`)
- Future Runtime launch paths should avoid inheriting ambient Runtime environment variables into project code. (`a299d7a5`)
