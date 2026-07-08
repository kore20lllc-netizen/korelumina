# Lumina Design System

Version: 1.0
Status: Foundation Architecture
Owner: KoreLumina

---

# Purpose

The Lumina Design System defines the permanent visual language of KoreLumina.

It separates visual identity from application functionality so every workspace, tool, and future product shares one cohesive environment.

This document captures the design language originally established by the imported Lovable workspace and formalizes it into a production-grade architecture that KoreLumina owns and evolves independently.

---

# Core Philosophy

Lumina is not a collection of pages.

Lumina is a continuous digital environment.

Users do not move between different applications.

They move between tools built inside the same visual world.

The background never changes.

Only the workspace changes.

The environment is part of the product identity.

---

# Visual Architecture

Environment

↓

Surface System

↓

Design Tokens

↓

Foundation Components

↓

Workspace Components

↓

Feature Components

↓

Content

Each layer depends only on the layer beneath it.

Higher layers never redefine lower layers.

Business logic never owns visual identity.

---

# Layer 1 — Environment

Purpose

Provide the permanent visual identity of KoreLumina.

Components

• LuminaBackground

• LuminaAmbient

• LuminaGlassLayer

Responsibilities

• Aurora gradients

• Ambient lighting

• Background motion

• Depth perception

• Global atmosphere

Rules

Always mounted.

Never replaced by individual workspaces.

Never modified by feature components.

---

# Layer 2 — Surface System

Purpose

Provide reusable glass surfaces that every workspace shares.

Current Components

GlowCard

LuminaSurface

glass-panel

glass-strong

glass-ripple

Responsibilities

Glass appearance

Blur

Transparency

Borders

Elevation

Depth

Hover interaction

Rules

Surface components own visual elevation.

Workspace components never recreate glass effects.

---

# Layer 3 — Design Tokens

The following tokens define Lumina's visual language.

## Gradients

gradient-lumina

gradient-brand

gradient-button

gradient-text

gradient-gold

gradient-aurora

## Glass

glass-panel

glass-strong

glass-ripple

glass-tint-scale

## Shadows

shadow-soft

shadow-float

## Typography

text-gradient-lumina

text-gradient-royal-gold

## Background Helpers

bg-lumina

bg-brand

bg-button-lumina

bg-aurora

Future semantic tokens

colors.ts

spacing.ts

radius.ts

motion.ts

glass.ts

typography.ts

elevation.ts

opacity.ts

zIndex.ts

---

# Layer 4 — Foundation Components

These components establish the reusable UI vocabulary.

Current

GlowCard

LuminaButton

LuminaSegmentedControl

NavigationRail

NavigationSection

NavigationFooter

LuminaSurface

Future

LuminaBadge

LuminaInput

LuminaDialog

LuminaToolbar

LuminaTable

LuminaMetricCard

LuminaHero

LuminaSection

LuminaTabs

LuminaStatusBadge

LuminaAvatar

LuminaDropdown

Rule

Foundation components consume design tokens.

They never hardcode visual constants.

---

# Layer 5 — Workspace Components

Workspace components compose foundation components into reusable layouts.

Current

WorkspaceCard

WorkspaceMetricCard

WorkspaceSection

WorkspaceEmptyState

GlassWorkspaceHero

RuntimeHeader

RuntimeInspector

RuntimeMetricTile

RuntimeActionsToolbar

RuntimeHealthBadge

RuntimeEmptyState

KnowledgeMetricTile

KnowledgeOverviewSkeleton

Responsibilities

Workspace layout

Workspace headers

Workspace metrics

Workspace navigation

Workspace empty states

Workspace skeletons

Rule

Workspace components compose.

They do not redefine foundational styling.

---

# Layer 6 — Feature Components

Feature components implement business capabilities.

Current

Runtime Operations

Runtime Diagnostics

Repo Audit

Knowledge Operations

Developer Workspace

Designer Workspace

AI Workspace

Admin Workspace

Future

Deployment Center

Marketplace

Organization Memory

Knowledge Preservation

Automation Center

AI Orchestrator

Rule

Feature components own business logic only.

Visual identity comes from the lower layers.

---

# Design Principles

Environment is permanent.

Background never changes.

Glass owns elevation.

Components consume tokens.

Workspaces compose components.

Features compose workspaces.

Visual identity is independent from business logic.

No workspace may redefine the application identity.

---

# Current Visual Assets

Extracted from the imported Lovable workspace.

Primary Components

GlowCard

LuminaButton

LuminaSurface

NavigationRail

NavigationSection

NavigationFooter

WorkspaceCard

WorkspaceMetricCard

GlassWorkspaceHero

RuntimeHeader

RuntimeInspector

RuntimeMetricTile

AuditSummary

DependencyAuditCard

EnvironmentAuditCard

SecurityAuditCard

RepairPlanCard

BuildErrorsCard

KnowledgeMetricTile

---

# Migration Strategy

Phase 1

Freeze current appearance.

Phase 2

Create semantic design tokens.

Phase 3

Refactor foundation components to consume tokens.

Phase 4

Refactor workspace components.

Phase 5

Refactor feature workspaces.

Phase 6

Remove duplicated visual styles.

No visual regressions are permitted during migration.

---

# Long-Term Goal

The Lumina Design System becomes the single source of truth for every KoreLumina product.

Future applications should inherit Lumina automatically by consuming the design system rather than implementing their own visual language.

The visual identity should remain stable even as products, features, and technologies evolve.

