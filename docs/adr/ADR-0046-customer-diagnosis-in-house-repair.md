# ADR-0046 — Customer diagnosis, in-house repair

## Status

Accepted (owner, 2026-10-22, with the correction that AI Builder drafts stay with the project's owner)

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: Who may run the Repository Intelligence audit, read its reports, and plan or apply repairs. Releases diagnosis to Business and Enterprise customers for the repositories they import, as ENGINEERING_SPEC_V1 chapter 14 foresees ("unless explicitly released as a public product in a future architecture revision"). Repair stays an in-house engineering operation. Payment for repair is MS-2026-0015 and is not decided here.

---

## Context

- **The specification and the product disagree.** ENGINEERING_SPEC_V1 chapter 14 makes the Repo Audit Engine internal: in-house engineers, administrators and super administrators only. The landing page tells a customer without it that Repo Audit "is available on Business and Enterprise plans". LANDING_CONTRACT lists the engine under Internal Platform.
- **The owner decided on 2026-10-22:** Business and Enterprise accounts may access the audit report on an imported repository for diagnosis only. Anything that repairs is done in-house, and the customer escalates it (paid repair, MS-2026-0015).
- **Verified state on 2026-10-22.**
  - The Repository Intelligence routes (`/api/runtime/repository-audit/*`, MS-2026-0012) authorize by project only: anyone who can view a project can start a scan, read every report and read the fix plan; anyone who can manage it can run the deep audit, which runs the project's own typecheck and build. No plan role is checked.
  - The Builder shows Repo Audit to admins only, so customers cannot reach it today, but that is the browser's choice, not Runtime's.
  - The earlier audit and repair routes have no authorization at all: `/api/runtime/audit`, `/api/runtime/fix-plan`, `/api/runtime/generate-fixes` (it spends AI credits), `/api/runtime/drafts/*`, `/api/runtime/apply-draft` and `/api/runtime/revert-draft` (they write files into the project). Any caller that reaches Runtime can audit any project, generate repairs for it, and apply them (F-44).
  - Since MS-2026-0013, Runtime records each project's origin: imported from git, uploaded as an archive, or built in KoreLumina.

---

## Problem

Customers on Business and Enterprise must be able to diagnose a repository they import, and must not be able to plan or apply repairs, run the project's own code, or reach any other customer's project. The boundary must hold in Runtime, whatever the browser shows.

---

## Alternatives

1. **Keep the engine internal (the current specification).** Rejected: it contradicts the owner's decision and the landing page, and makes every diagnosis a sales conversation.
2. **Give customers the whole engine, repair included.** Rejected: repair is the paid in-house service, and turning audit findings into changes to a customer's code needs an engineer's review.
3. **Enforce in the Builder only.** Rejected: the Builder is not a security boundary (ADR-0043). A customer could call Runtime directly.
4. **Separate customer and staff report formats.** Rejected for now: one report, with repair planning withheld, is simpler and the client report export already exists. It can be revisited if the report needs different content.
5. **Make imported repositories read-only for customers, AI Builder included.** Rejected by the owner: customers keep editing their own projects with the AI Builder; only audit-driven repair is in-house.

---

## Decision

1. **Diagnosis is released to Business and Enterprise.** A caller whose verified role is `business` or `enterprise` may, for a project they can view:
   - start a **scan** audit (it reads files and queries advisory databases; it runs nothing from the project);
   - read the latest report, the report history and any report, and watch a run's progress;
   - export the client report.
   Findings keep their remedy text: saying what would resolve a finding is part of a diagnosis.
2. **Only imported projects are diagnosed.** The project's origin must be a git import or an uploaded archive (`isImportedProject`, MS-2026-0013). A project built in KoreLumina, or of unknown origin, is refused for customers.
3. **Repair is in-house.** Only `inhouse-dev`, `admin` and `super_admin` may:
   - read the ordered fix plan of a report (`/repository-audit/.../fix-plan`) and the earlier `/api/runtime/fix-plan`;
   - turn audit findings into fixes (`/api/runtime/generate-fixes`) and run the earlier audit engine (`/api/runtime/audit`);
   - run the **deep** audit, which runs the project's own typecheck and build.
   They may do this for any project (their support access), and every action is attributed to them.
4. **The AI Builder is not repair.** Drafts are how the AI Builder edits code (`/api/runtime/drafts/create`, reading a draft, `/api/runtime/apply-draft`, `/api/runtime/revert-draft`). They stay available to whoever manages the project, imported projects included, and to staff. Nobody else may create, read, apply or revert a project's drafts.
5. **Free and Pro have no diagnosis.** They are told it is available on Business and Enterprise.
6. **Runtime enforces it in one place.** A single policy decides every audit and repair route from the verified caller (ADR-0043) and the project's metadata. The earlier audit and repair routes get the same checks; none stays open. The Builder only reflects the policy, so a refusal in Runtime is never shown as an error the customer caused.
7. **The specification and the landing page say the same.** ENGINEERING_SPEC_V1 chapter 14's access policy and LANDING_CONTRACT are amended with this ADR; the Repo Audit tooltip and FAQ on the landing page say diagnosis on Business and Enterprise, repair by KoreLumina engineers.

---

## Consequences

Positive:

- Customers can diagnose what they import without a sales call, which is what the landing page already promises.
- Repair remains the in-house service it is priced as: the fix plan and findings turned into fixes are done by engineers.
- The AI Builder keeps working on every project its owner manages.
- The earlier audit and repair routes stop being open to anyone who reaches Runtime (F-44).

Negative:

- Customer audits run on KoreLumina's infrastructure and query advisory databases, so they cost compute and network on every run.
- Plan roles are trustworthy only once Stripe assigns them (MS-2026-0003). Until then, `business` and `enterprise` exist only where an admin or the development identity sets them.

Trade-offs:

- Customers do not get the deep audit, so their build-health category reads "not checked: build health runs in the deep audit". An engineer can run it during a repair.
- The client report and the in-app report are the same document with the fix plan withheld, rather than two tailored documents.

---

## Validation

- Runtime tests cover every audit and repair route for each role: user, pro, business, enterprise, inhouse-dev, admin, super_admin, and an anonymous caller.
- A business caller is allowed to start a scan and read reports of their own imported project; refused the deep audit, the fix plan, generate-fixes and the earlier audit; refused a project they do not own; and refused a project built in KoreLumina.
- Drafts can be created, read, applied and reverted only by the project's managers and staff.
- A free or pro caller is refused diagnosis with the reason.
- The earlier audit and repair routes refuse every customer role, and the draft routes refuse anyone who does not manage the project.
- `npm run build` passes.

---

## Related RFCs

-

---

## Related Tickets

- MS-2026-0014 (this decision and its enforcement)
- MS-2026-0015 (paid repair)
- MS-2026-0013 (project origin)
- MS-2026-0003 (plan roles from Stripe)
- F-44 (open audit and repair routes)

---

## Related Reconciliation

- ENGINEERING_SPEC_V1 chapter 14, Access Policy and Engineering Rule
- LANDING_CONTRACT, Internal Platform and Public Capability Register
- ADR-0043 (verified identity and server-assigned roles)

---

## Superseded By

(Optional)
