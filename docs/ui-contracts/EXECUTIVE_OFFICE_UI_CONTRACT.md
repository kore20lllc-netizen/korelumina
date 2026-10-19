# Executive Office Certified UI Contract

## Authority

The visually approved Executive Office is the contract. Runtime reads, writes, and services conform to it; they do not reshape it.

Knowledge Operations is the reference for design language (materials, premium icons, flagship panels, section navigator). It is not the reference for layout: each workspace arranges its panels for its own job.

## Locked presentation

`scripts/executive-ui-contract.mjs` fingerprints every TSX surface under
`apps/lumina-builder/src/components/workspaces/executive`: JSX hierarchy, Lumina primitives, `className`, layout, and the wiring badge (design preview, partly live, live).

## Allowed without recertification

Runtime data, service wiring, callbacks, state that does not change the presentation, and text supplied by Runtime.

## Changing the look

1. Make the change and look at it.
2. The owner approves it visually.
3. Run `npm run certify:executive-ui-contract` and commit the updated `docs/ui-contracts/executive-office-certified-ui.json` with the change.

`npm run build` runs `verify:executive-ui-contract`, so an uncertified change to the Executive Office fails the build. The Knowledge Operations contract is separate and unchanged.
