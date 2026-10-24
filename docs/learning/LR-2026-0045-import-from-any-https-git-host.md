# LR-2026-0045 — Import from any HTTPS git host

Status: Approved

Version: 1.0

Owner: Founder, Kore20 LLC

Scope: What the Chief Agent learned from owner-approved engineering work in this window. Learning authority: subordinate to Canon, Constitution, Blueprint, governance, business, and domain knowledge.

Window: 65947100..d84e009f

Source commits: d84e009f

Approval basis: ADR-0042 Decision 1 (the owner's commit is the approval) and Decision 3 (mechanical checks passed).

Approval Date: 2026-10-22

Learning cycle: learning-cycle:e7ce802ca40cdbb6 · written by the Chief Agent (gpt-5.5)

---

## Summary

Repository import was expanded beyond public GitHub to support GitHub, GitLab, Bitbucket, Azure DevOps, and generic HTTPS git servers. Private repository credentials are passed to git only through scoped environment variables and are not stored, logged, or returned. Sources: d84e009f70e8b7427d4370d3bbee8c1f8eca93d7.

## What changed

- Runtime repository import was generalized from GitHub-specific import code to repository-source and import-repository modules. (`d84e009f`, `apps/lumina-runtime/src/import/RepositorySource.ts`, `apps/lumina-runtime/src/import/importRepository.ts`, `apps/lumina-runtime/src/import/importGithubProject.ts`)
- Git clone execution was moved into a dedicated GitClone module. (`d84e009f`, `apps/lumina-runtime/src/import/GitClone.ts`)
- The import route was updated to use the generalized repository import path. (`d84e009f`, `apps/lumina-runtime/src/routes/importProject.ts`)
- The builder import UI and runtime service calls were updated for the broader repository import flow. (`d84e009f`, `apps/lumina-builder/src/components/import/ImportModal.tsx`, `apps/lumina-builder/src/services/runtimeService.ts`, `apps/lumina-builder/src/services/api.ts`, `apps/lumina-builder/src/services/actions.ts`)
- Tests were added for importing non-GitHub and private repositories. (`d84e009f`, `apps/lumina-runtime/src/import/__tests__/ImportAnyRepository.test.ts`)

## Decisions

- Repository import should support GitHub, GitLab, Bitbucket, Azure DevOps, and generic HTTPS git servers instead of only public GitHub repositories. (`d84e009f`)
- Private repository tokens should reach git only through environment variables scoped to the repository host. (`d84e009f`)
- Private repository tokens should not be stored, logged, or returned. (`d84e009f`)
- Git should run without prompts, without Runtime secrets, and with a time limit. (`d84e009f`)
- Imports should refuse hosts on the local machine. (`d84e009f`)

## Lessons

- The previous GitHub-only importer was too narrow for the required import use cases. (`d84e009f`, `apps/lumina-runtime/src/import/importGithubProject.ts`)
- Credential handling for private imports should keep tokens out of persistence, logs, and API responses. (`d84e009f`)
- Git subprocesses used for imports should be non-interactive and time-limited. (`d84e009f`)
- Generic git import support needs tests that cover more than public GitHub imports. (`d84e009f`, `apps/lumina-runtime/src/import/__tests__/ImportAnyRepository.test.ts`)
