# KoreLumina Architecture Classification

Date: 2026-06-14
Branch: feature/architecture-audit

## Active Production Systems

- apps/lumina-builder
- apps/lumina-runtime
- runtime/preview-manager.js
- runtime/workspaces/default/projects
- scripts/dev-supervisor.mjs

## Active Builder Entry Points

- apps/lumina-builder/src/main.tsx
- apps/lumina-builder/src/context/WorkspaceContext.tsx
- apps/lumina-builder/src/services/projectRepository.ts
- apps/lumina-builder/src/services/runtimeService.ts
- apps/lumina-builder/src/hooks/useRuntimeBoot.ts
- apps/lumina-builder/src/components/preview/PreviewFrame.tsx

## Active Runtime Entry Points

- apps/lumina-runtime/src/index.ts
- apps/lumina-runtime/src/routes/*
- apps/lumina-runtime/src/runtime/*
- runtime/preview-manager.js

## Suspect / Legacy Candidates

- preview-v2/
- runtime-exec/
- runtime-worker/
- runtime-executor.js
- BuilderShell.tsx
- PreviewFrame.tsx
- lumina-builder/
- context.backup.1778817800/
- hooks.backup.1778817801/
- lib.backup.1778817801/
- archive/lumina-legacy/

## Current Audit Position

These suspect paths must not be deleted until grep/reference checks confirm they are not imported or executed by the active production scripts.

