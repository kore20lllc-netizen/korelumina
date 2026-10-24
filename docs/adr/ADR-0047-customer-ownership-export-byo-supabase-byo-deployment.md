# ADR-0047 — Customer ownership: export, bring your own Supabase, bring your own deployment, desktop-ready screens

## Status

Accepted (owner, 2026-10-23), amended the same day: guided Take ownership flow (Decision 6), connected accounts instead of pasted tokens so it is frictionless for customers who are not technical (Decision 1), KoreLumina-managed infrastructure rejected (Alternative 5)

Version: 1.3

Owner: Founder, Kore20 LLC

Scope: How a customer takes a project out of KoreLumina and runs it on their own accounts: exporting the code (download, a new GitHub repository, or a pull request on the original), moving its backend to their own Supabase project, and deploying it to their own Vercel account. Also the second half of "full website view": making an AI-built app's own screens work as a desktop website. Payment is not decided here (MS-2026-0003).

---

## Context

- **The owner's goal (2026-10-23).** Apps built with AI tools such as Lovable usually arrive as phone-shaped apps. Customers want them as full websites, on infrastructure they own: their own repository, their own Supabase, their own Vercel. The owner chose to cover both meanings of "full website view": adding website pages (done, Transform App → Website) and making the app's existing screens desktop-ready.
- **What the product already promises.** The landing page sells, on Pro and above, "Bring Your Own Supabase", "Bring Your Own Deployment", "Own everything: keep your code, infrastructure, data, and deployment path under your control", and "Bring Your Own Stack: your keys, your perimeter".
- **What the specification requires.** ENGINEERING_SPEC_V1 chapter 4 lists Managed and BYO deployment, rollback and deployment validation under the Deployment Platform, isolated from Runtime execution. Chapter 6: deployment and repository transformation require explicit approval; every write should support rollback; operations over five seconds run asynchronously with observable progress. Chapter 15 names Vercel among the deployment targets. Security review is mandatory for secret handling.
- **Verified state (2026-10-23).**
  - Imported projects live only in KoreLumina's working copy (`runtime/workspaces/default/projects/<id>`). Nothing pushes them back to any git host, and there is no download. Changes made in KoreLumina (AI Assist, Transform) cannot leave it.
  - No code deploys anywhere, and nothing connects a Supabase project. Vercel appears only in the audit's detection of config files.
  - **Lovable gives customers no database access**, but syncs each project's code to the customer's GitHub. The owner's plan (2026-10-23): the customer clones that repository into KoreLumina and redeploys it on a private Supabase, GitHub and Vercel of their own, which KoreLumina sets up for them. The repository stays theirs: they can take it and leave at any time.
- The four Lovable projects imported so far all read Supabase from environment variables (`import.meta.env`), and each carries its database history as `supabase/migrations` (13 to 73 files) and 0 to 26 edge functions under `supabase/functions`.
  - Import already uses a customer token safely: once, only for that request, passed to git through the process environment, never stored, logged or returned (MS-2026-0013).

---

## Problem

A customer must be able to take their project, including what KoreLumina changed, to accounts they own, without KoreLumina holding the keys to those accounts and without any step that cannot be reviewed or undone happening silently.

---

## Alternatives

1. **Pasted tokens only, used once and never kept** (this ADR's first version). Safe, but a customer who is not technical cannot be expected to create scoped tokens, and every later push would ask for one again. Kept as a fallback, not the main path.
2. **Store pasted long-lived tokens.** Rejected: broad, hard for the customer to see or revoke, and not scoped to KoreLumina.
3. **Hand the customer a zip and instructions only.** Safe but does not keep the promise: their own Supabase and deployment would remain manual work.
4. **Copy the data from the old Supabase project too.** Rejected for version 1. Lovable-managed projects often give the customer no database access, and moving personal data between providers needs its own consent and verification. Schema, functions and configuration move; data does not.

5. **KoreLumina-managed infrastructure, handed over later.** KoreLumina would create the repository, Supabase project and Vercel deployment on its own accounts for customers who have none, and transfer them when the customer wants to leave. Checked on 2026-10-23: Vercel supports this ("Claim Deployments", built for AI-generated deployments; claimed projects can bring Supabase databases created through the Vercel Marketplace). Supabase moves projects between organisations only from its dashboard, only when the person moving it owns the source organisation and belongs to the target one. Supabase's Free plan allows two active projects per organisation, paused after a week of inactivity, so each customer database would cost KoreLumina a paid project. **Rejected by the owner (2026-10-23):** every resource is the customer's from the first minute, created on their own accounts, with KoreLumina guiding them; KoreLumina holds no part of it.

---

## Decision

### 1. Connected accounts: frictionless, revocable, owned by the customer

The customer connects their own accounts with "Continue with GitHub", "Continue with Supabase" and "Continue with Vercel": KoreLumina is registered with each provider as an app (a GitHub App, a Supabase OAuth app, a Vercel integration), and the customer grants it access on the provider's own page. A customer without an account creates one there, in the same step; Supabase and Vercel both let them sign up with the GitHub account they just made. A customer who already has accounts signs in and chooses what KoreLumina may use (the GitHub App is installed only on the repositories they pick).

- **The customer owns everything.** Every repository, database and deployment is created in the customer's account. KoreLumina holds only a permission the customer gave, which they can withdraw at any time from the provider's own settings, or with Disconnect in KoreLumina. Withdrawing it breaks nothing they own.
- **Stored safely.** Connection tokens are kept by Runtime only, encrypted at rest with a key held in Runtime's environment, never sent to the browser, logged, written to a project, put in a URL or returned. They are used only for an action the customer starts in KoreLumina, and every use is recorded (who, which project, which action, when). A connection that stops working (revoked or expired) is shown as disconnected, never retried silently.
- **Least privilege.** Each app asks only for what its steps need.
- **Fallback.** A customer who prefers not to connect may paste a token for one operation; it is used once and never kept, exactly as import does.

Values that are public by design (a Supabase project URL and its anon key) may be recorded in the project's metadata. A service-role key never is.

### 2. Export

Three ways out, for whoever manages the project:

- **Download:** a zip of the project as it is now, without `node_modules`, build output, `.git` and `.env*` files.
- **New GitHub repository:** Runtime creates a private repository under the customer's account or organisation and pushes the project as one commit ("Exported from KoreLumina"), authored as the connected GitHub user.
- **Pull request on the original:** for projects imported from GitHub, Runtime pushes a branch (`korelumina/<change>`) with what changed since import and opens a pull request. It never pushes to the default branch and never force-pushes.

Download is available on every plan, because the code is the customer's. GitHub export, BYO Supabase and BYO deployment are Pro and above, as the landing page says, enforced in Runtime.

### 3. Bring your own Supabase

1. **Analyze (read-only):** which environment variables the app reads for Supabase, the migrations in order, the edge functions, and the secrets those functions read (`Deno.env.get`).
2. **Plan, shown in full:** the target project, each migration and function that will run, and the secrets the customer must provide.
3. **Apply, only after explicit approval:** through the Supabase Management API, run the migrations in order, deploy the edge functions, and set the function secrets the customer typed in. **It refuses a target project whose public schema already has tables**, so a customer's existing database is never altered by mistake.
4. **Point the app at it:** write the new project URL and anon key into the project's `.env.example` and into the deployment's environment (section 4), never into source code.

SQL cannot be undone like a file. The safeguards are the empty-target rule, showing every statement before it runs, and running each migration in its own transaction, stopping at the first failure and reporting exactly how far it got.

### 4. Bring your own deployment (Vercel first)

Runtime creates or reuses a Vercel project, sets its environment variables (including those from section 3), and deploys: from the customer's GitHub repository when the project is linked to it (section 6), otherwise by uploading the project's files directly. It reports the build's real progress and logs and returns the deployment URL. Rollback: Vercel keeps every earlier deployment, and KoreLumina can promote the previous one. Netlify and Cloudflare follow the same shape later; other targets in chapter 15 are not in scope.

### 5. Desktop-ready screens

This is a second option in Transform App → Website. Runtime lists the app's screens (routes and their components). The AI drafts responsive layout changes for the chosen screens: wider containers, navigation suited to a desktop, multi-column grids at large breakpoints, using the app's own styling system. It must not change behaviour, data access or text. Each screen is a reviewed draft, applied all or nothing, with undo, like every other AI change.

### 6. Take ownership: one guided flow

The pieces above come together in one window, in order, each step feeding the next:

1. **GitHub:** create the customer's private repository (or choose an existing one) and push the project (section 2).
2. **Supabase:** create a new project in the customer's organisation, in the region they choose, through the Management API with their connected account, or choose an existing empty project. A new project's database password is generated, shown once for the customer to save, and never kept. Then apply migrations, functions and secrets (section 3).
3. **Vercel:** create the project on the customer's account (or choose an existing one), set the Supabase URL and anon key from step 2 as its environment variables, link it to the GitHub repository from step 1 so that every later push redeploys without KoreLumina, and deploy (section 4).

**For a customer who is not technical** (an idea, perhaps planned with another AI, and no accounts), the window is called "Put it online" and speaks plainly: Save your code (GitHub), Create your database (Supabase), Publish your website (Vercel). Each is one "Continue with ..." button that also creates the account if they have none. KoreLumina never creates an account for them and never hosts anything on its own accounts. Each step says plainly what the provider's free plan allows: Vercel's Hobby plan is for non-commercial personal use only (selling, taking payments or advertising a product needs Vercel Pro), and Supabase's Free plan keeps two active projects per organisation and pauses a project after a week of inactivity.

**For a customer who already has accounts**, the same buttons sign them in, and each step offers new or existing: a new private repository or one they have (or a pull request on the one the project came from); a new Supabase project in one of their organisations or an existing empty one (one with tables is refused); a new Vercel project in their personal account or a team, or an existing one. Connected accounts are remembered, so publishing again is one click.

Each step asks for its own explicit approval, and can be skipped or done again. When the flow ends, everything runs on the customer's accounts; KoreLumina keeps only its working copy, which the customer may export or delete at any time. Nothing KoreLumina sets up depends on KoreLumina to keep working.

### 7. Always

Every step runs as a Runtime job with real progress (chapter 6), is authorized in Runtime by project ownership and plan, and asks for explicit approval before it writes outside KoreLumina (a push, a migration, a deployment).

---

## Consequences

Positive:

- The landing page's ownership promises become true, and customers leave with everything KoreLumina changed.
- KoreLumina never holds standing access to customers' accounts.
- Lovable-style projects, the commonest import, are covered end to end: clone, website, own GitHub, own Supabase, own Vercel.
- The customer can leave at any time with a working setup that does not depend on KoreLumina.

Negative:

- KoreLumina now holds customers' connection tokens, so it must build and keep a secure store (encryption, use log, disconnect) and register apps with three providers before the first connection works.
- Data does not move between Supabase projects.
- Vercel only, to start.

Trade-offs:

- A frictionless experience for customers who are not technical, at the cost of KoreLumina holding revocable permissions; ownership never moves to KoreLumina.

---

## Validation

- Tests prove that connection tokens are stored only encrypted and never appear in plain stored files, logs, responses, the browser or project metadata; that a revoked connection shows as disconnected; that every use is recorded; that export excludes `.env*`, `.git` and `node_modules`; that pull requests never target the default branch; and that the Supabase step refuses a non-empty target and stops at the first failing migration.
- Each provider call is tested against recorded API shapes. The first live run against a real GitHub, Supabase or Vercel account happens only with the owner's approval, on the owner's own test accounts.
- Every new screen is approved visually by the owner and certified as a UI contract.

---

## Related Tickets

- MS-2026-0011 (Transform App → Website, delivered; desktop-ready screens extend it)
- MS-2026-0013 (import; its one-use token handling is reused)
- MS-2026-0003 (billing; plan enforcement and the $49 unlock)
- Missions imported from runtime/executive/mission-imports/2026-10-23-customer-ownership.json: Export; Desktop-ready screens; Bring your own Supabase; Bring your own deployment (Vercel); Take ownership
