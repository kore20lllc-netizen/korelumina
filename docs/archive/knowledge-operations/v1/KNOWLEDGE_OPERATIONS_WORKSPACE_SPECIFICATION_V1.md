# Knowledge Operations Workspace Specification V1

## Status

Accepted

## Mission

The Knowledge Operations Workspace is the operational control center for the Engineering Intelligence Platform.

It is not an admin page.

It is not a standalone application.

It is a first-class Lumina Builder workspace where engineers observe, operate, and govern KoreLumina's engineering intelligence.

## Design Requirement

The workspace MUST use the existing Lumina Builder design language.

A user should feel like they switched to another Lumina workspace, not another application.

## Responsibilities

The workspace is responsible for:

- launching acquisition jobs
- monitoring acquisition progress
- observing provider health
- reviewing acquired evidence
- reviewing canonical knowledge
- monitoring learning progress
- monitoring reasoning activity
- monitoring agent activity
- governing promotion
- observing autonomous improvement
- auditing the engineering intelligence lifecycle

## Navigation Model

The workspace should include these sections:

- Overview
- Acquisition
- Evidence
- Canonical Knowledge
- Learning
- Reasoning
- Agents
- Autonomous Improvement
- Metrics
- Settings

## Overview

The overview should show:

- active acquisition jobs
- active providers
- total evidence
- canonical knowledge count
- promotion rate
- learning activity
- reasoning activity
- agent activity
- autonomous improvement proposals

## Acquisition

The acquisition section should support:

- repository acquisition
- conversation acquisition
- Git acquisition
- runtime acquisition
- issue acquisition
- pull request acquisition
- deployment acquisition
- telemetry acquisition

Each acquisition source should show:

- status
- start time
- finish time
- duration
- progress
- acquired evidence
- preserved evidence
- failures
- retry state

## Evidence Explorer

The evidence explorer should allow engineers to search and filter evidence by:

- provider
- organization
- project
- scope
- evidence type
- source
- time range

Evidence is immutable and must be displayed as source material, not edited.

## Canonical Knowledge Explorer

The canonical knowledge explorer should show:

- Knowledge IR
- canonical knowledge
- promoted knowledge
- pending knowledge
- rejected knowledge
- superseded knowledge

It should expose the relationship between evidence and canonical knowledge.

## Learning

The learning section should show:

- discovered patterns
- engineering experience growth
- lessons learned
- repeated failures
- successful recovery patterns
- memory evolution

## Reasoning

The reasoning section should show:

- engineering findings
- recommendations
- planning outputs
- architectural drift warnings
- decision support traces

## Agents

The agents section should show:

- Engineer Agent
- Architecture Agent
- Runtime Agent
- Documentation Agent
- Planning Agent
- Review Agent
- future specialized agents

Agents must consume shared scoped platform knowledge.

Agents must not own isolated permanent memory.

## Autonomous Improvement

The autonomous improvement section should show:

- recovery proposals
- self-healing events
- improvement proposals
- validation outcomes
- execution history
- learning feedback

## Metrics

Metrics should include:

- provider health
- acquisition throughput
- evidence counts
- knowledge promotion rate
- rejected candidates
- compiler coverage
- learning growth
- reasoning activity
- agent activity
- failures
- retries
- duration
- performance

## Access Model

The workspace should be available as a first-class Lumina workspace.

Views and controls must be role-aware.

Standard users may see project-scoped knowledge.

Team leads may see team-scoped knowledge.

Administrators may see organization-wide operations.

Platform engineers may see full operational diagnostics.

## Scope Enforcement

All displayed knowledge must respect Knowledge Scope Architecture.

Platform, organization, project, session, and task memory must remain properly isolated.

Customer proprietary knowledge must not leak into global platform memory.

## Runtime API Direction

The runtime should expose APIs for:

- listing acquisition jobs
- starting acquisition jobs
- reading acquisition metrics
- reading evidence summaries
- reading canonical knowledge summaries
- reading provider health
- reading learning metrics
- reading reasoning metrics
- reading agent activity
- reading autonomous improvement activity

## Implementation Order

1. Runtime Knowledge Operations API
2. Builder workspace shell
3. Overview dashboard
4. Acquisition panel
5. Evidence explorer
6. Canonical knowledge explorer
7. Metrics panel
8. Learning panel
9. Reasoning panel
10. Agents panel
11. Autonomous improvement panel

## Success Criteria

The workspace makes the Engineering Intelligence Platform observable.

Engineers can see what knowledge has been acquired.

Engineers can see what knowledge has been promoted.

Engineers can see what remains unrecovered.

Engineers can monitor ingestion progress.

Engineers can understand how KoreLumina is learning from engineering work.

The workspace reinforces KoreLumina as an Engineering Operating System.
