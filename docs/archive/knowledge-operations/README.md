# Knowledge Operations Archive

This directory contains superseded Knowledge Operations architecture.

## Authority Boundary

Everything beneath this directory is historical and non-authoritative.

Archived material MUST NOT be used as the implementation contract for the
current reconstructed Knowledge Operations workspace.

Current implementation authority is established by:

- the reconstructed active code path,
- the current Knowledge Operations architecture documents that do not carry
  superseded V1/V2 designations,
- the certified Knowledge Operations UI contract,
- current architecture/conformance records.

## Version Quarantine

- `v1/` contains superseded V1 material.
- `v2/` contains superseded V2 material.

V1/V2 Knowledge Operations documentation must never exist beneath active
`docs/architecture`, `docs/engineering`, or other authoritative documentation
paths.

The repository build enforces this boundary through:

`npm run verify:knowledge-doc-governance`
