# ADR-0037 — Canonical Execution Architecture

Status: Accepted

## Context

KoreLumina now uses the Platform SDK Execution SDK across multiple subsystems including Knowledge publication, Event Journal replay, Engineering completion, and Runtime startup.

## Decision

All workflow orchestration shall use the Platform SDK Execution SDK unless an ADR explicitly approves an exception.

## Canonical Pipeline Structure

- Context
- Pipeline
- Stages
- Index

## Canonical Stage Order

1. Resolve
2. Validate
3. Execute
4. Register
5. Publish
6. Project
7. Cleanup
8. Report

## Governance

ExecutionPipeline is the canonical orchestration mechanism.

Applications may compose stages but must not implement independent orchestration frameworks.

Future additions such as retries, compensation, resumable execution, metrics, and persistence shall extend the Execution SDK instead of creating parallel workflow engines.
