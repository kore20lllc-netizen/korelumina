# Lumina Design System Roadmap

Version: 1.0
Status: Active Roadmap
Owner: KoreLumina

---

# Purpose

This roadmap defines how KoreLumina will evolve the imported Lovable visual language into the permanent Lumina Design System.

Lovable is the reference implementation.

Lumina is the destination.

---

# Principle

Do not copy workspace styling.

Extract primitives.

Tokenize them.

Modernize them.

Reuse them everywhere.

---

# Phase I — Extraction

Status: In progress

Extract design patterns from:

Repo Audit

Runtime Operations

Knowledge Operations

Shared workspace components

CSS primitives

Key extracted primitives:

GlowCard

LuminaButton

LuminaSurface

RuntimeHeader

RuntimeMetricTile

WorkspaceMetricCard

GlassWorkspaceHero

NavigationRail

glass-panel

glass-strong

glass-runtime

text-gradient-lumina

bg-button-lumina

---

# Phase II — Tokenization

Create:

apps/lumina-builder/src/design/tokens/

Required token files:

colors.ts

gradients.ts

glass.ts

typography.ts

spacing.ts

radius.ts

elevation.ts

motion.ts

opacity.ts

blur.ts

zIndex.ts

Goal:

No component should hardcode reusable visual values.

---

# Phase III — Glass Engine

Create a layered glass system.

Layers:

Specular highlight

Glass diffusion

Internal glow

Noise

Blur

Border

Shadow

Refraction

Rules:

Glass is implemented once.

Workspaces never recreate glass styling.

---

# Phase IV — Environment Engine

The background remains immutable.

The environment owns:

LuminaBackground

LuminaAmbient

LuminaGlassLayer

Global lighting

Global atmospheric depth

Workspace accents may affect foreground surfaces only.

The background image never changes.

---

# Phase V — Lighting System

Workspace palettes:

Repo Audit

Violet

Gold

Knowledge

Violet

Azure

Runtime

Cyan

Blue

Designer

Magenta

Cyan

Developer

Blue

Emerald

AI

Violet

Pink

Admin

Slate

Gold

Lighting affects surfaces, badges, buttons, highlights, and charts.

It does not replace the background.

---

# Phase VI — Foundation Components

Refactor:

GlowCard

LuminaSurface

LuminaButton

LuminaSegmentedControl

NavigationRail

NavigationSection

NavigationFooter

Add:

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

---

# Phase VII — Workspace Layout System

Create reusable workspace primitives:

LuminaWorkspace

LuminaWorkspaceHero

LuminaWorkspaceToolbar

LuminaWorkspaceGrid

LuminaInspector

LuminaMetricGrid

LuminaTimeline

LuminaActivityFeed

LuminaGraphCanvas

Workspaces compose these primitives.

They do not define their own visual systems.

---

# Phase VIII — Workspace Migration

Migration order:

Repo Audit

Runtime Operations

Knowledge Operations

Dashboard

Developer Workspace

Designer Workspace

AI Workspace

Admin Workspace

Settings

Templates

Imports

Each migration must preserve behavior.

Each migration must pass build validation.

No workspace may regress visually.

---

# Phase IX — Modernization

After migration, Lumina evolves beyond the Lovable reference.

Upgrade:

Glass quality

Lighting depth

Motion

Typography hierarchy

Graph visuals

Empty states

Responsive layouts

Accessibility

Theme customization

---

# Non-Negotiable Rules

The background never changes.

No workspace owns a full-screen background.

No duplicate glass systems.

No duplicate button systems.

No duplicate metric cards.

No hardcoded gradients in feature components.

No raw visual constants when a token exists.

Every reusable visual pattern belongs in the Lumina Design System.

---

# End State

Lumina becomes the single visual system for KoreLumina.

All workspaces inherit one premium visual identity.

Future products consume Lumina instead of inventing their own UI language.

