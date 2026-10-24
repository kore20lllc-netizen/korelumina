# LR-2026-0061 — Customer-owned deployment accounts and sealed connections

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: fe4ca896..29210dc0

Source commits: 1de442a2, 29210dc0

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-24

Learning cycle: learning-cycle:6cf7da98eae7236d · written by the Chief Agent (gpt-5.5)

---

## Summary

ADR-0047 was accepted and amended so customers connect GitHub, Supabase, and Vercel accounts and keep ownership of their code, database, and deployment infrastructure (1de442a2fc94f9bfcf5c0969a5c5c88ff1ddda9f). Runtime implemented sealed, logged, revocable provider connections for GitHub, Supabase, and Vercel (29210dc05e954232a2b16ac15ce3b5cad04f4f96).

## What changed

- ADR-0047 documents that customers can bring AI-built apps or ideas and publish on infrastructure they own and can leave with. (`docs/adr/ADR-0047-customer-ownership-export-byo-supabase-byo-deployment.md`, `1de442a2`)
- ADR-0047 defines account connection through Continue with GitHub, Supabase, and Vercel, with account creation in the same step when needed. (`docs/adr/ADR-0047-customer-ownership-export-byo-supabase-byo-deployment.md`, `1de442a2`)
- ADR-0047 defines a plain-language Put it online flow that saves code, creates the database, and publishes the website on the customer's own accounts. (`docs/adr/ADR-0047-customer-ownership-export-byo-supabase-byo-deployment.md`, `1de442a2`)
- Runtime added connection crypto for sealing connected account tokens. (`apps/lumina-runtime/src/connections/ConnectionCrypto.ts`, `29210dc0`)
- Runtime added connection service, types, routes, and provider integrations for GitHub, Supabase, and Vercel connections. (`apps/lumina-runtime/src/connections/ConnectionService.ts`, `apps/lumina-runtime/src/connections/ConnectionTypes.ts`, `apps/lumina-runtime/src/routes/connections.ts`, `apps/lumina-runtime/src/connections/providers/GitHubConnection.ts`, `apps/lumina-runtime/src/connections/providers/SupabaseConnection.ts`, `apps/lumina-runtime/src/connections/providers/VercelConnection.ts`, `29210dc0`)
- Connected account tokens are sealed with AES-256-GCM under a key that exists only in Runtime's environment and is bound to owner and provider. (`apps/lumina-runtime/src/connections/ConnectionCrypto.ts`, `29210dc0`)
- Runtime opens connected account tokens only for an action the person started and logs each use without the token. (`apps/lumina-runtime/src/connections/ConnectionService.ts`, `29210dc0`)
- Disconnect deletes stored tokens and asks the provider to withdraw access. (`apps/lumina-runtime/src/connections/ConnectionService.ts`, `29210dc0`)

## Decisions

- The owner accepted ADR-0047 and amended it the same day. (`docs/adr/ADR-0047-customer-ownership-export-byo-supabase-byo-deployment.md`, `1de442a2`)
- KoreLumina chose customer-owned GitHub, Supabase, and Vercel accounts instead of managed hosting on KoreLumina accounts. (`docs/adr/ADR-0047-customer-ownership-export-byo-supabase-byo-deployment.md`, `1de442a2`)
- Managed hosting was considered and rejected. (`docs/adr/ADR-0047-customer-ownership-export-byo-supabase-byo-deployment.md`, `1de442a2`)
- ADR-0047 requires connected permissions to be encrypted, used only for customer-started actions, logged, and revocable. (`docs/adr/ADR-0047-customer-ownership-export-byo-supabase-byo-deployment.md`, `1de442a2`)
- ADR-0047 requires customer Supabase migrations and functions to refuse a non-empty target. (`docs/adr/ADR-0047-customer-ownership-export-byo-supabase-byo-deployment.md`, `1de442a2`)
- GitHub token refresh refusal disconnects the account instead of retrying. (`apps/lumina-runtime/src/connections/providers/GitHubConnection.ts`, `apps/lumina-runtime/src/connections/ConnectionService.ts`, `29210dc0`)
- Provider redirects are bound to the person by a single-use state and always return to the Builder. (`apps/lumina-runtime/src/connections/ConnectionService.ts`, `apps/lumina-runtime/src/routes/connections.ts`, `29210dc0`)

## Lessons

- One-click provider connections were chosen because ADR-0047 says customers should not need to create tokens manually. (`docs/adr/ADR-0047-customer-ownership-export-byo-supabase-byo-deployment.md`, `29210dc0`)
- Tests should verify that connected account tokens never appear in plain text on disk, listings, logs, or responses. (`apps/lumina-runtime/src/connections/__tests__/Connections.test.ts`, `29210dc0`)
- Provider-specific documented flows were implemented for GitHub App, Supabase OAuth with PKCE, and Vercel integration. (`apps/lumina-runtime/src/connections/providers/GitHubConnection.ts`, `apps/lumina-runtime/src/connections/providers/SupabaseConnection.ts`, `apps/lumina-runtime/src/connections/providers/VercelConnection.ts`, `29210dc0`)
- The connection layer keeps token handling inside Runtime instead of exposing token material through responses. (`apps/lumina-runtime/src/connections/ConnectionService.ts`, `apps/lumina-runtime/src/connections/__tests__/Connections.test.ts`, `29210dc0`)

## Open risks

- This window contains implementation evidence for connected accounts, but ADR-0047 also requires Put it online, export, customer Supabase migration/function application, Vercel deployment rollback, and desktop-ready screens. (`docs/adr/ADR-0047-customer-ownership-export-byo-supabase-byo-deployment.md`, `apps/lumina-runtime/src/connections/ConnectionService.ts`, `apps/lumina-runtime/src/routes/connections.ts`, `29210dc0`)
- The Runtime environment key is required to open sealed tokens, so deployment configuration must provide that key. (`apps/lumina-runtime/src/connections/ConnectionCrypto.ts`, `29210dc0`)
- GitHub connections can disconnect when refresh is refused, so customer-started actions must handle that disconnected state. (`apps/lumina-runtime/src/connections/providers/GitHubConnection.ts`, `apps/lumina-runtime/src/connections/ConnectionService.ts`, `29210dc0`)
