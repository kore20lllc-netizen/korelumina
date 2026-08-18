# Knowledge Operations Certified UI Contract

## Authority

The visually approved Knowledge Operations UI is the contract.

Runtime services, persistence, projections, adapters, read models, and backend behavior must conform to the certified presentation. They may not reshape the presentation to accommodate backend state.

## Locked presentation

The automated contract protects:

- JSX presentation hierarchy
- Lumina primitive selection
- panel and card composition
- `className` presentation rules
- layout variants
- column contracts
- material ownership
- spacing and geometry
- overflow behavior
- interaction-surface structure

The lock covers every TSX surface under:

`apps/lumina-builder/src/components/workspaces/knowledge/production`

and the shared Lumina primitives/compositions used as certified material authorities.

## Allowed without UI recertification

The following may evolve when they do not alter the presentation fingerprint:

- runtime data
- persistence
- API/service wiring
- projection/read-model logic
- callbacks
- state management
- identifiers
- metric values
- labels populated from runtime state
- unavailable-state handling

## Forbidden without explicit visual approval

Do not silently change:

- primitive families
- glass/material composition
- panel or card geometry
- rails
- spacing
- widths/heights
- grid structure
- overflow or scrolling behavior
- nested-card composition
- presentation variants

## Enforcement

Run:

`npm run verify:knowledge-ui-contract`

The root `npm run build` executes this verification automatically.

A presentation change fails the build.

## Recertification

Do not regenerate the baseline merely to make a failing build pass.

Only after an intentional UI change has been visually inspected and explicitly approved may the certified fingerprint be replaced with:

`npm run certify:knowledge-ui-contract`

The regenerated contract must be committed in the same single-purpose UI certification milestone.
