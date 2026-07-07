# Lumina Design System

Status: Active

Owner: KoreLumina Platform

Purpose

The Lumina Design System is the canonical UI framework for every
KoreLumina application.

Its purpose is to provide a unified visual language,
shared interaction patterns,
reusable UI primitives,
and consistent accessibility across the platform.

The design system is a platform subsystem.

It is maintained with the same rigor as Runtime,
Knowledge Preservation,
Workspace Management,
and AI Orchestration.

--------------------------------------------------
Goals
--------------------------------------------------

• Eliminate duplicated UI implementations.

• Prevent visual drift.

• Improve developer productivity.

• Maintain accessibility.

• Support future theming.

• Support white-labeling.

• Support desktop, tablet, and mobile.

--------------------------------------------------
Architecture
--------------------------------------------------

The design system is composed of six layers.

Theme

↓

Background

↓

Surfaces

↓

Controls

↓

Feedback

↓

Application

Every layer depends only on the layers beneath it.

Application code must never bypass lower layers.

--------------------------------------------------
Directory Structure
--------------------------------------------------

apps/lumina-builder/src/components/lumina/

    background/

    controls/

    feedback/

    forms/

    layout/

    navigation/

    overlays/

    surfaces/

    typography/

    index.ts

--------------------------------------------------
Background Layer
--------------------------------------------------

Responsible for:

• Workspace backgrounds

• Ambient lighting

• Aurora effects

• Noise

• Grid overlays

• Vignettes

Canonical components

LuminaBackground

LuminaAmbient

LuminaGrid

LuminaNoise

LuminaGlow

--------------------------------------------------
Surface Layer
--------------------------------------------------

Responsible for:

• Glass panels

• Cards

• Sections

• Containers

• Dialog shells

Canonical components

LuminaGlass

LuminaCard

LuminaPanel

LuminaSection

--------------------------------------------------
Controls
--------------------------------------------------

Responsible for every interactive element.

Examples

LuminaButton

LuminaInput

LuminaTextarea

LuminaCheckbox

LuminaSwitch

LuminaSelect

LuminaSegmentedControl

LuminaTabs

Raw HTML controls should not be used directly in application code.

--------------------------------------------------
Feedback
--------------------------------------------------

Shared feedback primitives.

LuminaSpinner

LuminaBadge

LuminaProgress

LuminaToast

LuminaEmptyState

LuminaSkeleton

--------------------------------------------------
Navigation
--------------------------------------------------

LuminaSidebar

LuminaBreadcrumb

LuminaTopBar

LuminaCommandPalette

LuminaMenu

--------------------------------------------------
Overlays
--------------------------------------------------

LuminaDialog

LuminaDrawer

LuminaPopover

LuminaTooltip

LuminaDropdown

--------------------------------------------------
Theme Tokens
--------------------------------------------------

No component should hardcode colors.

Theme tokens define:

Background

Surface

Text

Border

Shadow

Radius

Spacing

Typography

Motion

Opacity

Blur

--------------------------------------------------
Elevation
--------------------------------------------------

Level 0

Application background

Level 1

Workspace background

Level 2

Panels

Level 3

Cards

Level 4

Dialogs

Level 5

Floating menus

Level 6

Notifications

--------------------------------------------------
Motion
--------------------------------------------------

Motion should communicate state.

Avoid decorative animations.

Shared durations

Fast

Normal

Slow

Shared easing

Standard

Emphasized

Exit

--------------------------------------------------
Accessibility
--------------------------------------------------

Every Lumina component must support:

keyboard navigation

screen readers

focus visibility

reduced motion

high contrast themes

proper ARIA attributes

--------------------------------------------------
Extraction Rule
--------------------------------------------------

If the same UI pattern appears three times,
it should be extracted into the Lumina Design System.

--------------------------------------------------
Modification Rule
--------------------------------------------------

Existing Lumina primitives should be extended
rather than duplicated.

--------------------------------------------------
Migration Rule
--------------------------------------------------

Migration is incremental.

Improve one primitive.

Build.

Validate.

Commit.

Adopt.

Repeat.

--------------------------------------------------
Non-Negotiable Rules
--------------------------------------------------

No duplicated button systems.

No duplicated card systems.

No duplicated dialog systems.

No duplicated backgrounds.

No workspace-specific UI frameworks.

No hardcoded gradients outside theme tokens.

No direct HTML controls in application code
when a Lumina primitive exists.

--------------------------------------------------
Long-Term Objective
--------------------------------------------------

Every production UI inside KoreLumina should be composed from Lumina
primitives.

Applications should assemble interfaces rather than implement their own
visual systems.

