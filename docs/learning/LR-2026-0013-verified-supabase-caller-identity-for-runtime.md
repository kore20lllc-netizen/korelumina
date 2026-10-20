# LR-2026-0013 — Verified Supabase caller identity for Runtime

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 904ee646..7d764771

Source commits: 1400c214, 7d764771

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-20

Learning cycle: learning-cycle:4ac2e3304a32e57c · written by the Chief Agent (gpt-5.5)

---

## Summary

Runtime now identifies browser callers from verified Supabase session tokens instead of role, user, or team headers, and Builder sends the Supabase session token for real sign-in (1400c21496ae638ac2634bc8938bcca84508ecc2, 7d764771bbf4d07c2c7cb4dac616a1c26a9c68c9). Runtime also added a live identity endpoint and updated the Executive Office Security heartbeat to read how Runtime sees the caller (7d764771bbf4d07c2c7cb4dac616a1c26a9c68c9).

## What changed

- Runtime now verifies Supabase access tokens itself instead of trusting role and user headers. (`1400c214`)
- Runtime accepts HS256 tokens signed with the project JWT secret. (`1400c214`)
- Runtime accepts ES256 and RS256 tokens verified against the project's published signing keys. (`1400c214`)
- Runtime rejects unsupported token algorithms, including alg none. (`1400c214`)
- Runtime requires accepted tokens to be unexpired, issued by this project, and intended for the authenticated audience. (`1400c214`)
- Runtime derives the caller user id from the token subject. (`1400c214`)
- Runtime derives the caller role from server-written app_metadata. (`1400c214`)
- Runtime treats a plan role such as free as a plain user role. (`1400c214`)
- Runtime treats a present but invalid bearer token as anonymous and does not fall back to caller headers. (`1400c214`)
- Builder now sends the person's Supabase session token during real sign-in. (`7d764771`)
- Builder no longer sends role, user, or team caller headers during real sign-in. (`7d764771`)
- Runtime ignores browser caller headers when SUPABASE_URL is configured. (`7d764771`)
- Runtime now recognizes callers as a verified token, the internal token, a development identity configured in Runtime's environment, or anonymous. (`7d764771`)
- GET /api/runtime/identity reports Runtime's caller role, user id, source, and reason. (`7d764771`, `apps/lumina-runtime/src/routes/runtimeIdentity.ts`)
- GET /api/runtime/identity never reports a token. (`7d764771`)
- The Executive Office Security heartbeat now reads Runtime identity live instead of using preview text. (`7d764771`, `apps/lumina-builder/src/components/workspaces/executive/layout/ChiefAgentCommandDeck.tsx`, `apps/lumina-builder/src/services/executiveOfficeService.ts`)
- Runtime browser preflight now allows the Authorization header. (`7d764771`)

## Decisions

- ADR-0043 directed Runtime to verify Supabase access tokens instead of trusting role and user headers. (`1400c214`)
- ADR-0043 Decision 1 directed Builder to send the Supabase session token and no role, user, or team header during real sign-in. (`7d764771`)
- The token verifier was built on node:crypto with no new dependency. (`1400c214`)
- Development identity is allowed only outside production through KORELUMINA_DEV_IDENTITY. (`1400c214`)
- Production refuses KORELUMINA_DEV_IDENTITY. (`1400c214`)
- Runtime does not accept team ids from verified callers until Runtime keeps team membership. (`1400c214`)
- The development-only mock sign-in kept the legacy caller headers. (`7d764771`)

## Lessons

- Production-mode live verification showed a valid owner token could see the owner's project. (`1400c214`)
- Production-mode live verification showed a forged token saw no owner project. (`1400c214`)
- Production-mode live verification showed a customer token saw no owner project. (`1400c214`)
- Production-mode live verification showed headers alone saw no owner project. (`1400c214`)
- With Supabase configured, a local super_admin header was seen as anonymous. (`7d764771`)
- With Supabase configured, a valid token was seen as the verified super_admin. (`7d764771`)
- With Supabase configured, a forged token was rejected with bad_signature. (`7d764771`)
- The first security change added 21 tests and left executive, routes, learning, knowledge, and runtime suites passing at 432/432. (`1400c214`)
- The second security change left runtime suites passing at 435/435. (`7d764771`)

## Open risks

- Runtime still needs team membership before team ids can be accepted from verified callers. (`1400c214`)
- The development-only mock sign-in still uses legacy caller headers. (`7d764771`)
