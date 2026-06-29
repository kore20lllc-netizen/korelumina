# Platform SDK Package

Package ID: PLATFORM-SDK

Package Name: @korelumina/platform-sdk

Status: Active

Architectural Owner: Platform Infrastructure

Package Owner: Platform SDK

## Purpose

The Platform SDK package implements shared platform infrastructure consumed by
KoreLumina subsystems.

It owns cross-platform services that must not be duplicated in Runtime, Builder,
Knowledge Platform, Repository Intelligence, AI Platform, UTE, UDE, or Internal
Engineering Platform.

## Capabilities Implemented

- PLATFORM-SDK

Initial production capability:

- Repository Discovery
- Path Infrastructure

## Public Interfaces

Initial public API:

- paths

Planned public APIs:

- filesystem
- configuration
- contracts
- validation
- diagnostics
- observability

## Internal Interfaces

- Platform path resolution helpers
- Filesystem safety helpers
- Shared configuration conventions

## Dependencies

- Node.js filesystem APIs
- Node.js path APIs

## Consumers

- apps/lumina-runtime
- apps/lumina-builder
- @korelumina/knowledge-platform
- Future Repository Intelligence
- Future AI Platform
- Future UTE
- Future UDE
- Future Internal Engineering Platform

## Knowledge Inputs

- Platform Constitution
- Capability Registry
- PLATFORM-SDK capability specification
- Runtime path implementation history
- Reconstruction workflow

## Knowledge Outputs

- Package ownership record
- Shared infrastructure extraction pattern
- Runtime-to-platform migration pattern
- Duplicate infrastructure prevention rule

## Validation

- Package build passes
- Root build passes
- Existing Runtime behavior remains unchanged after migration
- Consumers resolve equivalent paths before and after migration

## Security

- Safe path resolution
- Project identifier validation
- Root boundary enforcement
- No path traversal

## Extension Points

- Logging
- Diagnostics
- Runtime directory bootstrap
- Configuration loading
- Environment detection
- Filesystem validation

## Related Capabilities

- PLATFORM-SDK
- FOUNDATION
- RUNTIME
- KP
- RI
- RECON
