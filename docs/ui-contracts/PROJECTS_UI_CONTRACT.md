# Projects Dashboard Certified UI Contract

## Authority

The visually approved Projects dashboard is the contract. The owner approved it on 2026-10-23, rebuilt in the Knowledge Operations design (WF-100): the command deck, the project cards with their search, sort and origin filters, their Export action (recertified 2026-10-23), and the delete confirmation. Runtime's projects, runtime states, audits and repairs conform to it; they do not reshape it.

It shows only what Runtime records. Actions that do not exist yet (duplicate, rename) are not offered.

## Locked presentation

`scripts/projects-ui-contract.mjs` fingerprints every TSX surface under
`apps/lumina-builder/src/components/workspaces/projects`: JSX hierarchy, Lumina primitives, `className` and other `*ClassName` attributes, and layout.

## Allowed without recertification

Runtime data, service wiring, callbacks, state that does not change the presentation, and text supplied by Runtime.

## Changing the look

1. Make the change and look at it.
2. The owner approves it visually.
3. Run `npm run certify:projects-ui-contract` and commit the updated `docs/ui-contracts/projects-certified-ui.json` with the change.

`npm run build` runs `verify:projects-ui-contract`, so an uncertified change to the Projects dashboard fails the build. The other contracts are separate and unchanged.
