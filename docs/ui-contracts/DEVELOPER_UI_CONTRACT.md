# Developer Workspace Certified UI Contract

## Authority

The visually approved Developer workspace is the contract. The owner approved it on 2026-10-23, rebuilt in the Knowledge Operations design (MS-2026-0011): the command deck with its server, open-file and AI readings; the explorer; the editor with its status bar; and the right-hand panel with the project preview, the server logs and AI Assist. Runtime's files, dev server, logs and AI drafts conform to it; they do not reshape it.

It shows only what is real. AI Assist drafts changes with the model Runtime is configured for, shows every file as a diff and writes nothing until applied; without a model it says its drafts are rule-based. Build, which only announced a build, is replaced by restarting the dev server. The status bar reports the editor's own syntax findings, never a blanket "no errors".

The KoreLumina AI mark (`components/ai/LuminaAIMark.tsx`), the living Lumina form shown wherever AI works, is certified with this workspace.

## Locked presentation

`scripts/developer-ui-contract.mjs` fingerprints every TSX surface under
`apps/lumina-builder/src/components/workspaces/developer` and `apps/lumina-builder/src/components/ai`: JSX hierarchy, Lumina primitives, `className` and other `*ClassName` attributes, and layout.

## Allowed without recertification

Runtime data, service wiring, callbacks, state that does not change the presentation, and text supplied by Runtime.

## Changing the look

1. Make the change and look at it.
2. The owner approves it visually.
3. Run `npm run certify:developer-ui-contract` and commit the updated `docs/ui-contracts/developer-certified-ui.json` with the change.

`npm run build` runs `verify:developer-ui-contract`, so an uncertified change to the Developer workspace fails the build. The other contracts are separate and unchanged.
