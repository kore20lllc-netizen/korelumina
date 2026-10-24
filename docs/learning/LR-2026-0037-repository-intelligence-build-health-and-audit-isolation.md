# LR-2026-0037 — Repository Intelligence build health and audit isolation

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 927498fc..0f131b29

Source commits: 0f131b29

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-22

Learning cycle: learning-cycle:825ddc47c7f7f8ec · written by the Chief Agent (gpt-5.5)

---

## Summary

Repository Intelligence gained opt-in build-health checks that run project typecheck and build scripts with bounded execution controls, based on 0f131b2922f8ace492ad3daeb7e21b4b240c5e23. npm audit was changed to use the SEC-1 environment allowlist so Runtime secrets are not exposed to registries configured by a project .npmrc, based on 0f131b2922f8ace492ad3daeb7e21b4b240c5e23.

## What changed

- A new BuildHealth module was added for Repository Intelligence. (`apps/lumina-runtime/src/repository-intelligence/BuildHealth.ts`, `0f131b29`)
- BuildHealth runs the project's own typecheck through each referenced tsconfig and reports errors as findings by file, line, and code. (`apps/lumina-runtime/src/repository-intelligence/BuildHealth.ts`, `0f131b29`)
- BuildHealth runs the project's build script through the project's package manager and falls back to npm. (`apps/lumina-runtime/src/repository-intelligence/BuildHealth.ts`, `0f131b29`)
- BuildHealth was exported from the repository-intelligence index. (`apps/lumina-runtime/src/repository-intelligence/index.ts`, `0f131b29`)
- Tests were added for BuildHealth. (`apps/lumina-runtime/src/repository-intelligence/__tests__/BuildHealth.test.ts`, `0f131b29`)
- npm audit now uses the same SEC-1 environment allowlist as the deep audit. (`apps/lumina-runtime/src/repository-intelligence/AdvisoryAudit.ts`, `0f131b29`)

## Decisions

- The deep audit is opt-in because it runs project code. (`0f131b29`)
- The deep audit uses the SEC-1 environment allowlist to prevent Runtime environment values from traveling to project-controlled execution. (`0f131b29`)
- The deep audit has time limits because it runs project code. (`0f131b29`)
- The deep audit never installs dependencies. (`0f131b29`)
- A missing tool or dependencies built for another platform make a build-health check unavailable with a reason instead of failed. (`0f131b29`)

## Lessons

- Audits that run project code should be opt-in and bounded by an environment allowlist and time limits. (`0f131b29`)
- npm audit must not inherit Runtime environment secrets because a project .npmrc can direct npm to any registry. (`0f131b29`)
- Unavailable local tooling should be reported as unavailable with a reason rather than as a failed check. (`0f131b29`)

## Open risks

- Build-health coverage remains conditional because missing tools or dependencies built for another platform make checks unavailable instead of failed. (`0f131b29`)
- Deep audit execution still runs project code when opted in, so the SEC-1 allowlist and time limits remain required controls. (`0f131b29`)
