# Lumina Primitive Extraction Registry

## Audit Record

- Repository: `kore20lllc-netizen/korelumina`
- Branch: `inspect/runtime-certified-main`
- Baseline HEAD: `8239f6a9cb3f0cf12148973dac37ef97ce4527c0`
- Baseline commit: `feat(knowledge): add organizational impact`
- Audit type: Certified Primitive Extraction Audit
- Scope: Documentation-only
- Existing unrelated local modification:
  - `apps/lumina-builder/src/components/workspaces/runtime/parts/RuntimeHeader.tsx`
- Extraction status: Prohibited until future certification milestones
- Baseline remote validation: Vercel success

## Governing Rules

This registry is evidence-based. It records production-certified or repeatedly implemented patterns without extracting, refactoring, renaming, redesigning, or modifying shared components.

A candidate is eligible for future extraction only when it is:

1. Repeated across multiple certified workspaces.
2. Visually convergent.
3. Domain-neutral.
4. Supported by a stable rendering contract.
5. Proven safe through the Regression Safety Gate.
6. Extracted in dependency order.
7. Migrated one certified consumer at a time.

## Maturity Classification

- **Certified** — visually approved, repeated, domain-neutral, and supported by an existing stable rendering contract.
- **Stable** — repeatedly implemented and visually convergent, but still duplicated or not fully certified across all consumers.
- **Emerging** — repeated in limited contexts, with incomplete convergence or API stability.
- **Workspace-specific** — intentionally specialized composition belonging to one workspace.
- **Not Ready** — insufficient repetition, inconsistent rendering, unstable behavior, or unresolved semantics.

## API Stability Classification

- **Stable** — existing rendering contract is already explicit and consistently consumed.
- **Needs consolidation** — implementations visibly converge, but props, states, or composition differ.
- **Experimental** — insufficient repeated evidence or active architectural variation.

## Semantic Boundary Rules

Any implementation embedding Knowledge, Runtime, Mission, Chief Agent, Governance, repository audit, developer, designer, or admin meaning is **Domain-Owned**.

Domain-Owned components are not candidates for direct extraction.

Only their domain-neutral lower-level visual patterns may be considered independently.

## Primitive Inventory

| Primitive | Current implementations | Repetition evidence | Visual consistency | Maturity | API stability | Semantic boundary | Extraction readiness |
|---|---|---:|---|---|---|---|---|
| Premium surface tokens | Existing Lumina `premiumSurfaces` usage across Knowledge lifecycle and other premium workspaces | High | High | Certified | Stable | Domain-neutral | Ready after regression baseline |
| Electric contour tokens | Existing Lumina `electricContour` usage across Knowledge lifecycle and premium workspace surfaces | High | High | Certified | Stable | Domain-neutral | Ready after regression baseline |
| Executive metric card | `LuminaExecutiveCard` across Knowledge lifecycle and executive compositions | High | High | Certified | Stable | Domain-neutral | Ready after regression baseline |
| Executive metric grid | `LuminaExecutiveMetricGrid` across Canonical Review, Canonical Knowledge, Organizational Memory, Consumer Intelligence, Knowledge Genealogy, Organizational Impact | High | High | Certified | Stable | Domain-neutral | Ready after regression baseline |
| Executive premium icon | `ExecutivePremiumIcon` across Knowledge lifecycle and executive surfaces | High | High | Certified | Stable | Domain-neutral | Ready after regression baseline |
| Executive title-and-metrics composition | `LuminaExecutiveTitleMetricsComposition` consumed by Canonical Review, Canonical Knowledge, Organizational Memory, Consumer Intelligence, Knowledge Genealogy, and Organizational Impact | 6 | High | Certified | Stable | Domain-neutral at composition level | Extracted and regression-certified |
| Standard premium panel | `LuminaStandardPremiumPanel` consumed by Canonical Review, Canonical Knowledge, Organizational Memory, Consumer Intelligence, Knowledge Genealogy, and Organizational Impact | High | High | Certified | Stable | Domain-neutral | Extracted and regression-certified |
| Prominent premium panel | `LuminaProminentPremiumPanel` consumed by Canonical Review, Canonical Knowledge, Organizational Memory, Consumer Intelligence, Knowledge Genealogy, and Organizational Impact | High | High | Certified | Stable | Domain-neutral | Extracted and regression-certified |
| Standard premium card | `LuminaStandardPremiumCard` consumed by Organizational Impact, Knowledge Genealogy, Consumer Intelligence, Organizational Memory, Canonical Review, and Knowledge Distribution Hub | High | High | Certified | Stable | Domain-neutral | Extracted and regression-certified |
| Compact premium card | Repeated `rounded-[14px]` or `rounded-[16px]` compact card variants | Medium | Medium | Emerging | Needs consolidation | Domain-neutral | Not ready |
| Balanced split-panel composition | `LuminaBalancedSplitPanelComposition` consumed by Organizational Impact, Knowledge Genealogy, Consumer Intelligence, Organizational Memory, Canonical Knowledge, and Canonical Review | 6 | High | Certified | Stable | Domain-neutral at composition level | Extracted and regression-certified |
| Asymmetric detail-panel composition | Repeated domain-tuned split ratios such as `1.45fr/.55fr`, `1.38fr/.62fr`, and `1.42fr/.58fr` | Medium | Medium | Emerging | Experimental | Often workspace-specific | Not ready |
| Executive ribbon | Existing `LuminaExecutiveRibbon` and Knowledge Executive Ribbon usage | Multiple | High | Certified | Stable | Domain-neutral | Ready after regression baseline |
| Executive operations deck | Existing `LuminaExecutiveOperationsDeck` and certified executive workspace usage | Multiple | High | Certified | Stable | Domain-neutral | Ready after regression baseline |
| Section header block | Eyebrow, title, description, optional icon, optional right-side posture card | High | Medium-high | Stable | Needs consolidation | Domain-neutral when content is injected | Candidate after panel primitives |
| Panel header | Icon, eyebrow, heading, optional badge/action | High | Medium-high | Stable | Needs consolidation | Domain-neutral | Candidate after icon and surface primitives |
| Status badge | Repeated rounded status pills across Knowledge, Runtime, diagnostics, and audit surfaces | High | Medium | Stable | Needs consolidation | Domain-neutral | Candidate after state-token audit |
| State surface | Warning, healthy, active, restricted, error, pending, superseded, archived visual treatments | High | Medium | Stable | Needs consolidation | Domain-neutral | Candidate after semantic token audit |
| Warning surface | Repeated amber/rose alert and review-required surfaces | High | Medium | Stable | Needs consolidation | Domain-neutral | Candidate after state-token audit |
| Activity feed row | Repeated event/history/log/feed rows across Knowledge, Runtime, and diagnostics | Medium-high | Medium | Stable | Needs consolidation | Domain-neutral at row level | Candidate after panel and state primitives |
| Timeline card | Governance timeline, memory evolution, event history, runtime event stream | Medium | Medium | Emerging | Needs consolidation | Mixed | Not ready |
| Inspector shell | Knowledge Capsule Inspector, Runtime Inspector, Repo Audit detail regions, developer/designer side detail panes | Medium | Medium | Emerging | Experimental | Domain-owned compositions | Not ready |
| Command bar | Runtime toolbar, developer/designer controls, audit controls | Medium | Low-medium | Emerging | Experimental | Mixed | Not ready |
| Filter bar | Knowledge filters, audit filters, runtime filters, workspace controls | Medium | Low-medium | Emerging | Experimental | Mixed | Not ready |
| Graph/topology container | Knowledge Distribution topology, capsule flow, repository graphs, runtime relationship views | Medium | Low | Workspace-specific | Experimental | Domain-owned | Not ready |
| Empty state | Runtime, diagnostics, developer/designer, and other workspace fallbacks | Medium | Low-medium | Emerging | Experimental | Domain-neutral potential | Not ready |
| Loading state | Suspense fallbacks, runtime loading, diagnostics refresh/loading surfaces | Medium | Low-medium | Emerging | Experimental | Domain-neutral potential | Not ready |
| Detail panel | Repeated card-and-section compositions showing selected entity details | High | Medium | Stable | Needs consolidation | Frequently domain-owned | Underlying shell only may qualify later |
| Lifecycle card | Knowledge lifecycle cards and governance-stage cards | High within Knowledge | High | Workspace-specific | Stable locally | Domain-Owned: Knowledge/Governance | Do not extract |
| Knowledge Capsule | `KnowledgeCapsule` | Multiple within Knowledge | High | Workspace-specific | Stable | Domain-Owned: Knowledge | Do not extract |
| Knowledge Capsule Flow Engine | `KnowledgeCapsuleFlowEngine` | Knowledge flagship | High | Workspace-specific | Stable | Domain-Owned: Knowledge | Do not extract |
| Knowledge Capsule Inspector | `KnowledgeCapsuleInspector` | Knowledge flagship | High | Workspace-specific | Stable | Domain-Owned: Knowledge | Do not extract |
| Knowledge Distribution Hub | `KnowledgeDistributionHub` | Knowledge flagship | High | Workspace-specific | Stable | Domain-Owned: Knowledge | Do not extract |
| Canonical Review | Knowledge flagship | Single domain workspace | High | Workspace-specific | Stable | Domain-Owned: Governance/Knowledge | Do not extract |
| Canonical Knowledge | Knowledge flagship | Single domain workspace | High | Workspace-specific | Stable | Domain-Owned: Knowledge | Do not extract |
| Organizational Memory | Knowledge flagship | Single domain workspace | High | Workspace-specific | Stable | Domain-Owned: Knowledge | Do not extract |
| Consumer Intelligence | Knowledge flagship | Single domain workspace | High | Workspace-specific | Stable | Domain-Owned: Knowledge | Do not extract |
| Knowledge Genealogy | Knowledge flagship | Single domain workspace | High | Workspace-specific | Stable | Domain-Owned: Knowledge | Do not extract |
| Organizational Impact | Knowledge flagship | Single domain workspace | High | Workspace-specific | Stable | Domain-Owned: Knowledge | Do not extract |
| Runtime Header | Runtime Operations | Single domain workspace with unrelated local modification | Not assessed | Not Ready | Experimental | Domain-Owned: Runtime | Do not extract |
| Runtime Inspector | Runtime Operations | Runtime domain | Medium | Workspace-specific | Experimental | Domain-Owned: Runtime | Do not extract |
| Runtime Event Stream | Runtime Operations and diagnostics | Medium | Medium | Emerging | Needs consolidation | Domain-Owned presentation with possible neutral feed row | Do not extract directly |
| Runtime Diagnostics workspace | Runtime domain | Certified workspace | High locally | Workspace-specific | Stable locally | Domain-Owned: Runtime | Do not extract |
| Repo Audit workspace | Repository domain | Certified workspace | High locally | Workspace-specific | Stable locally | Domain-Owned: Repo Audit | Do not extract |
| Admin workspace | Administration domain | Certified workspace | High locally | Workspace-specific | Stable locally | Domain-Owned: Admin | Do not extract |
| Developer workspace | Developer domain | Certified workspace | High locally | Workspace-specific | Stable locally | Domain-Owned: Developer | Do not extract |
| Designer workspace | Designer domain | Certified workspace | High locally | Workspace-specific | Stable locally | Domain-Owned: Designer | Do not extract |

## Cross-Workspace Usage Matrix

Legend:

- `✓` — repeated and visually convergent
- `~` — present with meaningful variation
- `—` — not evidenced or not applicable
- Ready values refer only to future extraction candidacy

| Pattern | Knowledge | Runtime | Admin | Repo Audit | Developer | Designer | Ready |
|---|---:|---:|---:|---:|---:|---:|---|
| Premium surface tokens | ✓ | ✓ | ~ | ~ | ~ | ~ | Certified |
| Electric contour tokens | ✓ | ✓ | ~ | ~ | ~ | ~ | Certified |
| Executive metric card | ✓ | ✓ | ~ | ~ | — | — | Certified |
| Executive metric grid | ✓ | ✓ | ~ | ~ | — | — | Certified |
| Executive premium icon | ✓ | ✓ | ~ | ~ | ~ | ~ | Certified |
| Executive ribbon | ✓ | ✓ | ~ | — | — | — | Certified |
| Executive operations deck | ✓ | ✓ | — | — | — | — | Certified |
| Executive title-and-metrics composition | ✓ | ~ | — | — | — | — | Certified |
| Standard premium panel | ✓ | ✓ | ~ | ~ | ~ | ~ | Certified |
| Standard premium card | ✓ | ✓ | ~ | ~ | ~ | ~ | Certified |
| Balanced split-panel composition | ✓ | ✓ | ~ | ~ | ~ | ~ | Certified |
| Panel header | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Stable |
| Status badge | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Stable |
| State surface | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Stable |
| Warning surface | ✓ | ✓ | ✓ | ✓ | ~ | ~ | Stable |
| Activity feed row | ✓ | ✓ | ~ | ✓ | ~ | ~ | Stable |
| Timeline card | ✓ | ✓ | — | ~ | — | — | Emerging |
| Inspector shell | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | Emerging |
| Command bar | ~ | ✓ | ~ | ✓ | ✓ | ✓ | Emerging |
| Filter bar | ✓ | ~ | ~ | ✓ | ✓ | ✓ | Emerging |
| Empty state | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | Emerging |
| Loading state | ~ | ✓ | ✓ | ✓ | ✓ | ✓ | Emerging |
| Graph/topology container | ✓ | ~ | — | ~ | — | — | Workspace-specific |
| Lifecycle card | ✓ | — | — | — | — | — | Domain-Owned |

## Duplication Audit

### Certified duplicate families

1. **Executive metric composition**
   - Repeated use of `LuminaExecutiveCard`.
   - Repeated use of `LuminaExecutiveMetricGrid`.
   - Stable icon, title, value, description, accent, and grid-column contract.
   - Already centralized and certified.

2. **Executive composition system**
   - `LuminaExecutiveRibbon`.
   - `LuminaExecutiveOperationsDeck`.
   - Repeated executive visual hierarchy across Knowledge and Runtime.
   - Already centralized and certified.

### Stable duplicated implementations

1. **Prominent panel composition**
   - Centralized as `LuminaProminentPremiumPanel`.
   - Contract:
     - `rounded-[28px] p-6`
     - `premiumSurfaces.base.panel`
     - `electricContour.strength.prominent`
   - Migrated one certified consumer at a time across six Knowledge lifecycle workspaces.
   - Regression Safety Gate passed after every migration.

2. **Standard panel composition**
   - Centralized as `LuminaStandardPremiumPanel`.
   - Contract:
     - `rounded-[26px] p-5`
     - `premiumSurfaces.base.panel`
     - `electricContour.strength.standard`
   - Migrated one certified consumer at a time across six Knowledge lifecycle workspaces.
   - Regression Safety Gate passed after every migration.
   - Knowledge Distribution Hub remains excluded because its distinct contract is `rounded-[24px] p-5`.

3. **Standard card composition**
   - Centralized as `LuminaStandardPremiumCard`.
   - Contract:
     - semantic element: `div` by default
     - optional semantic element: `article`
     - `rounded-[18px] p-4`
     - `premiumSurfaces.base.card`
     - `electricContour.strength.standard`
   - Migrated one certified consumer at a time across six Knowledge lifecycle consumers.
   - Regression Safety Gate passed after every migration.

4. **Side-by-side title and metric composition**
   - Centralized as `LuminaExecutiveTitleMetricsComposition`.
   - Contract:
     - base layout: `grid items-stretch gap-5`
     - responsive stacking below `xl`
     - injected `titleRegion`
     - injected `metricsRegion`
     - `balanced`: `xl:grid-cols-2`
     - `balanced-explicit`: `xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`
     - `content-led`: `xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)]`
   - Migrated one certified consumer at a time across six Knowledge lifecycle workspaces.
   - Regression Safety Gate passed after every migration.
   - Domain content, panels, metric cards, typography, behavior, and inner responsive layout remain consumer-owned.

5. **Balanced dual-panel section**
   - Centralized as `LuminaBalancedSplitPanelComposition`.
   - Contract:
     - `grid items-stretch gap-5 xl:grid-cols-2`
     - responsive stacking below `xl`
     - injected `primaryRegion`
     - injected `secondaryRegion`
     - optional caller-provided `className`
   - Migrated one certified consumer at a time across six Knowledge lifecycle workspaces.
   - Regression Safety Gate passed after every migration.
   - Domain content, panel ownership, inner responsive structure, asymmetric layouts, and behavior remain consumer-owned.

6. **Panel header block**
   - Repeated icon, uppercase eyebrow, title, and optional badge.
   - Visual convergence is high.
   - API is not yet explicit.

7. **Status and state treatments**
   - Repeated pills and semantic surfaces.
   - Visual vocabulary converges, but color/state mappings remain distributed.
   - Requires semantic-token audit before extraction.

## Domain-Owned Registry

The following remain workspace-owned and must not be promoted directly:

### Knowledge

- Knowledge Capsule
- Knowledge Capsule Flow Engine
- Knowledge Capsule Inspector
- Canonical Review
- Canonical Knowledge
- Organizational Memory
- Knowledge Distribution and Consumption Hub
- Consumer Intelligence
- Knowledge Genealogy
- Organizational Impact
- Governance chains
- Canonical collections
- Supersession and retirement compositions
- Provenance and lineage compositions

### Runtime

- Runtime Header
- Runtime Project List
- Runtime Inspector
- Runtime Toolbar
- Runtime Event Stream
- Runtime lifecycle and process-state compositions
- Runtime Diagnostics workspace

### Repository and administration

- Repo Audit workspace and repository-specific findings
- Admin workspace and administration-specific controls

### Builder workspaces

- Developer Workspace
- Designer Workspace
- Preview orchestration
- Code editor, designer canvas, and domain-specific inspector compositions

## API Stability Audit

| Candidate | Classification | Evidence |
|---|---|---|
| `premiumSurfaces` | Stable | Existing centralized token contract and broad usage |
| `electricContour` | Stable | Existing centralized token contract and broad usage |
| `LuminaExecutiveCard` | Stable | Repeated certified consumption with consistent props |
| `LuminaExecutiveMetricGrid` | Stable | Repeated certified consumption with explicit column contract |
| `ExecutivePremiumIcon` | Stable | Repeated state-based icon contract |
| `LuminaExecutiveRibbon` | Stable | Existing reusable implementation and certified consumers |
| `LuminaExecutiveOperationsDeck` | Stable | Existing reusable implementation and certified consumers |
| `LuminaProminentPremiumPanel` | Stable | Explicit shared semantic header contract with six certified consumers and completed regression validation |
| `LuminaExecutiveTitleMetricsComposition` | Stable | Explicit region-based composition contract with three certified layout variants and six regression-certified Knowledge consumers |
| `LuminaStandardPremiumPanel` | Stable | Explicit shared component contract with six certified consumers and completed regression validation |
| `LuminaStandardPremiumCard` | Stable | Explicit shared semantic card contract with six certified consumers and completed regression validation |
| Executive title-and-metrics composition | Needs consolidation | Stable visual pattern, varying local ratios and content structure |
| Balanced split-panel composition | Needs consolidation | Repeated layout contract, not centrally owned |
| Panel header | Needs consolidation | Consistent structure but no stable prop contract |
| Status badge | Needs consolidation | Repeated visuals, distributed state mapping |
| State surface | Needs consolidation | Repeated visual semantics, distributed implementation |
| Activity feed row | Needs consolidation | Cross-workspace convergence with varying metadata |
| Timeline card | Experimental | Different hierarchy and interaction semantics |
| Inspector shell | Experimental | Different pane widths, controls, selection behavior, and domain semantics |
| Command bar | Experimental | Significant workspace-specific behavior |
| Filter bar | Experimental | Significant workspace-specific filtering models |
| Empty state | Experimental | Inconsistent hierarchy and action contracts |
| Loading state | Experimental | Inconsistent skeleton and progress contracts |
| Graph/topology container | Experimental | Domain-specific geometry and interaction |

## Primitive Dependency Graph

Future certification and extraction order must follow this sequence:

1. **Foundation tokens**
   - `premiumSurfaces`
   - `electricContour`
   - typography, spacing, radius, and semantic state tokens

2. **Atomic visual primitives**
   - premium panel
   - prominent panel
   - premium card
   - compact card
   - status badge
   - warning/state surface
   - panel header

3. **Atomic executive primitives**
   - `ExecutivePremiumIcon`
   - `LuminaExecutiveCard`
   - `LuminaExecutiveMetricGrid`

4. **Low-level layouts**
   - balanced two-column panel layout
   - responsive metric composition
   - section stack
   - activity row layout

5. **Executive compositions**
   - title-and-metrics composition
   - `LuminaExecutiveRibbon`
   - `LuminaExecutiveOperationsDeck`

6. **Higher-level reusable structures**
   - activity feed
   - timeline
   - empty/loading state systems
   - inspector shell
   - command and filter bars

7. **Workspace migrations**
   - one visually certified consumer at a time
   - no batch migration
   - no cross-domain migration until each prior consumer is approved

Domain-owned lifecycle, graph, topology, runtime, repository, admin, developer, and designer compositions remain outside this extraction graph.

## Regression Safety Gate

Extraction is prohibited until this gate is satisfied.

### Baseline requirements

Before any primitive extraction:

1. Record branch and exact HEAD.
2. Record all existing local modifications.
3. Establish a clean rollback commit.
4. Capture production screenshots for every certified consumer workspace.
5. Record supported viewport widths and interaction states.
6. Run:
   - `git diff --check`
   - `npm run build`
   - `git status --short`
   - `git diff --stat`
7. Confirm the candidate primitive’s complete consumer list.
8. Confirm its current rendering contract.
9. Confirm semantic neutrality.
10. Confirm dependency order.
11. Obtain explicit approval to begin extraction.

### Extraction constraints

During extraction:

1. Extract one primitive only.
2. Do not redesign.
3. Do not rename unrelated APIs.
4. Do not alter semantics or behavior.
5. Do not migrate multiple consumers simultaneously.
6. Create the primitive before changing any consumer.
7. Run `npm run build` after primitive creation.
8. Migrate one certified workspace.
9. Run `git diff --check` and `npm run build`.
10. Perform visual comparison against the baseline.
11. Obtain explicit visual approval.
12. Commit the single logical migration.
13. Push before migrating the next consumer.
14. Stop immediately on any regression involving:
    - spacing
    - dimensions
    - alignment
    - typography
    - responsive behavior
    - state rendering
    - hover
    - focus
    - selection
    - disabled state
    - loading
    - empty state
    - warning
    - error
    - interaction behavior
    - accessibility
15. Never modify unrelated files.

### Post-extraction requirements

After each consumer migration:

1. Compare the migrated workspace against its certified screenshot baseline.
2. Validate all supported viewport widths.
3. Validate every applicable state:
   - default
   - hover
   - focus
   - selected
   - disabled
   - loading
   - empty
   - warning
   - error
4. Run:
   - `git diff --check`
   - `npm run build`
   - `git status --short`
   - `git diff --stat`
5. Confirm no unrelated file changed.
6. Obtain explicit visual approval.
7. Commit and push the single migration.
8. Record the new rollback commit.
9. Do not continue until the prior migration is certified green.

### Automatic extraction stop conditions

Extraction must stop when:

- visual parity cannot be demonstrated
- the candidate reveals domain-specific semantics
- multiple APIs must be redesigned
- a workspace requires behavior changes
- responsive behavior diverges
- state handling is incomplete
- the build fails
- unrelated files change
- the user has not explicitly approved the prior milestone

## Certified Primitive Registry

### LPR-001 — Premium Surface Tokens

- Primitive name: Premium Surface Tokens
- Current locations: Existing Lumina Design System and repeated workspace consumption
- Owner: Lumina Design System
- Maturity: Certified
- Consumers: Knowledge, Runtime, selected Admin and Repo Audit surfaces
- Dependencies: None
- Semantic boundary: Domain-neutral
- Extraction readiness: Already centralized; future changes require regression certification
- Evidence: Broad repeated `premiumSurfaces` consumption

### LPR-002 — Electric Contour Tokens

- Primitive name: Electric Contour Tokens
- Current locations: Existing Lumina Design System and repeated premium workspace consumption
- Owner: Lumina Design System
- Maturity: Certified
- Consumers: Knowledge, Runtime, selected Admin and Repo Audit surfaces
- Dependencies: None
- Semantic boundary: Domain-neutral
- Extraction readiness: Already centralized; future changes require regression certification
- Evidence: Broad repeated `electricContour` consumption

### LPR-003 — Executive Metric Card

- Primitive name: Executive Metric Card
- Current locations: `LuminaExecutiveCard`
- Owner: Lumina Design System
- Maturity: Certified
- Consumers: Knowledge lifecycle and executive workspaces
- Dependencies: Premium surface and contour tokens
- Semantic boundary: Domain-neutral
- Extraction readiness: Already centralized
- Evidence: Repeated stable title, value, description, accent, and icon contract

### LPR-004 — Executive Metric Grid

- Primitive name: Executive Metric Grid
- Current locations: `LuminaExecutiveMetricGrid`
- Owner: Lumina Design System
- Maturity: Certified
- Consumers: Canonical Review, Canonical Knowledge, Organizational Memory, Consumer Intelligence, Knowledge Genealogy, Organizational Impact, and other executive surfaces
- Dependencies: Executive Metric Card
- Semantic boundary: Domain-neutral
- Extraction readiness: Already centralized
- Evidence: Repeated stable column-based layout contract

### LPR-005 — Executive Premium Icon

- Primitive name: Executive Premium Icon
- Current locations: `ExecutivePremiumIcon`
- Owner: Lumina Design System
- Maturity: Certified
- Consumers: Knowledge lifecycle, Runtime, and executive workspace panels
- Dependencies: Semantic state tokens
- Semantic boundary: Domain-neutral
- Extraction readiness: Already centralized
- Evidence: Repeated icon plus state rendering contract

### LPR-006 — Executive Ribbon

- Primitive name: Executive Ribbon
- Current locations: `LuminaExecutiveRibbon`
- Owner: Lumina Design System
- Maturity: Certified
- Consumers: Knowledge and Runtime executive compositions
- Dependencies: Surface tokens, contour tokens, executive metric primitives
- Semantic boundary: Domain-neutral
- Extraction readiness: Already centralized
- Evidence: Existing reusable implementation with certified consumers

### LPR-007 — Executive Operations Deck

- Primitive name: Executive Operations Deck
- Current locations: `LuminaExecutiveOperationsDeck`
- Owner: Lumina Design System
- Maturity: Certified
- Consumers: Knowledge and Runtime executive compositions
- Dependencies: Executive card and layout primitives
- Semantic boundary: Domain-neutral
- Extraction readiness: Already centralized
- Evidence: Existing reusable implementation with certified consumers

### LPR-008 — Standard Premium Panel

- Primitive name: Standard Premium Panel
- Current locations: Repeated local `panelClass` definitions
- Owner: Candidate for Lumina Design System
- Maturity: Certified
- Consumers: Knowledge lifecycle and other premium workspaces
- Dependencies: Premium surface and contour tokens
- Semantic boundary: Domain-neutral
- Extraction readiness: Certified for future extraction after screenshot baselines and Regression Safety Gate completion
- Evidence: High repetition of `rounded-[26px] p-5`, base panel, and standard contour
- Certified baseline: Current production implementation
- Certified rendering contract:
  - `rounded-[26px] p-5`
  - `premiumSurfaces.base.panel`
  - `electricContour.strength.standard`
- Permitted extraction delta: Ownership and import location only
- Permitted visual delta during extraction: None
- Permitted behavioral delta during extraction: None
- Permitted responsive delta during extraction: None
- Future polish: Permitted only as a separate visual refinement milestone with its own baseline, build, visual validation, approval, commit, and push
- Baseline authority: The latest explicitly approved production rendering remains authoritative until a later polish milestone is separately certified

### LPR-009 — Prominent Premium Panel

- Primitive name: Prominent Premium Panel
- Current locations: Repeated local `prominentPanelClass` definitions
- Owner: Candidate for Lumina Design System
- Maturity: Certified
- Consumers: Knowledge lifecycle title panels and other premium workspace headers
- Dependencies: Premium surface and contour tokens
- Semantic boundary: Domain-neutral
- Extraction readiness: Certified for future extraction after screenshot baselines and Regression Safety Gate completion
- Evidence: High repetition of `rounded-[28px] p-6`, base panel, and prominent contour
- Certified baseline: Current production implementation
- Certified rendering contract:
  - `rounded-[28px] p-6`
  - `premiumSurfaces.base.panel`
  - `electricContour.strength.prominent`
- Permitted extraction delta: Ownership and import location only
- Permitted visual delta during extraction: None
- Permitted behavioral delta during extraction: None
- Permitted responsive delta during extraction: None
- Future polish: Permitted only as a separate visual refinement milestone with its own baseline, build, visual validation, approval, commit, and push
- Baseline authority: The latest explicitly approved production rendering remains authoritative until a later polish milestone is separately certified

### LPR-010 — Standard Premium Card

- Primitive name: Standard Premium Card
- Current locations: Repeated local `cardClass` definitions
- Owner: Candidate for Lumina Design System
- Maturity: Certified
- Consumers: Knowledge, Runtime, diagnostics, audit, admin, developer, and designer surfaces
- Dependencies: Premium surface and contour tokens
- Semantic boundary: Domain-neutral
- Extraction readiness: Certified for future extraction after screenshot baselines and Regression Safety Gate completion
- Evidence: High repetition of `rounded-[18px] p-4`, base card, and standard contour
- Certified baseline: Current production implementation
- Certified rendering contract:
  - `rounded-[18px] p-4`
  - `premiumSurfaces.base.card`
  - `electricContour.strength.standard`
- Permitted extraction delta: Ownership and import location only
- Permitted visual delta during extraction: None
- Permitted behavioral delta during extraction: None
- Permitted responsive delta during extraction: None
- Future polish: Permitted only as a separate visual refinement milestone with its own baseline, build, visual validation, approval, commit, and push
- Baseline authority: The latest explicitly approved production rendering remains authoritative until a later polish milestone is separately certified

### LPR-011 — Executive Title and Metrics Composition

- Primitive name: Executive Title and Metrics Composition
- Current locations: Canonical Review, Canonical Knowledge, Organizational Memory, Consumer Intelligence, Knowledge Genealogy, Organizational Impact
- Owner: Candidate for Lumina Design System
- Maturity: Certified
- Consumers: Knowledge flagship; potential Runtime consumer after separate certification
- Dependencies: Prominent Premium Panel, Executive Metric Grid, responsive split layout
- Semantic boundary: Domain-neutral only when title, description, posture content, metrics, and layout variant are injected
- Extraction readiness: Certified for future extraction after screenshot baselines, explicit variant preservation, and Regression Safety Gate completion
- Evidence: Six visually approved production implementations
- Certified baseline: Current production implementations
- Certified composition contract:
  - prominent title panel on the left
  - `LuminaExecutiveMetricGrid columns={2}` on the right
  - `grid items-stretch gap-5`
  - stacked layout below the certified responsive breakpoint
  - equal-height title and metric regions
- Certified responsive variants:
  - `balanced`: `xl:grid-cols-2`
  - `balanced-explicit`: `xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]`
  - `content-led`: `xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)]`
- Variant evidence:
  - `balanced`: Knowledge Genealogy, Organizational Impact
  - `balanced-explicit`: Organizational Memory
  - `content-led`: Canonical Review, Canonical Knowledge, Consumer Intelligence
- Permitted extraction delta: Ownership, import location, and explicit selection of the already-approved layout variant only
- Permitted visual delta during extraction: None
- Permitted behavioral delta during extraction: None
- Permitted responsive delta during extraction: None
- Prohibited consolidation: Do not force all consumers into one column ratio
- Future polish: Permitted only as a separate visual refinement milestone with its own baseline, build, visual validation, approval, commit, and push
- Baseline authority: Each consumer retains its latest explicitly approved production variant until a later polish milestone is separately certified

### LPR-012 — Balanced Split Panel Composition

- Primitive name: Balanced Split Panel Composition
- Current locations: Repeated `grid items-stretch gap-5 xl:grid-cols-2`
- Owner: Candidate for Lumina Design System
- Maturity: Certified
- Consumers: Knowledge lifecycle and selected Runtime/detail surfaces
- Dependencies: Standard Premium Panel
- Semantic boundary: Domain-neutral outer layout only; all panel content remains Domain-Owned
- Extraction readiness: Certified for future extraction after screenshot baselines and Regression Safety Gate completion
- Evidence: Repeated visually approved equal-width panel compositions
- Certified baseline: Current production implementations
- Certified rendering contract:
  - `grid`
  - `items-stretch`
  - `gap-5`
  - `xl:grid-cols-2`
  - single-column stacking below `xl`
  - equal-width columns at and above `xl`
  - equal-height panel participation through stretch alignment
- Permitted extraction delta: Ownership and import location only
- Permitted visual delta during extraction: None
- Permitted behavioral delta during extraction: None
- Permitted responsive delta during extraction: None
- Domain ownership rule: Titles, metrics, controls, cards, timelines, governance content, runtime content, and all other children remain owned by their workspaces
- Prohibited consolidation: Do not replace asymmetric or explicitly fractional layouts with this primitive
- Future polish: Permitted only as a separate visual refinement milestone with its own baseline, build, visual validation, approval, commit, and push
- Baseline authority: Each consumer retains its latest explicitly approved production rendering until a later polish milestone is separately certified

### LPR-013 — Panel Header

- Primitive name: Panel Header
- Current locations: Repeated icon, eyebrow, title, and optional badge or action structures
- Owner: Candidate for Lumina Design System
- Maturity: Certified
- Consumers: Knowledge, Runtime, Admin, Repo Audit, Developer, Designer
- Dependencies: Executive Premium Icon and typography tokens
- Semantic boundary: Domain-neutral structure only; all labels, titles, badges, controls, and domain language remain Domain-Owned
- Extraction readiness: Certified for future extraction after screenshot baselines, explicit variant preservation, and Regression Safety Gate completion
- Evidence: Cross-workspace structural convergence across all audited flagship workspaces
- Certified baseline: Current production implementations
- Certified structural contract:
  - optional leading icon region
  - eyebrow region
  - title region
  - optional trailing badge or action region
  - injected content only
  - no embedded workspace terminology
- Certified alignment variants:
  - `inline`: icon and text aligned with `flex items-center gap-3`
  - `top-aligned`: icon and text aligned with `flex items-start gap-3`
  - `responsive-action`: stacked by default with `sm:items-end sm:justify-between`
- Typography rule: Preserve each consumer current approved eyebrow tracking, title scale, color, and spacing
- Permitted extraction delta: Ownership, import location, and explicit selection of an already-approved structural variant only
- Permitted visual delta during extraction: None
- Permitted behavioral delta during extraction: None
- Permitted responsive delta during extraction: None
- Prohibited consolidation:
  - Do not force one title size across all consumers
  - Do not force one eyebrow tracking value across all consumers
  - Do not require an icon, badge, or action where none currently exists
  - Do not move workspace-owned actions into the shared primitive
- Future polish: Permitted only as a separate visual refinement milestone with its own baseline, build, visual validation, approval, commit, and push
- Baseline authority: Each consumer retains its latest explicitly approved production rendering until a later polish milestone is separately certified

### LPR-014 — Status Badge and State Surface

- Primitive name: Status Badge and State Surface
- Current locations: Distributed pills and state treatments across certified workspaces
- Owner: Candidate for Lumina Design System
- Maturity: Certified
- Consumers: Knowledge, Runtime, Admin, Repo Audit, Developer, Designer
- Dependencies:
  - `semanticStatusLanguage`
  - `semanticStateLanguage`
  - `semanticIconFrame`
  - `executiveIconTheme`
- Semantic boundary: Domain-neutral state vocabulary and rendering shell only; workspace state names, labels, meanings, transitions, and business rules remain Domain-Owned
- Extraction readiness: Certified for future extraction after screenshot baselines, consumer-specific state mapping inventories, and Regression Safety Gate completion
- Evidence:
  - broad repetition of rounded status pills and state surfaces
  - existing shared semantic status and state foundations
  - repeated healthy, active, warning, error, pending, restricted, superseded, archived, connected, consuming, running, starting, stopped, and failed treatments
- Certified baseline: Current production implementations
- Certified structural contract:
  - optional compact rounded badge shell
  - optional bordered state surface
  - injected label or content
  - semantic tone selected explicitly by the consumer
  - no embedded workspace terminology
- Certified semantic tone family:
  - `healthy`
  - `active`
  - `warning`
  - `error`
  - `neutral`
- Existing extended workspace states:
  - pending
  - restricted
  - superseded
  - archived
  - connected
  - consuming
  - running
  - starting
  - stopped
  - failed
- State mapping rule: Extended workspace states must map explicitly to a shared semantic tone without changing their domain meaning
- Typography rule: Preserve each consumer current approved label size, weight, tracking, casing, and spacing
- Color rule: Preserve each consumer current approved color mapping during extraction; no global recoloring is permitted
- Permitted extraction delta: Ownership, import location, and explicit mapping to an already-approved semantic tone only
- Permitted visual delta during extraction: None
- Permitted behavioral delta during extraction: None
- Permitted responsive delta during extraction: None
- Prohibited consolidation:
  - Do not rename workspace states
  - Do not collapse distinct business states into one domain state
  - Do not force one badge size or typography treatment across all consumers
  - Do not replace consumer-approved colors during extraction
  - Do not move state-transition logic into the shared visual primitive
- Future polish: Permitted only as a separate semantic and visual refinement milestone with its own baseline, build, visual validation, approval, commit, and push
- Baseline authority: Each consumer retains its latest explicitly approved state rendering until a later polish milestone is separately certified

### LPR-015 — Activity Feed Row Shell

- Primitive name: Activity Feed Row Shell
- Current locations: Knowledge history, Runtime Event Stream, Runtime Diagnostics logs/activity, Repo Audit findings
- Owner: Candidate for Lumina Design System
- Maturity: Certified
- Consumers: Knowledge, Runtime, Runtime Diagnostics, Repo Audit
- Dependencies:
  - Standard Premium Card
  - Status Badge and State Surface
  - metadata typography
- Semantic boundary: Domain-neutral row shell only; event meaning, source models, severity, timestamps, actions, selection, live updates, and accessibility behavior remain Domain-Owned
- Extraction readiness: Certified for future row-shell extraction after screenshot baselines, explicit variant inventories, and Regression Safety Gate completion
- Evidence:
  - repeated event-oriented visual hierarchy
  - repeated leading marker, description, metadata, timestamp, and state regions
  - repeated stacked row collections across four audited consumers
- Certified baseline: Current production implementations
- Certified structural contract:
  - optional leading icon or state-marker region
  - primary description region
  - optional secondary metadata region
  - optional timestamp region
  - optional trailing status or action region
  - injected content only
  - no embedded workspace terminology
- Certified presentation variants:
  - `passive`: informational row with no row-level action
  - `interactive`: row retaining its consumer-owned click, selection, hover, focus, and keyboard behavior
  - `stream`: append-oriented row used inside a consumer-owned live region
  - `log`: monospace or log-oriented content retained by the consumer
- Metadata rule: Consumers retain ownership of actors, sources, project identifiers, capsule identifiers, findings, severities, timestamps, and event descriptions
- Accessibility rule:
  - Runtime Event Stream retains its consumer-owned `aria-live` and `aria-relevant` behavior
  - interactive rows retain their existing roles, labels, selection state, focus behavior, and keyboard handling
  - the shared shell must not create a live region or interaction role implicitly
- Typography rule: Preserve each consumer current approved font family, size, weight, tracking, casing, wrapping, and spacing
- State rule: Preserve each consumer current approved semantic tone and state mapping
- Permitted extraction delta: Ownership, import location, and explicit selection of an already-approved presentation variant only
- Permitted visual delta during extraction: None
- Permitted behavioral delta during extraction: None
- Permitted responsive delta during extraction: None
- Prohibited consolidation:
  - Do not create one universal activity event model
  - Do not move event subscription or stream behavior into the shared row shell
  - Do not move log filtering, follow mode, severity filtering, or autoscroll into the shared row shell
  - Do not move Repo Audit finding actions into the shared row shell
  - Do not normalize timestamps, metadata ordering, or event language during extraction
  - Do not make passive rows interactive
  - Do not remove existing interaction or accessibility behavior from interactive rows
- Future polish: Permitted only as a separate visual or interaction refinement milestone with its own baseline, build, visual validation, accessibility validation, approval, commit, and push
- Baseline authority: Each consumer retains its latest explicitly approved production rendering and behavior until a later refinement milestone is separately certified

## Architectural Conflicts

1. Some high-repetition classes are local constants rather than shared primitives.
2. Similar panel compositions use inconsistent radii, padding, and responsive ratios.
3. State vocabulary is visually convergent but remains distributed.
4. Inspector, command bar, filter bar, loading state, and empty state APIs are not sufficiently stable.
5. Domain-owned compositions may superficially resemble reusable primitives but embed semantic meaning.
6. Existing Runtime Header has an unrelated local modification and must remain outside this audit and future extraction work until separately resolved.
7. Knowledge flagship patterns are highly certified within one domain, but cross-domain extraction still requires consumer-by-consumer validation.
8. Direct extraction of higher-order compositions before atomic surfaces would create hidden coupling and regression risk.

## Recommendations Requiring Future Certification

1. Certify the Standard Premium Panel.
2. Certify the Prominent Premium Panel.
3. Certify the Standard Premium Card.
4. Audit and certify semantic state tokens.
5. Certify the Panel Header.
6. Certify the Balanced Split Panel Composition.
7. Consolidate the Executive Title and Metrics rendering contract without redesigning it.
8. Audit Activity Feed Row metadata and state contracts.
9. Defer Inspector Shell, Command Bar, Filter Bar, Timeline, Empty State, Loading State, and Graph Container extraction.
10. Preserve all domain-owned workspace components.
11. Require the Regression Safety Gate for every future primitive and every migrated consumer.


## LPR-010 Completion Record

LPR-010 completed through one primitive-creation milestone followed by one certified consumer per migration milestone.

Certified rendering contract:

- semantic element: `div` by default
- optional semantic element: `article`
- `rounded-[18px] p-4`
- `premiumSurfaces.base.card`
- `electricContour.strength.standard`

Certified consumer inventory:

1. Organizational Impact
2. Knowledge Genealogy
3. Consumer Intelligence
4. Organizational Memory
5. Canonical Review
6. Knowledge Distribution Hub

Explicit exclusion:

- Canonical Knowledge contained no active matching JSX consumer after its unused local declaration was removed.

Completed sequence:

1. Canonical Knowledge unused-contract cleanup — `3fc50be482a6242ab00efa2892b51f2ebd14f0f1`
2. Primitive creation — `d6c52e7929480e0821dcca294de3a9d865447078`
3. Organizational Impact — `dc6cecedaacf49b19e85ba4096ad2e96d8641d21`
4. Knowledge Genealogy — `8c6d5b90542462fa776d82c5bd5aa5c653a68ffb`
5. Consumer Intelligence — `0d5e0defff67f121d242a7da1a04055244d41683`
6. Organizational Memory — `cfd81bc545a7eedfe8c171258698753443ccdb85`
7. Canonical Review — `b3edafd70e2897f0a62924d0d139ae77b1144693`
8. Knowledge Distribution Hub — `a6e160eda39fae01db4d2e73ef459781afb15cce`

Final certification:

- Shared primitive: `LuminaStandardPremiumCard`
- Certified consumers: 6
- Remaining matching local contracts: 0
- Supported semantics: `div`, `article`
- Domain content, inner layout, responsive behavior, and interactions remain consumer-owned
- Runtime Header remains excluded
