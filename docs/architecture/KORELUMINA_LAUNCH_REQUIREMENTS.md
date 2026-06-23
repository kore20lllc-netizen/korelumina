# KoreLumina Launch Requirements

## Purpose

This document defines the minimum production-grade capabilities required before KoreLumina can be publicly launched.

The landing page represents the product contract.

This document defines the engineering requirements necessary to fulfill that contract.

A capability is considered launch-ready only when:

- Implemented
- Tested
- Observable
- Recoverable
- Documented
- Production validated

---

# Launch Status Scale

## Complete
Capability exists and meets launch requirements.

## Partial
Capability exists but is missing required production behavior.

## Planned
Capability is represented in architecture or UI but is not implemented.

## Blocked
Capability cannot currently satisfy its landing-page promise.

---

# Promise 1
# Software Operating System

Landing Promise:

"KoreLumina is the operating system for modern software development."

Current Evidence:

- AI Workspace
- Designer Workspace
- Developer Workspace
- Admin Workspace
- Runtime Diagnostics
- Repo Audit

Status:

PARTIAL

Missing:

- Shared orchestration layer
- Cross-workspace coordination
- Unified project memory
- Workflow execution engine
- System-wide event routing

Launch Requirements:

- All workspaces operate on the same project state
- Cross-workspace actions synchronize correctly
- Runtime state remains authoritative
- No mock execution paths

Launch Status:

NOT READY

---

# Promise 2
# Import Existing Software

Landing Promise:

"Built for existing software."

Current Evidence:

- Import workflows
- Runtime project registry
- Repo audit
- Repo intelligence

Status:

PARTIAL

Missing:

- Framework detection coverage
- Large repository validation
- Migration workflows
- Import recovery

Launch Requirements:

- Import production repositories
- Detect supported frameworks
- Generate usable audit results
- Recover failed imports

Launch Status:

NOT READY

---

# Promise 3
# Runtime Orchestration

Landing Promise:

"Build, run, inspect, and operate software."

Current Evidence:

- Runtime start
- Runtime stop
- Runtime restart
- Runtime status
- Runtime metrics
- Runtime logs
- Runtime events
- Preview runtime

Status:

STRONG PARTIAL

Missing:

- Runtime recovery hardening
- Multi-project concurrency validation
- Resource protection
- Runtime crash recovery validation

Launch Requirements:

- Runtime survives failures
- Runtime state remains consistent
- Preview remains synchronized
- Recovery paths verified

Launch Status:

NEAR READY

---

# Promise 4
# Enterprise Governance

Landing Promise:

"Enterprise governance built in."

Current Evidence:

- Governance UI messaging
- Diagnostics foundation

Status:

PLANNED

Missing:

- RBAC enforcement
- SSO
- Audit retention
- Compliance exports
- Approval workflows
- Policy enforcement

Launch Requirements:

- Enterprise access control
- Traceable actions
- Auditable activity history
- Governance reporting

Launch Status:

NOT READY

---

# Promise 5
# Delivery Confidence

Landing Promise:

"Built around outcomes, not demos."

Current Evidence:

- Repo audit
- Fix plans
- Diagnostics workspace

Status:

PARTIAL

Missing:

- Test orchestration
- Build verification
- Deployment validation
- Rollback workflows

Launch Requirements:

- Validate software before release
- Detect failures automatically
- Support rollback strategy

Launch Status:

NOT READY

---

# Promise 6
# Ownership

Landing Promise:

"You own everything."

Current Evidence:

- Local runtime
- Repository ownership model
- Filesystem access

Status:

PARTIAL

Missing:

- Export guarantees
- Provider portability
- Infrastructure migration paths

Launch Requirements:

- User can leave platform without lock-in
- Data export documented
- Source ownership preserved

Launch Status:

NOT READY

---

# Promise 7
# Infrastructure Freedom

Landing Promise:

"Managed or bring your own stack."

Current Evidence:

- Runtime architecture
- Early provider integrations

Status:

PARTIAL

Missing:

- BYO database
- BYO deployment
- BYO cloud
- Provider abstraction layer

Launch Requirements:

- Managed mode works
- Customer-owned mode works
- Migration between both works

Launch Status:

NOT READY

---

# Promise 8
# AI + Human Escalation

Landing Promise:

"AI when speed matters. Experts when certainty matters."

Current Evidence:

- In-house developer workflows
- Escalation pathways
- Service architecture

Status:

READY

Launch Requirements:

- Clear escalation process
- Human review workflow
- Service delivery procedures

Launch Status:

READY

---

# Global Launch Blockers

## Critical

- Remove mock authentication
- Remove mock AI providers
- Runtime stability validation
- Enterprise governance implementation
- Delivery confidence implementation
- Import pipeline hardening

## High Priority

- Multi-project orchestration
- Workflow engine
- Provider abstraction
- Infrastructure portability

## Launch Decision Rule

KoreLumina does not launch until every landing-page promise is either:

- Complete

or

- Explicitly removed from the landing page.

