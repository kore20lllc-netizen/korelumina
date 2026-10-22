# Runtime Operations Certified UI Contract

## Authority

The visually approved Runtime Operations is the contract. The owner approved it on 2026-10-21, rebuilt in the Knowledge Operations design (WF-100): the command deck, the five sections, and the action confirmation dialog. The live Runtime service conforms to it; it does not reshape it.

Runtime Operations shows only what Runtime measures. Values Runtime does not measure (request rate, latency, error rate, environment, region) are not shown, and health is a status with its reasons, not a score.

It reuses the Executive Office's shared section, tile and pill components without changing them, so they stay under the Executive Office contract.

## Locked presentation

`scripts/runtime-operations-ui-contract.mjs` fingerprints every TSX surface under
`apps/lumina-builder/src/components/workspaces/runtime`: JSX hierarchy, Lumina primitives, `className`, layout, and the wiring badge.

## Allowed without recertification

Runtime data, service wiring, callbacks, state that does not change the presentation, and text supplied by Runtime.

## Changing the look

1. Make the change and look at it.
2. The owner approves it visually.
3. Run `npm run certify:runtime-operations-ui-contract` and commit the updated `docs/ui-contracts/runtime-operations-certified-ui.json` with the change.

`npm run build` runs `verify:runtime-operations-ui-contract`, so an uncertified change to Runtime Operations fails the build. The other contracts are separate and unchanged.
