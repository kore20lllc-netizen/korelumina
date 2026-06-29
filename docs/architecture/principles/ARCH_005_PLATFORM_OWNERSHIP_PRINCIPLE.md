# ARCH-005 — Platform Ownership Principle

Status: Active

Owner: Platform Architecture

-------------------------------------------------------------------------------

## Principle

Applications orchestrate.

Packages own capabilities.

Applications compose reusable platform capabilities but shall not own reusable
business or platform logic.

-------------------------------------------------------------------------------

## Purpose

Prevent capability duplication across applications.

Ensure reusable functionality has a single architectural owner.

Increase modularity, maintainability, testability, and long-term platform
evolution.

-------------------------------------------------------------------------------

## Ownership Model

Packages own reusable capabilities.

Applications own:

- orchestration
- workflows
- presentation
- APIs
- user experience

Packages own:

- reusable infrastructure
- shared business capabilities
- platform services
- engineering services
- knowledge services

-------------------------------------------------------------------------------

## Decision Rule

Before implementing any capability ask:

Is this reusable?

If YES:

Implement inside packages/.

If NO:

Implement inside apps/.

-------------------------------------------------------------------------------

## Examples

Platform SDK owns:

- repository discovery
- filesystem safety
- configuration
- diagnostics
- environment services

Knowledge Platform owns:

- ingestion
- embeddings
- knowledge graph
- organizational memory

Repository Intelligence owns:

- repository graph
- dependency graph
- architecture analysis

Runtime owns:

- process lifecycle
- runtime orchestration
- preview lifecycle
- runtime registry

Builder owns:

- workspace UI
- editor experience
- preview presentation
- user interaction

-------------------------------------------------------------------------------

## Dependency Rules

Applications may depend on packages.

Packages may depend on lower-level packages.

Applications shall not depend directly on other applications.

Cross-application capability sharing is prohibited.

-------------------------------------------------------------------------------

## Architectural Goals

- single ownership
- modularity
- reuse
- production maintainability
- clear dependency graph

-------------------------------------------------------------------------------

## Validation

Every implementation ticket shall verify the architectural owner before
implementation begins.

-------------------------------------------------------------------------------

## Knowledge

Every capability extraction shall reinforce this ownership model.

Reusable capability ownership shall be preserved by the Knowledge Platform.

-------------------------------------------------------------------------------

## Proven References

PLAT-002A

Repository Discovery

Runtime

↓

Platform SDK
