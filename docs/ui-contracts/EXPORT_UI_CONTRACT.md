# Export Window Certified UI Contract

## Authority

The visually approved Export window ("Take your project") is the contract. The owner approved it on 2026-10-23, in the Knowledge Operations design (MS-2026-0017, ADR-0047): the download section with the project's file count and size, the notice naming the .env files left out because they hold keys, and the notice that saving to the customer's own GitHub arrives with Connected accounts. It opens from each project card and from the Developer deck.

It shows only what Runtime reports. The download is the project as it is now in KoreLumina, without .env files (except .env.example), dependencies, build output, .git or symbolic links.

## Locked presentation

`scripts/export-ui-contract.mjs` fingerprints every TSX surface under `apps/lumina-builder/src/components/export`: JSX hierarchy, Lumina primitives, `className` and other `*ClassName` attributes, and layout.

## Allowed without recertification

Runtime data, service wiring, callbacks, state that does not change the presentation, and text supplied by Runtime.

## Changing the look

1. Make the change and look at it.
2. The owner approves it visually.
3. Run `npm run certify:export-ui-contract` and commit the updated `docs/ui-contracts/export-certified-ui.json` with the change.

`npm run build` runs `verify:export-ui-contract`, so an uncertified change to the Export window fails the build. The other contracts are separate and unchanged.
