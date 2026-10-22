# Import Window Certified UI Contract

## Authority

The visually approved Import window is the contract. The owner approved it on 2026-10-22, restyled in the Knowledge Operations design (WF-100): the header, the source tabs (GitHub, Git, ZIP, folder, templates), the URL and access token fields, the archive and folder panels, the progress, file list and success panels, and the drop overlay. The Runtime import service conforms to it; it does not reshape it.

Every import it shows is real: git imports and uploaded archives (.zip, .tar.gz, .tgz) and folders are performed by Runtime, and each file's result is Runtime's.

## Locked presentation

`scripts/import-ui-contract.mjs` fingerprints every TSX surface under
`apps/lumina-builder/src/components/import`: JSX hierarchy, Lumina primitives, `className` and other `*ClassName` attributes, and layout.

## Allowed without recertification

Import wiring, callbacks, state that does not change the presentation, and text supplied by Runtime.

## Changing the look

1. Make the change and look at it.
2. The owner approves it visually.
3. Run `npm run certify:import-ui-contract` and commit the updated `docs/ui-contracts/import-certified-ui.json` with the change.

`npm run build` runs `verify:import-ui-contract`, so an uncertified change to the Import window fails the build. The other contracts are separate and unchanged.
