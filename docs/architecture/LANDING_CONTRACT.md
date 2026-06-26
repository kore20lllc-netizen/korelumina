# KoreLumina Landing Contract

Version: 1.0

Status: Frozen

Parent Document:
KORELUMINA_MASTER_OS_V1.md

---

# Purpose

The landing page is the public contract between KoreLumina and its customers.

Every capability advertised publicly must have:

- an architectural owner
- an implementation owner
- a maturity level
- a commercialization model
- a production validation checklist

Nothing may appear on the landing page unless it exists in this document.

---

# Product Classification

Every capability belongs to one of four classifications.

## Public Platform

Self-service functionality available directly to customers.

Examples:

- Repository Import
- AI Builder
- Runtime Preview
- Transform App → Website
- Templates Marketplace

---

## Platform Capability

Customer-visible functionality powered by internal platform engines.

Examples:

- AI Usage Billing
- Managed Infrastructure
- BYO Infrastructure
- Deployment
- Enterprise Governance

---

## Engineering Service

Professional services delivered by KoreLumina engineers.

Examples:

- Mobile App Packaging
- Large-scale Modernization
- White-glove Repair
- Enterprise Migration
- Architecture Consulting

These services are not self-service features.

---

## Internal Platform

Capabilities never marketed directly.

Examples:

- Capacitor Engine
- Repo Audit Engine
- Repair Planner
- Decision Engine
- Knowledge Graph
- Workflow Engine
- Autonomous Operations Layer

---

# Public Capability Register

## Repository Import

Classification:
Public Platform

Owner:
Repository Engine

Status:
Required

Landing Promise:
Import existing repositories into KoreLumina.

---

## AI Builder

Classification:
Public Platform

Owner:
AI Engine

Status:
Required

Landing Promise:
Build applications using AI assistance.

---

## Runtime Preview

Classification:
Public Platform

Owner:
Universal Runtime

Status:
Required

Landing Promise:
Preview applications before deployment.

---

## Transform App → Website

Classification:
Public Platform

Owner:
Universal Transformation Engine

Status:
Required

Commercial Model:

- Included in Pro and above
- One-time unlock for Free users

---

## Templates Marketplace

Classification:
Public Platform

Owner:
Template Service

Status:
Required

---

## Managed Infrastructure

Classification:
Platform Capability

Owner:
Deployment Engine

Status:
Required

---

## BYO Infrastructure

Classification:
Platform Capability

Owner:
Deployment Engine

Status:
Required

---

## BYO API Keys

Classification:
Platform Capability

Owner:
Budget Policy Engine

Status:
Required

---

## AI Usage Billing

Classification:
Platform Capability

Owner:
Budget Policy Engine

Status:
Required

---

## Enterprise Governance

Classification:
Platform Capability

Owner:
Policy Engine

Status:
Required

---

## In-House Engineering

Classification:
Engineering Service

Owner:
Engineering Operations Platform

Status:
Required

---

## Mobile App Packaging

Classification:
Engineering Service

Owner:
Engineering Operations Platform

Internal Engine:
Capacitor Engine

Status:
Required

Commercial Model:

- Paid engineering engagement
- Not available as a public self-service feature
- Delivered by KoreLumina engineers

---

# Customer Decision Policy

Every operation with meaningful cost, duration, or impact must present an Execution Plan before execution.

The execution plan must include:

- Estimated AI credit usage
- Estimated monetary cost
- Estimated execution time
- Models to be used
- Infrastructure impact
- Output artifacts
- Rollback availability

The user explicitly chooses whether to continue.

KoreLumina automates execution.

The customer owns every spending decision.

---

# Marketing Rules

Marketing may never expose:

- engine names
- implementation details
- internal tooling
- engineering consoles

Marketing communicates products and services.

Engineering builds engines.

---

# Launch Requirements

Every public capability must satisfy one of the following before launch:

1. Production Ready
2. Feature Gated
3. Engineering Service
4. Removed from Marketing

There are no exceptions.

---

# Definition of Done

A landing-page capability is complete only when:

- Architecture exists
- Engineering specification exists
- Runtime implementation exists
- Builder implementation exists
- Tests pass
- Documentation is complete
- Production validation succeeds
- The capability matches the public promise

