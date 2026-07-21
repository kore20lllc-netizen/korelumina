# R16 — Composition Root Certification

Status:
Complete

## Objective

Identify every Knowledge runtime composition root and certify
ownership of long-lived services, registries, stores,
pipelines, and runtime lifecycle.

This document records the verified runtime ownership model
derived from implementation inspection.

---

## Summary

The Knowledge runtime does not currently have a single
composition root.

Instead it contains multiple runtime entry points with
different responsibilities.

This is acceptable during reconstruction but introduces
duplicated ownership of preservation infrastructure.


# Verified Composition Roots

## Knowledge Operations

Location

apps/lumina-runtime/src/knowledge-operations/KnowledgeOperationsService.ts

Lifecycle

Module singleton.

Construction

export const knowledgeOperationsService =
  new KnowledgeOperationsService();

Responsibilities

• Repository operations

• Runtime snapshots

• Provider summaries

• Metrics

• Operational APIs

Classification

Runtime service singleton.


## Runtime Knowledge Provider

Location

apps/lumina-runtime/src/knowledge-platform/runtime/
RuntimeKnowledgeProvider.ts

Lifecycle

Module singleton.

Construction

new RuntimeKnowledgeProvider()

Responsibilities

• Own KnowledgePlatform

• Build runtime knowledge context

• Expose platform to runtime consumers

Classification

Runtime façade.


## Knowledge Platform

Location

apps/lumina-runtime/src/knowledge-platform/

Constructed By

RuntimeKnowledgeProvider

Owns

• CanonicalKnowledgeStore

• KnowledgeCompilerRegistry

• KnowledgeNormalizationRegistry

• KnowledgeValidationRegistry

• KnowledgePublisherRegistry

• KnowledgeCompilerPipeline

• KnowledgeNormalizationPipeline

• KnowledgeValidationPipeline

• KnowledgePublishingPipeline

• CanonicalKnowledgeQueryService

Public API

• preserve()

• promote()

• search()

• list()

Classification

Runtime Knowledge façade.


## Knowledge Preservation Platform

Location

apps/lumina-runtime/src/knowledge-preservation/bootstrap/

Construction

createKnowledgePreservationPlatform()

Known Consumers

• RepositoryKnowledgePreserver

• DocumentationKnowledgeRecovery

• KnowledgePreservationPlatformSmokeTest

Owns

• CanonicalKnowledgeStore

• KnowledgeCompilerRegistry

• KnowledgeNormalizationRegistry

• KnowledgeValidationRegistry

• KnowledgePublisherRegistry

• KnowledgeCompilerPipeline

• KnowledgeNormalizationPipeline

• KnowledgeValidationPipeline

• KnowledgePublishingPipeline

Public API

• preserve()

Classification

Preservation-scoped composition root.


# Verified Long-Lived Allocations

KnowledgeOperationsService

Owner

Knowledge Operations module singleton.

---

RuntimeKnowledgeProvider

Owner

Runtime singleton.

---

KnowledgePlatform

Owner

RuntimeKnowledgeProvider.

---

KnowledgePreservationPlatform

Owner

Factory callers.


CanonicalKnowledgeStore

Owners

• KnowledgePlatform

• KnowledgePreservationPlatform

---

Compiler Pipeline

Owners

• KnowledgePlatform

• KnowledgePreservationPlatform

---

Normalization Pipeline

Owners

• KnowledgePlatform

• KnowledgePreservationPlatform

---

Validation Pipeline

Owners

• KnowledgePlatform

• KnowledgePreservationPlatform

---

Publishing Pipeline

Owners

• KnowledgePlatform

• KnowledgePreservationPlatform


# Runtime Topology

RepositoryKnowledgePreserver

↓

KnowledgePreservationPlatform

↓

Compiler

↓

Normalization

↓

Validation

↓

Canonical Store

↓

Publisher


RuntimeKnowledgeProvider

↓

KnowledgePlatform

↓

Compiler

↓

Normalization

↓

Validation

↓

Canonical Store

↓

Query

↓

Promotion

↓

Search


# Architectural Findings

Finding 1

The runtime contains two independent composition roots.

---

Finding 2

Both composition roots construct identical preservation
registries and pipelines.

---

Finding 3

Both composition roots allocate their own
CanonicalKnowledgeStore.

This is the most significant architectural observation.


Finding 4

KnowledgePlatform extends preservation capabilities by
adding canonical query operations.

KnowledgePreservationPlatform focuses exclusively on
preservation.

The domains are different.

The bootstrap implementation is duplicated.


# Architectural Risks

Current ownership may produce:

• Independent canonical stores

• Divergent canonical state

• Duplicate registry configuration

• Duplicate pipeline initialization

• Ambiguous lifecycle ownership

• Increased maintenance complexity

These risks require implementation verification before
refactoring.


# Recommendations

Do not merge bounded contexts.

Preserve the separation between:

• Knowledge Preservation

• Knowledge Platform

Consolidate ownership of:

• Compiler Registry

• Normalization Registry

• Validation Registry

• Publisher Registry

• CanonicalKnowledgeStore

• Preservation Pipelines

through a single preservation engine or equivalent shared
runtime component.


# Certification

The runtime composition roots have been identified.

Registry ownership has been traced.

Pipeline ownership has been traced.

Runtime entry points have been identified.

The remaining architectural question is implementation
ownership of CanonicalKnowledgeStore and preservation
lifecycle.

This document completes the composition root audit and
establishes the baseline for runtime lifecycle
reconciliation.

