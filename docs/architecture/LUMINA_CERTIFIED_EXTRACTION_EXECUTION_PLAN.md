# Lumina Certified Extraction Execution Plan

## Execution Record

- Repository: `kore20lllc-netizen/korelumina`
- Branch: `inspect/runtime-certified-main`
- Certified registry commit: `21a4dc3c4087ff5f58a4ef3799fec6680c533db0`
- Execution status: Planning only
- Extraction status: Not started
- First candidate: LPR-008 — Standard Premium Panel
- Excluded local modification:
  - `apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeHeader.tsx`

## Governing Authority

This plan is governed by:

- `docs/architecture/LUMINA_PRIMITIVE_EXTRACTION_REGISTRY.md`
- Lumina Design System Governance
- Stage 2 Extraction Certification
- Knowledge Operations flagship
- Runtime Operations workspace
- Regression Safety Gate

No extraction, refactor, redesign, API redesign, or consumer migration is authorized by this document alone.

## First Primitive

### LPR-008 — Standard Premium Panel

Certified rendering contract:

- `rounded-[26px] p-5`
- `premiumSurfaces.base.panel`
- `electricContour.strength.standard`

Permitted extraction delta:

- ownership
- import location

Prohibited during extraction:

- spacing changes
- radius changes
- contour changes
- surface changes
- typography changes
- responsive changes
- behavior changes
- domain-content movement
- simultaneous multi-consumer migration

## Rollback Baseline

- Rollback SHA: `21a4dc3c4087ff5f58a4ef3799fec6680c533db0`
- Rollback scope: all future extraction commits after this SHA
- Existing unrelated modification must remain untouched:
  - `apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeHeader.tsx`

Each extraction milestone must create a new rollback SHA before the next consumer migration begins.

## Screenshot Baseline Registry

Screenshots must be captured before extraction for every consumer migrated.

Required baseline location:

`docs/architecture/evidence/lumina-extraction/lpr-008/<consumer>/`

Required viewport captures:

- desktop-wide
- desktop-standard
- tablet
- mobile where the workspace supports mobile rendering

Required state captures where applicable:

- default
- hover
- focus
- selected
- disabled
- loading
- empty
- warning
- error

No consumer may migrate without a complete applicable baseline set.

## Consumer Inventory

The exact LPR-008 consumer inventory must be verified from repository evidence immediately before extraction.

Initial Knowledge Operations candidates:

1. Canonical Review
2. Canonical Knowledge
3. Organizational Memory
4. Knowledge Distribution Hub
5. Consumer Intelligence
6. Knowledge Genealogy
7. Organizational Impact

Additional consumers discovered in Runtime, Runtime Diagnostics, Repo Audit, Admin, Developer, or Designer require separate certification before migration.

## Migration Order

The first extraction must proceed in this order:

### Milestone 1 — Primitive creation only

- Create the shared Standard Premium Panel primitive.
- Preserve the exact certified rendering contract.
- Do not change any consumer.
- Run full validation.
- Commit and push only after review.

### Milestone 2 — First consumer migration

- Migrate one low-risk, visually certified Knowledge Operations consumer.
- Recommended first consumer: Organizational Impact.
- Preserve every rendered class, child structure, responsive behavior, and semantic boundary.
- Run build and visual comparison.
- Commit and push only after explicit approval.

### Subsequent milestones

Migrate exactly one consumer per milestone:

1. Organizational Impact
2. Knowledge Genealogy
3. Consumer Intelligence
4. Organizational Memory
5. Canonical Knowledge
6. Canonical Review
7. Knowledge Distribution Hub only after its unique full-width composition is separately verified

This order is provisional until the exact repository inventory and baseline screenshots are complete.

## Validation Matrix

Every primitive-creation and consumer-migration milestone must run:

- `git diff --check`
- `npm run build`
- `git status --short`
- `git diff --stat`

Every consumer migration must also validate:

| Validation | Required |
|---|---|
| Desktop visual parity | Yes |
| Tablet visual parity | Yes |
| Mobile visual parity | Where supported |
| Default state | Yes |
| Hover state | Where applicable |
| Focus state | Where applicable |
| Selected state | Where applicable |
| Disabled state | Where applicable |
| Loading state | Where applicable |
| Empty state | Where applicable |
| Warning state | Where applicable |
| Error state | Where applicable |
| Accessibility parity | Yes |
| Responsive parity | Yes |
| Interaction parity | Yes |
| Domain ownership preserved | Yes |
| Unrelated files unchanged | Yes |

## Commit Sequence

Each milestone must use one logical commit only.

Required sequence:

1. primitive creation
2. first consumer migration
3. second consumer migration
4. one additional consumer per commit
5. final extraction certification document update

No batch migration is allowed.

Suggested commit messages:

- `feat(lumina): add standard premium panel primitive`
- `refactor(knowledge): migrate organizational impact panel`
- `refactor(knowledge): migrate knowledge genealogy panel`
- `refactor(knowledge): migrate consumer intelligence panel`
- `refactor(knowledge): migrate organizational memory panel`
- `refactor(knowledge): migrate canonical knowledge panel`
- `refactor(knowledge): migrate canonical review panel`

Knowledge Distribution Hub requires its own approved commit message after separate verification.

## Stop Conditions

Stop extraction immediately when:

- build fails
- visual parity is not exact
- responsive behavior changes
- spacing, radius, contour, or surface treatment changes
- typography changes
- hover, focus, selected, disabled, loading, empty, warning, or error states regress
- accessibility behavior changes
- domain semantics enter the shared primitive
- a consumer requires API redesign
- more than one consumer changes
- unrelated files change
- `RuntimeHeader.tsx` changes
- explicit visual approval is not obtained
- rollback safety is unclear

## Domain Boundary

The Standard Premium Panel may own only:

- outer element rendering
- certified radius
- certified padding
- certified premium panel surface
- certified standard contour
- optional caller-provided class extension only when it does not alter the certified baseline during migration

Consumers retain ownership of:

- headings
- labels
- metrics
- badges
- controls
- actions
- state logic
- business rules
- timelines
- feeds
- inspectors
- responsive inner layout
- all Knowledge, Runtime, Mission, Chief Agent, Governance, Repo Audit, Admin, Developer, and Designer meaning

## Regression Review

After each migration:

1. Compare against screenshot baseline.
2. Confirm no visual delta.
3. Confirm no behavioral delta.
4. Confirm no responsive delta.
5. Confirm no accessibility delta.
6. Record the approved commit SHA as the next rollback point.
7. Do not continue without explicit approval.

## Runtime Header Exclusion

The following file is excluded from all extraction planning and execution:

`apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeHeader.tsx`

It must remain:

- untouched
- unstaged
- uncommitted
- outside all diffs
- outside all screenshot comparisons
- outside all extraction decisions

## Authorization Boundary

This document authorizes planning only.

Before the first code change, a separate milestone must:

1. verify the exact LPR-008 consumer inventory
2. capture screenshot baselines
3. confirm the rollback SHA
4. identify the first consumer
5. obtain explicit authorization to create the primitive
