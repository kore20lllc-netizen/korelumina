# Platform SDK

Capability ID: PLATFORM-SDK

Capability Name: Platform SDK

Status: Active

Architectural Owner: Platform Infrastructure

Capability Owner: Platform SDK

-------------------------------------------------------------------------------

## Purpose

The Platform SDK owns shared infrastructure used across KoreLumina.

It provides reusable production services that must not be duplicated by Runtime,
Builder, Knowledge Platform, Repository Intelligence, AI Platform, UTE, UDE, or
Internal Engineering Platform.

-------------------------------------------------------------------------------

## Responsibilities

- Repository path resolution
- Runtime path resolution
- Workspace path resolution
- Knowledge path resolution
- Filesystem safety utilities
- Shared configuration contracts
- Shared platform contracts
- Future logging, diagnostics, validation, and observability utilities

-------------------------------------------------------------------------------

## Public Interfaces

Initial public interfaces:

- Repository paths
- Workspace paths
- Runtime paths
- Knowledge paths
- Filesystem boundary validation

-------------------------------------------------------------------------------

## Internal Interfaces

- Path discovery helpers
- Safe path normalization
- Platform directory conventions

-------------------------------------------------------------------------------

## Dependencies

- Node.js filesystem APIs
- Node.js path APIs

-------------------------------------------------------------------------------

## Consumers

- Universal Runtime
- Knowledge Platform
- Repository Intelligence
- AI Platform
- Builder
- Universal Transformation Engine
- Universal Deployment Engine
- Internal Engineering Platform
- Reconstruction Engine

-------------------------------------------------------------------------------

## Knowledge Inputs

- Platform Constitution
- Production Workflow
- Capability Registry
- Runtime implementation history
- Existing runtime path utilities

-------------------------------------------------------------------------------

## Knowledge Outputs

- Platform infrastructure capability record
- Shared-service ownership pattern
- Runtime-to-platform extraction pattern
- Regression-prevention rule for duplicate infrastructure

-------------------------------------------------------------------------------

## Validation

- Platform SDK package build passes
- Full repository build passes
- Runtime behavior remains unchanged
- Existing runtime path consumers continue to resolve identical paths

-------------------------------------------------------------------------------

## Observability

Initial observability is validation-based.

Future observability may include path resolution diagnostics and configuration
reports.

-------------------------------------------------------------------------------

## Security

- Prevent project path traversal
- Validate project identifiers
- Ensure resolved paths remain inside configured roots
- Preserve existing runtime filesystem protections

-------------------------------------------------------------------------------

## Production Requirements

- No duplicate path infrastructure
- Stable public interfaces
- No Runtime ownership of shared platform concerns
- No Builder ownership of shared platform concerns
- Safe path handling
- Backward-compatible migration

-------------------------------------------------------------------------------

## Extension Points

- Logging
- Diagnostics
- Configuration
- Validation
- Observability
- Environment detection
- Repository discovery
- Runtime directory bootstrap

-------------------------------------------------------------------------------

## Roadmap

1. Own repository path discovery.
2. Own runtime and workspace path resolution.
3. Own knowledge path resolution.
4. Migrate Runtime consumers.
5. Add directory bootstrap.
6. Add diagnostics and validation reporting.

-------------------------------------------------------------------------------

## Related Constitutional Amendments

- ARCH-001 — Continuous Engineering Evolution
- ARCH-002 — Production Capability Ownership

-------------------------------------------------------------------------------

## Related Engineering Decisions

- ED-0001 — Platform implementations must feed KP and Engineer Agent
- ED-0002 — Deterministic Patch Generation

-------------------------------------------------------------------------------

## Related ADRs

None yet.

-------------------------------------------------------------------------------

## Related Capabilities

- FOUNDATION
- RECON
- RUNTIME
- KP
- RI
