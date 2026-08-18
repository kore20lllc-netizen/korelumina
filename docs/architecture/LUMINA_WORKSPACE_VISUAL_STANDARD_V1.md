# Lumina Workspace Visual Standard V1

## Status

Production design-system contract.

This standard governs the visual composition of KoreLumina workspaces and reusable Lumina workspace primitives.

The UI is the contract.

---

## 1. Canonical Material Source

The Lumina Executive Hero material language is the canonical visual source of truth for flagship workspace surfaces.

Canonical source:

`apps/lumina-builder/src/components/design-system/lumina/executive/ribbon/LuminaExecutiveRibbon.tsx`

The Executive Hero implementation itself is immutable during downstream workspace extraction and normalization.

Its material language includes:

- translucent slate glass
- high backdrop blur
- elevated backdrop saturation
- blue/cyan structural contour
- controlled ambient violet, amber, indigo, cyan, and pink illumination
- luminous top-edge highlight
- restrained blue atmospheric glow
- deep but transparent dimensional shadowing

Downstream primitives inherit this material language.

They do not redesign or reinterpret it independently.

---

## 2. Canonical Workspace Card

`LuminaFlagshipCard` is the canonical reusable card primitive for flagship workspace cards.

Canonical implementation:

`apps/lumina-builder/src/components/lumina/workspace/primitives/LuminaFlagshipCard.tsx`

All new flagship workspace cards should use `LuminaFlagshipCard` unless a materially different semantic component is required.

Local workspace implementations must not recreate the standard card with independent background gradients, border systems, highlight layers, or shadow stacks.

---

## 3. Material Contract

The canonical flagship card material derives from the Executive Hero composition.

Required characteristics:

- `bg-slate-950/48`
- `backdrop-blur-[44px]`
- `backdrop-saturate-[170%]`
- blue structural border
- cyan inset ring
- Executive-derived ambient radial illumination
- Executive-derived luminous top highlight
- atmospheric blue glow and translucent depth

The shared primitive owns this material.

Workspace consumers should not duplicate it.

---

## 4. Geometry vs Material

Geometry and material are separate responsibilities.

A reusable primitive may define geometry appropriate to its role, including:

- border radius
- padding
- layout
- orientation
- responsive behavior
- interaction affordances

The material language must remain aligned with the canonical Lumina contract.

For example:

- Executive Hero may use `rounded-[30px]`
- flagship cards may use `rounded-[22px]`

This difference is valid.

Replacing the canonical material with a darker local gradient is not.

---

## 5. Interaction States

Interactive, selected, focus, warning, success, and other semantic states may extend the canonical material.

They must not replace the underlying Lumina material identity.

State styling may adjust:

- border intensity
- ring intensity
- localized glow
- semantic text
- semantic accent
- elevation
- motion

State styling should avoid duplicated contours, stacked rings, or competing highlight layers.

---

## 6. Contour Discipline

Avoid simultaneous use of multiple independent contour systems.

Do not stack all of the following on the same surface unless explicitly required:

- border
- inset ring
- outer ring
- custom highlight
- selected outline
- additional one-pixel shadow contour

The shared primitive should own the normal contour.

Consumers should only override it when a specific state requires a deliberate visual change.

---

## 7. Workspace Construction Rule

For every new Lumina workspace:

1. Use existing Lumina workspace primitives first.
2. Compose the complete UI from shared primitives.
3. Preserve the canonical Executive-derived material language.
4. Add local composition only for semantics or layout not represented by a shared primitive.
5. Do not introduce a new local flagship card shell if `LuminaFlagshipCard` satisfies the role.
6. Extract genuinely reusable additions back into the Lumina Design System after production validation.

---

## 8. One-Way Design-System Direction

The design-system direction is:

Executive Hero material
→ reusable Lumina primitives
→ workspace compositions

It is not:

workspace local styling
→ Executive Hero

Downstream refinement must never mutate the Executive Hero source merely to satisfy a local workspace implementation.

---

## 9. Production Validation

Any modification to a shared Lumina visual primitive requires:

1. `npm run build`
2. visual validation in affected workspaces
3. confirmation that Executive Hero source is unchanged
4. confirmation that unrelated workspaces are unchanged or intentionally affected
5. explicit visual approval before commit
6. one logical commit per validated milestone

---

## 10. Standard

The Executive-derived flagship glass material currently implemented by `LuminaFlagshipCard` is the approved standard for future KoreLumina workspace cards.

New workspace implementations must consume this standard rather than recreating their own darker or divergent flagship card materials.
