# Transform App → Website Certified UI Contract

## Authority

The visually approved Transform wizard is the contract. The owner approved it on 2026-10-23, rebuilt in the Knowledge Operations design (MS-2026-0011): the dialog with its stepper, and the analysis, plan, build progress, draft review and done screens. Runtime's analysis, the AI plan, the build job and the draft conform to it; they do not reshape it.

It shows only what is real. The analysis is read from the project's files; the plan comes from the configured model and never takes a route or file the app already has; the build's progress is the job's real steps; the whole draft is shown before it is applied, all or nothing, with undo. Facts the AI does not know are visible [placeholders]. Free accounts are told Transform is included from Pro and that the $49 unlock arrives with checkout; nothing is charged.

## Locked presentation

`scripts/transform-ui-contract.mjs` fingerprints `apps/lumina-builder/src/components/transform/TransformModal.tsx` and every TSX surface under `apps/lumina-builder/src/components/transform/sections`: JSX hierarchy, Lumina primitives, `className` and other `*ClassName` attributes, and layout.

## Allowed without recertification

Runtime data, service wiring, callbacks, state that does not change the presentation, and text supplied by Runtime.

## Changing the look

1. Make the change and look at it.
2. The owner approves it visually.
3. Run `npm run certify:transform-ui-contract` and commit the updated `docs/ui-contracts/transform-certified-ui.json` with the change.

`npm run build` runs `verify:transform-ui-contract`, so an uncertified change to the Transform wizard fails the build. The other contracts are separate and unchanged.
