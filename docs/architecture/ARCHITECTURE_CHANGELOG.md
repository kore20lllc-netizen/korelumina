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
