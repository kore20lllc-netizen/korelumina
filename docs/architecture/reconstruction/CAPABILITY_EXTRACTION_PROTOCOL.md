# Capability Extraction Protocol

Status: Active

Owner: Platform Architecture

Applies To:

- Platform SDK
- Runtime
- Knowledge Platform
- Repository Intelligence
- AI Platform
- Universal Transformation Engine
- Universal Deployment Engine
- Internal Engineering Platform

-------------------------------------------------------------------------------

## Purpose

Defines the mandatory production workflow for extracting an existing capability
from one subsystem into its architectural owner.

The protocol was validated during PLAT-002A (Repository Discovery extraction).

-------------------------------------------------------------------------------

## Protocol

Every capability extraction shall follow this sequence.

Capability Specification

↓

Package Specification

↓

Workspace Integration

↓

Capability Extraction

↓

Consumer Migration

↓

Ownership Audit

↓

Validation

↓

Knowledge Extraction

↓

Commit

-------------------------------------------------------------------------------

## Investigation

Before implementation:

- identify the architectural owner
- identify all consumers
- identify duplicated ownership
- determine migration scope
- lock the ticket scope

-------------------------------------------------------------------------------

## Workspace Integration

Before consumers migrate:

- destination package exists
- destination package builds
- consuming package declares dependency
- workspace resolves package
- TypeScript resolves package

-------------------------------------------------------------------------------

## Capability Extraction

Requirements:

- deterministic reconstruction patch
- no manual edits
- production-grade implementation
- preserve behavior
- backward-compatible migration

-------------------------------------------------------------------------------

## Consumer Migration

Consumers shall migrate only after the destination capability builds.

-------------------------------------------------------------------------------

## Ownership Audit

Every extraction shall verify a single source implementation.

Compiled artifacts are excluded.

Example:

grep -R \
  --exclude-dir=dist \
  --exclude-dir=node_modules \
  "<symbol>" \
  packages apps -n

-------------------------------------------------------------------------------

## Validation

Mandatory:

- package build
- consumer build
- root build
- ownership audit
- runtime validation

-------------------------------------------------------------------------------

## Knowledge Extraction

Every completed extraction shall feed the Knowledge Platform.

Capture:

- engineering pattern
- architectural lesson
- regression prevention rule
- implementation sequence
- capability ownership

-------------------------------------------------------------------------------

## Reconstruction Rules

- investigate before implementation
- deterministic patch generation
- parser-based edits for structured files
- full-file rewrites for structural migrations
- no manual repository edits
- one production capability per ticket
- production-grade implementation by default

-------------------------------------------------------------------------------

## Proven Reference

PLAT-002A

Repository Discovery

Runtime

↓

Platform SDK

Validated:

- package extraction
- workspace integration
- consumer migration
- ownership audit
- production build
