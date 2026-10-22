# Repo Audit Certified UI Contract

## Authority

The visually approved Repo Audit is the contract. The owner approved it on 2026-10-21: the command deck, the nine sections, and the client report dialog. The Repository Intelligence engine and its API conform to it; they do not reshape it.

Knowledge Operations is the reference for design language (materials, premium icons, flagship panels, section navigator). Repo Audit uses the Executive Office's arrangement: a command deck on top, a sticky section navigator, then flagship sections in a two-column grid. It reuses the Executive Office's shared section, tile and pill components without changing them, so they stay under the Executive Office contract.

## Locked presentation

`scripts/repo-audit-ui-contract.mjs` fingerprints every TSX surface under
`apps/lumina-builder/src/components/workspaces/repo-audit`: JSX hierarchy, Lumina primitives, `className`, layout, and the wiring badge.

## Allowed without recertification

Runtime data, service wiring, callbacks, state that does not change the presentation, text supplied by Runtime, and the content of the exported PDFs (services/repositoryAuditPdf.ts and services/repositoryAuditClientReport.ts are not screens).

## Changing the look

1. Make the change and look at it.
2. The owner approves it visually.
3. Run `npm run certify:repo-audit-ui-contract` and commit the updated `docs/ui-contracts/repo-audit-certified-ui.json` with the change.

`npm run build` runs `verify:repo-audit-ui-contract`, so an uncertified change to Repo Audit fails the build. The Knowledge Operations and Executive Office contracts are separate and unchanged.
