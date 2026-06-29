# Package Registry

Status: Active

Architectural Owner: Platform Architecture

## Purpose

The Package Registry is the canonical index of KoreLumina implementation packages.

Capabilities define what the platform does.

Packages define where capabilities are implemented.

Every package must have explicit ownership, responsibilities, dependencies,
consumers, and knowledge outputs.

## Registered Packages

| Package ID | Package | Architectural Owner | Status |
|------------|---------|---------------------|--------|
| PLATFORM-SDK | @korelumina/platform-sdk | Platform Infrastructure | Active |
| KNOWLEDGE-PLATFORM | @korelumina/knowledge-platform | Knowledge Platform | Active |
| LUMINA-RUNTIME | apps/lumina-runtime | Runtime | Active |
| LUMINA-BUILDER | apps/lumina-builder | Builder | Active |

## Package Contract

Every package specification shall define:

- Purpose
- Architectural Owner
- Package Owner
- Capabilities Implemented
- Public Interfaces
- Internal Interfaces
- Dependencies
- Consumers
- Knowledge Inputs
- Knowledge Outputs
- Validation
- Security
- Extension Points
- Related Capabilities
