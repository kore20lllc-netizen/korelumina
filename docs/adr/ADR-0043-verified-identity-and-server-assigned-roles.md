# ADR-0043 — Verified identity and server-assigned roles

## Status

Accepted

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: How KoreLumina knows who is calling Runtime and what they may do: where a person's role comes from, who may change it, and how Runtime verifies the caller before authorizing project and platform operations.

---

## Context

Before the first paying customer, the security review (SEC-1) found that identity and roles are decided by the browser.

### Verified state on 2026-10-19

- **Runtime authorizes from unverified headers.** `getRuntimeCaller` reads `x-korelumina-role`, `x-korelumina-user-id` and `x-korelumina-team-id` from the request. The browser sets them and nothing checks them. `canViewProject` and `canManageProject` decide on them: a caller who says `super_admin` sees and manages every project, and a caller who sends another user's id gets that user's projects.
- **Roles are chosen in the browser.** Signed-out visitors were `inhouse-dev` (support access to every project). Any role in `localStorage["korelumina:role"]` was honoured. Settings shows a role switcher up to Super admin to every user. The simulated checkout grants plan roles client-side.
- **With real sign-in the role is self-editable.** `SupabaseAuthProvider` read the role from `user_metadata` and `setRole` wrote it there. Supabase lets a signed-in user update their own `user_metadata`, so any customer could make themselves admin.
- **What protects us today is locality.** Runtime listens on 127.0.0.1 and accepts only the Builder's browser origin. Executive routes require loopback or the Runtime internal token. A hosted Runtime would have none of that.

SEC-1b (shipped with this ADR as Proposed) made the defaults fail-safe without choosing an architecture: signed-out visitors are plain users; browser role switching, the localStorage override and the simulated checkout only work in development builds; the Supabase role is read from `app_metadata`; and Runtime believes caller headers only with the internal token or from this machine outside production. That closes the obvious holes but leaves hosted KoreLumina unable to identify anyone.

## Problem

Runtime must know, without trusting the browser, which person is calling, which team they act for, and what role they hold. Roles must be assigned by KoreLumina, not by the person holding them.

## Alternatives Considered

1. **Keep trusting headers behind a proxy.** Rejected: any compromise of or bypass around the proxy is a full authorization bypass, and local tools would keep the habit of sending roles.
2. **Runtime keeps its own user database and sessions.** Rejected for now: duplicates Supabase, which already issues signed sessions.
3. **Runtime verifies the Supabase access token on every request; roles live in `app_metadata`, written only by the server.** Chosen.

## Decision

1. **The browser sends a session token, never a role.** The Builder sends `Authorization: Bearer <Supabase access token>`. The `x-korelumina-role`, `x-korelumina-user-id` and `x-korelumina-team-id` headers are removed from the Builder and ignored by Runtime.
2. **Runtime verifies every token.** It checks the signature against the project's JWT verification key, the expiry, the audience and the issuer. The caller's user id is the token's `sub`. An invalid or missing token is an anonymous plain user.
3. **Roles and plans live in `app_metadata`.** Only the server (service role) writes them. A person never changes their own role. Owner and staff roles (`super_admin`, `admin`, `inhouse-dev`) are assigned by the owner through a server operation that is recorded in the audit log. Plan roles (`pro`, `business`, `enterprise`) are assigned by the payment provider's webhook, never by the client.
4. **Team membership is verified server-side.** A team id is accepted only if Runtime's team records list the caller as a member.
5. **Local development keeps a single explicit escape.** Outside production, requests from this machine may use a development identity configured in Runtime's environment (not chosen in the browser). Production refuses it.
6. **Machine callers use the Runtime internal token**, as executive routes already do, and are recorded as the system actor.

## Consequences

- Hosted KoreLumina can serve customers without any of them being able to impersonate another or raise their own role.
- The Settings role switcher and simulated checkout stay development tools until billing is real.
- Every Runtime route that authorizes needs the verified caller; routes that today read headers must move to it.
- Runtime needs the Supabase JWT verification key and project URL in its environment. They are public verification material, not secrets, but they must be configured correctly or every caller becomes anonymous.

## Implementation Impact (each step is its own ticket)

- SEC-1c: Runtime token verification middleware and verified `RuntimeCaller`; remove header trust.
- SEC-1d: Builder sends the session token instead of role headers.
- SEC-1e: Server operation for owner-assigned roles, with audit record.
- BILL-1: Payment provider webhook assigns plan roles.

## Validation

- A request with no token, an expired token, a token signed by another project, or a forged role header is an anonymous plain user.
- A request with a valid token for user A cannot read or manage user B's private project.
- A signed-in user calling `supabase.auth.updateUser({ data: { role: "super_admin" } })` gains nothing.
- Local development on this machine keeps working with the configured development identity.

## Related Tickets

SEC-1a (F-18, shipped), SEC-1b (shipped with this ADR as Proposed), SEC-1c, SEC-1d, SEC-1e, BILL-1.
