# LR-2026-0058 — Per-project runtime authorization

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 8251973b..de1828f6

Source commits: de1828f6

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-23

Learning cycle: learning-cycle:e01bbe92bfd725b6 · written by the Chief Agent (gpt-5.5)

---

## Summary

Per-project authorization was added for runtime files, process controls, logs, status, metrics, scenarios, and live events in de1828f6d2bdb252a31ac8fe2004cfb105b09fa4. The browser event client was updated so signed-in users receive runtime events in apps/lumina-builder/src/services/runtime/events.ts.

## What changed

- Runtime routes now authorize access from the verified caller and the project owner instead of relying only on machine-origin checks. (`de1828f6`, `apps/lumina-runtime/src/routes/projectAccess.ts`)
- File routes now use project access checks. (`de1828f6`, `apps/lumina-runtime/src/routes/fs.ts`)
- Log routes now use project access checks. (`de1828f6`, `apps/lumina-runtime/src/routes/logs.ts`)
- Status routes now use project access checks. (`de1828f6`, `apps/lumina-runtime/src/routes/status.ts`)
- Stop, restart, and start routes now use project access checks. (`de1828f6`, `apps/lumina-runtime/src/routes/stop.ts`, `apps/lumina-runtime/src/routes/restart.ts`, `apps/lumina-runtime/src/routes/start.ts`)
- Metrics and runtime scenario routes now use staff-level access checks. (`de1828f6`, `apps/lumina-runtime/src/routes/metrics.ts`, `apps/lumina-runtime/src/routes/runtimeScenario.ts`)
- Live event routes now use project access checks before streaming project events. (`de1828f6`, `apps/lumina-runtime/src/routes/events.ts`, `apps/lumina-runtime/src/runtime/eventBus.ts`)
- The builder runtime event client was changed to read the event stream with the user sign-in. (`de1828f6`, `apps/lumina-builder/src/services/runtime/events.ts`)
- The old builder runtime event service file was removed. (`de1828f6`, `apps/lumina-builder/src/services/runtimeEvents.ts`)
- Project access route tests were added. (`de1828f6`, `apps/lumina-runtime/src/routes/__tests__/projectAccess.test.ts`)

## Decisions

- Callers that may not see a project receive a not-found response. (`de1828f6`)
- Viewing files, logs, status, and starting a preview require view access. (`de1828f6`)
- Writing files, stopping a project, and restarting a project require manage access. (`de1828f6`)
- Process metrics and failure scenarios require staff access. (`de1828f6`, `apps/lumina-runtime/src/routes/metrics.ts`, `apps/lumina-runtime/src/routes/runtimeScenario.ts`)
- The browser event stream uses the caller sign-in instead of an unauthenticated live-event subscription. (`de1828f6`, `apps/lumina-builder/src/services/runtime/events.ts`)

## Lessons

- Checking only start and restart left file access, logs, status, stopping, and live events open across projects. (`de1828f6`)
- Route-level authorization must be applied consistently to every project-specific endpoint. (`de1828f6`, `apps/lumina-runtime/src/routes/projectAccess.ts`)
- Live event subscriptions must be filtered by project access because the previous stream sent every project's logs to every subscriber. (`de1828f6`, `apps/lumina-runtime/src/routes/events.ts`)
- The previous browser client listened for named events that Runtime never sent. (`de1828f6`, `apps/lumina-builder/src/services/runtime/events.ts`)
- Adding project access tests documents the expected authorization behavior for runtime routes. (`apps/lumina-runtime/src/routes/__tests__/projectAccess.test.ts`)
