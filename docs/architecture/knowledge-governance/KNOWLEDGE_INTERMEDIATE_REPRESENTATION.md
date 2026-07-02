# Knowledge Intermediate Representation

## Status

Draft v1

## Purpose

The Knowledge Intermediate Representation defines the normalized candidate knowledge emitted by Knowledge Compilers before it becomes canonical knowledge.

Evidence is raw source material.

Knowledge IR is candidate knowledge.

CKM is approved canonical knowledge.

## Core Rule

Knowledge Compilers emit IR.

They do not write directly to the Canonical Knowledge Model.

## Pipeline

Evidence
→ Evidence Parser
→ Knowledge Compiler
→ Knowledge IR
→ Normalizer
→ Validator
→ Relationship Builder
→ Confidence Calculator
→ Canonical Knowledge Model
→ Knowledge Platform

## IR Item

Every IR item must include:

- id
- candidateType
- title
- summary
- confidence
- evidenceRefs
- proposedRelationships
- extractedAt
- compiler
- status
- metadata

## Candidate Types

Supported candidate types:

- CandidateCapability
- CandidateDecision
- CandidatePrinciple
- CandidateLesson
- CandidateIncident
- CandidateRecovery
- CandidateComponent
- CandidateSubsystem
- CandidateMilestone
- CandidateRoadmap
- CandidateExecution
- CandidateArtifact
- CandidateRelationship

## Candidate Status

- extracted
- normalized
- needs-review
- approved
- rejected
- merged
- superseded

## Evidence References

Every IR item must reference one or more Evidence items.

IR without evidence is invalid.

## Compiler Metadata

Every IR item must identify:

- compiler name
- compiler version
- evidence source type
- extraction timestamp
- extraction method
- confidence basis

## CandidateCapability

Represents a possible capability discovered from evidence.

Fields:

- capabilityName
- description
- subsystem
- maturity
- relatedFiles
- relatedCommits
- relatedDocuments

## CandidateDecision

Represents a possible architectural or engineering decision.

Fields:

- decision
- context
- rationale
- alternatives
- consequences
- relatedADRs
- relatedConversations
- relatedCommits

## CandidatePrinciple

Represents a possible enduring engineering principle.

Fields:

- principle
- explanation
- scope
- examples
- enforcementGuidance

## CandidateLesson

Represents a possible lesson learned.

Fields:

- situation
- rootCause
- resolution
- preventiveGuidance

## CandidateRelationship

Represents a proposed relationship between knowledge items.

Fields:

- from
- to
- relationshipType
- rationale
- evidenceRefs

## Normalization Responsibilities

The normalizer should:

- deduplicate candidate items
- standardize naming
- merge duplicate concepts
- map evidence terminology into CKM terminology
- detect likely conflicts
- preserve provenance

## Validation Responsibilities

The validator should:

- ensure required fields exist
- ensure evidence references are valid
- ensure confidence is justified
- determine whether human review is required
- prevent unsupported knowledge from becoming canonical

## Review Rule

Conversation-derived decisions, principles, and lessons require human review before becoming canonical.

Automatically extracted factual metadata may bypass review if it is directly supported by immutable evidence.

## Relationship Rule

Relationships should be proposed in IR, but canonicalized only after validation.

## Confidence Rule

IR confidence is provisional.

Canonical confidence is assigned after normalization, validation, relationship analysis, and review.

## Compiler Rule

A compiler should be narrow.

Examples:

- Git Compiler emits candidate timeline, capability, and file-change knowledge.
- Source Compiler emits candidate component, subsystem, API, and dependency knowledge.
- Conversation Compiler emits candidate decision, principle, lesson, and ADR knowledge.
- ADR Compiler emits candidate decision and architecture knowledge.
- Runtime Compiler emits candidate incident, recovery, and operational knowledge.
- Execution Compiler emits candidate execution, validation, lesson, and milestone knowledge.

## Output Rule

The output of every compiler is an array of IR items.

No compiler writes to KP directly.

## KPE Contract

KPE accepts Evidence and emits validated CKM.

Knowledge IR is the internal contract that separates evidence-specific compilers from canonical knowledge storage.
