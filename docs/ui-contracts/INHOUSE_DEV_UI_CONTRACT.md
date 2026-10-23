# In-House Dev Certified UI Contract

## Authority

The visually approved In-House Dev console is the contract. The owner approved it on 2026-10-23, rebuilt in the Knowledge Operations design (WF-100): the command deck, the Engagements repair queue with its action forms and detail panels, and the Attention, Tools and Projects sections. Runtime's repair queue, projects, audits and missions conform to it; they do not reshape it.

Every value it shows is read from Runtime. Mobile packaging is listed as not built, because no Runtime service exists for it.

## Locked presentation

`scripts/inhouse-dev-ui-contract.mjs` fingerprints every TSX surface under
`apps/lumina-builder/src/components/workspaces/inhouse`: JSX hierarchy, Lumina primitives, `className` and other `*ClassName` attributes, and layout.

## Allowed without recertification

Runtime data, service wiring, callbacks, state that does not change the presentation, and text supplied by Runtime.

## Changing the look

1. Make the change and look at it.
2. The owner approves it visually.
3. Run `npm run certify:inhouse-dev-ui-contract` and commit the updated `docs/ui-contracts/inhouse-dev-certified-ui.json` with the change.

`npm run build` runs `verify:inhouse-dev-ui-contract`, so an uncertified change to In-House Dev fails the build. The other contracts are separate and unchanged.
