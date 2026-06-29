# RECON-002 — Reconstruction Patch Engine

Status: Approved
Architectural Owner: Platform Infrastructure
Version: 1

## Purpose

The Reconstruction Patch Engine standardizes every architectural and
large-scale repository modification.

Repository modifications shall be generated, validated, reviewed,
executed, built, committed and pushed through a deterministic workflow.

No architectural patch is considered valid until it passes every
validation stage.

## Workflow

Architecture
    ↓
Patch Generation
    ↓
Python Syntax Validation
    ↓
Patch Execution
    ↓
Repository Review
    ↓
Build Validation
    ↓
Knowledge Extraction
    ↓
Commit
    ↓
Push

## Mandatory Validation

Every generated patch SHALL pass:

1. Complete file generation.
2. Closed heredoc delimiters.
3. Python syntax validation.

    python3 -m py_compile /tmp/patch.py

4. Successful execution.

    python3 /tmp/patch.py

5. Repository review.

    git diff --stat

6. Repository build.

    npm run build

7. Clean validation.

    git status

## Reconstruction Toolchain

tools/reconstruction/

    generate_patch.py
    review_patch.py
    apply_patch.py
    validate_patch.py
    reconstruction_workflow.py

Each tool owns exactly one production capability.

## Knowledge Platform Integration

Every completed reconstruction shall produce:

- engineering decision
- lessons learned
- regression prevention
- implementation pattern
- knowledge graph update

The Reconstruction Engine is a first-class producer for the Knowledge
Platform.

