# Evidence Model

## Status

Draft v1

## Purpose

The Evidence Model defines the raw, immutable inputs that the Knowledge Preservation Engine compiles into knowledge.

Evidence is not knowledge.

Evidence is source material.

## Core Rule

Evidence is immutable.

Knowledge may evolve.

Evidence must remain traceable.

## Evidence Item

Every evidence record must include:

- id
- type
- title
- source
- capturedAt
- observedAt
- contentRef
- checksum
- metadata
- relationships

## Evidence Types

Supported evidence types:

- conversation
- commit
- tag
- branch
- ADR
- RFC
- document
- source-file
- runtime-event
- engineering-execution
- issue
- pull-request
- specification
- roadmap
- milestone
- build-output
- incident-log

## Identifier Prefixes

Recommended IDs:

- EV — generic evidence
- CONV — conversation
- COMMIT — git commit
- TAG — git tag
- BRANCH — git branch
- ADR — architecture decision record
- RFC — request for comments
- DOC — document
- SRC — source file
- RUN — runtime event
- EXEC — engineering execution
- ISSUE — issue
- PR — pull request
- BUILD — build output
- INCIDENT — incident log

## Evidence Lifecycle

1. discovered
2. captured
3. parsed
4. compiled
5. linked
6. archived

## Evidence to Knowledge Flow

Evidence enters the Knowledge Preservation Engine.

The flow is:

Evidence
→ Knowledge Compiler
→ Knowledge IR
→ Validation
→ Canonical Knowledge Model
→ Knowledge Platform

## Review Rule

Evidence does not require approval to exist.

Knowledge derived from evidence may require approval before becoming canonical.

## Provenance Rule

Every CKM item must reference at least one evidence item.

Knowledge without evidence is knowledge debt.

## Initial Evidence Sources

Initial sources:

- Git history
- source tree
- architecture documents
- ADRs
- RFCs
- historical conversations
- engineering execution records
- runtime events
- build outputs

## Conversation Evidence

Historical conversations are evidence.

They should be cataloged, assigned stable IDs, classified by topic, and compiled into candidate knowledge.

Raw conversations should not become canonical knowledge directly.

## Git Evidence

Git commits, tags, and branches provide chronology.

They should be used to anchor capability timelines, implementation history, and release milestones.

## Document Evidence

Documents preserve architecture, governance, specifications, roadmaps, and implementation history.

Documents may be active guidance, historical evidence, or archived context.

## Source Evidence

Source files prove implemented behavior.

Source evidence should support components, capabilities, APIs, dependencies, and architectural boundaries.

## Runtime Evidence

Runtime events and logs prove operational behavior.

Runtime evidence should support incidents, recovery lessons, diagnostics, and operational knowledge.

## Engineering Execution Evidence

Engineering executions prove work performed by the Engineering OS.

Execution evidence should support lessons, validation results, completion reports, and future learning.
