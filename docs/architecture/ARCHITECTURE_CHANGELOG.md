# KoreLumina Architecture Changelog

This document is the chronological record of architectural evolution.

Unlike Git history, this log records architectural intent, capability ownership, validation, and resulting system changes.

---

## 2026-06-29

### PLAT-002A — Repository Path Extraction

Status
- Complete

Capability
- Repository Discovery

Summary
- Introduced the Platform SDK as the owner of repository path discovery.
- Centralized repository root resolution.
- Runtime migrated to consume Platform SDK.

Owner
- packages/platform-sdk/src/paths/RepositoryPaths.ts

Validation
- Platform SDK build ✓
- Runtime build ✓
- Builder build ✓
- Workspace build ✓

---

### PLAT-002B — Filesystem Safety Extraction

Status
- Complete

Capability
- Filesystem Safety

Summary
- Centralized:
  - assertSafeProjectId()
  - resolveProjectPath()
  - ensureWithinRoot()

Owner
- packages/platform-sdk/src/paths/RepositoryPaths.ts

Validation
- Platform SDK build ✓
- Runtime build ✓
- Builder build ✓
- Workspace build ✓

---

### PLAT-002C — Runtime Filesystem Migration

Status
- Complete

Summary
- Runtime startProject now consumes Platform SDK filesystem validation.

---

### PLAT-002D — Workspace Path Cleanup

Status
- Complete

Summary
- Runtime workspace paths reduced to runtime-specific responsibilities.
- Filesystem safety ownership fully centralized.

---

### PLAT-003A — Async Process Runner

Status
- Complete

Capability
- Generic Process Execution

Summary
- Introduced ProcessRunner.
- Runtime importer migrated to consume Platform SDK.

Owner
- packages/platform-sdk/src/process/ProcessRunner.ts

Validation
- Platform SDK build ✓
- Runtime build ✓
- Builder build ✓
- Workspace build ✓

---

### PLAT-004A — Sync Process Runner

Status
- Complete

Capability
- Synchronous Process Execution

Summary
- Introduced ProcessRunnerSync.

---

### PLAT-004B — Runtime Package Installer Migration

Status
- Complete

Summary
- Runtime project isolation now consumes ProcessRunnerSync.
- Generic spawnSync execution removed from Runtime ownership.

Owner
- packages/platform-sdk/src/process/ProcessRunnerSync.ts

Validation
- Platform SDK build ✓
- Runtime build ✓
- Builder build ✓
- Workspace build ✓

---

## 2026-06-29

### PLAT-006 — Provider Registry Investigation

Status
- Complete (Investigation)

Capability
- Provider Registry Architecture

Summary
- Audited all provider registry implementations.
- Identified two distinct implementation patterns.

Findings

Pattern A
- Functional module registries
- Module-level Map
- register()
- unregister()
- get()
- list()
- clear()
- count()

Pattern B
- Class-based singleton registries
- Internal Map
- register()
- get()
- list()

Decision
- Generic ProviderRegistry<T> will not be introduced yet.
- Provider lifecycle APIs must first be standardized.
- Consolidation deferred until convergence is complete.

Result
- Investigation complete.
- No implementation performed.


---

## 2026-06-29

### PLAT-007 — Configuration Platform Investigation

Status
- Investigation

Capability
- Configuration Platform

Summary
- Audited configuration usage across Builder, Runtime, and Platform SDK.
- Evaluated whether a shared configuration capability belongs in Platform SDK.

Result
- Pending investigation outcome.


---

## 2026-06-29

### PLAT-007 — Configuration Platform Investigation

Status
- Complete (Investigation)

Capability
- Configuration Platform

Summary
- Audited Runtime and Builder configuration responsibilities.

Findings

Infrastructure Configuration
- Environment variables
- Runtime URLs
- API keys

Application Configuration
- Provider configuration
- Capacitor configuration
- Builder preferences

Runtime Configuration
- Runtime execution environment
- Runtime authorization
- AI provider selection

Decision
- Do not introduce a generic Configuration Platform.
- Configuration responsibilities are intentionally separated.
- Future extraction should target an Environment Platform responsible only for environment access.

Result
- Investigation complete.
- Extraction deferred.


---

## 2026-06-29

### PLAT-008 — Environment Platform Investigation

Status
- Investigation

Capability
- Environment Platform

Summary
- Auditing direct environment access across Runtime, Builder, and shared packages.
- Determining whether a typed Environment Platform should become part of Platform SDK.

Result
- Pending investigation outcome.


---

## 2026-06-29

### PLAT-008 — Environment Platform Investigation

Status
- Complete (Investigation)

Capability
- Environment Platform

Summary
- Audited all direct environment access across Runtime, Builder, and Platform SDK.

Findings

Runtime
- 7 direct process.env reads
- 2 runtime environment clones

Builder
- 3 direct import.meta.env reads

Platform SDK
- No existing environment abstraction

Decision
- Introduce an Environment Platform.
- Platform SDK will own typed environment access.
- Runtime and Builder will consume the Environment Platform instead of directly reading process.env or import.meta.env where practical.

Scope
- Infrastructure environment only.
- Application configuration remains application-owned.

Result
- Investigation complete.
- Approved for implementation.

