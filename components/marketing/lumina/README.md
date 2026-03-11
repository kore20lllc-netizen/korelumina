# Lumina Brand System

The Lumina brand system provides formalized, reusable components for the Lumina background asset, ensuring consistent implementation across the application.

## Components

### LuminaCore

**Purpose:** Hero section implementation with verified edge spacing and animation.

**Usage:**
```tsx
import { LuminaCore } from '@/components/lumina';

<LuminaCore>
  <YourHeroContent />
</LuminaCore>
```

**Rules:**
- ✅ Use only ONE per page
- ✅ For hero sections only
- ❌ Do not override sizing props
- ❌ Do not modify animation parameters

**Features:**
- Perfect square aspect ratio (1:1)
- Responsive horizontal padding: `clamp(32px, 4vw, 64px)`
- Asymmetric positioning (54% center) for visual balance
- GPU-accelerated animation (12s breathing effect)
- Verified edge spacing (32-64px breathing room)

### LuminaAmbient

**Purpose:** Subtle background presence for non-hero sections.

**Usage:**
```tsx
import { LuminaAmbient } from '@/components/lumina';

<LuminaAmbient>
  <YourSectionContent />
</LuminaAmbient>
```

**Rules:**
- ✅ Use for ambient brand presence
- ✅ Maximum one per page (in addition to LuminaCore if needed)
- ⚠️ Much more subtle than Core variant

**Features:**
- Full viewport background
- Low opacity (0.15) with heavy overlay
- Cover sizing for full bleed
- Same animation as Core (can be disabled)

### LuminaMark

**Purpose:** Animated brand logo for navbar, loaders, and splash screens.

**Usage:**
```tsx
import { LuminaMark } from '@/components/lumina';

// Navbar usage
<LuminaMark size="sm" />

// Loading screen
<LuminaMark size="lg" />

// Splash screen
<LuminaMark size="xl" />
```

**Features:**
- Animated gradient color shifts (4.5s cycle)
- Soft glow pulse (0.6 → 0.9 opacity)
- Subtle scale breathing (max 1.015)
- Grain texture overlay (3% opacity)
- Respects `prefers-reduced-motion` for accessibility
- SVG-based (crisp at any size)

**Size Variants:**
- `xs`: 24px (compact navbar)
- `sm`: 32px (standard navbar)
- `md`: 48px (large navbar / small loader) - default
- `lg`: 96px (loading screen)
- `xl`: 128px (splash screen)
- Custom: Pass number for custom pixel size

**Animation Details:**
- No rotation or bouncing
- No shape morphing
- Calm, intelligent feel
- Production-grade quality

## Design Tokens

All specifications are centralized in `lib/lumina-tokens.ts`:

```typescript
import { LUMINA_TOKENS } from '@/lib/lumina-tokens';

// Access verified specifications
LUMINA_TOKENS.core.wrapper.width        // 'min(94vw, 1200px)'
LUMINA_TOKENS.core.background.position  // '54% center'
LUMINA_TOKENS.animation.duration        // '12s'
```

## Props API

### LuminaCoreProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | Content to render inside frame |
| `className` | string | `''` | Additional CSS classes |
| `disableAnimation` | boolean | `false` | Disable breathing animation |

### LuminaAmbientProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | required | Content to render over background |
| `className` | string | `''` | Additional CSS classes |
| `disableAnimation` | boolean | `false` | Disable breathing animation |
| `opacity` | number | `0.15` | Adjust background opacity |

### LuminaMarkProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| number` | `'md'` | Logo size variant or custom pixels |
| `className` | string | `''` | Additional CSS classes |
| `ariaLabel` | string | `'Kore Lumina'` | Accessibility label |

## Color System

Lumina uses a carefully curated color palette:

- **Blue:** `#4A90E2` - Primary brand color
- **Gold:** `#F5A623` - Warmth and energy
- **Cyan:** `#5DE2E7` - Innovation and technology
- **Magenta:** `#C85BFF` - Creativity and intelligence
- **Background:** `#05070B` - Deep, premium black

## Verification Data

The Core variant has been verified across multiple viewport sizes:

| Viewport | Padding | Exceeds Requirement |
|----------|---------|---------------------|
| 1920px | ~64px | 167% |
| 1440px | ~58px | 142% |
| 1200px | ~48px | 100% |
| 1024px | ~41px | 71% |
| All sizes | ≥32px | 33% |

## Animation Specifications

### Background Animation (Core/Ambient)
- **Name:** `lumina-float`
- **Duration:** 12 seconds
- **Timing:** ease-in-out
- **Loop:** infinite
- **Effects:**
  - Brightness: 1.0 → 1.08 → 1.0 (8% oscillation)
  - Saturation: 1.0 → 1.1 → 1.0 (10% oscillation)
- **Performance:** GPU-accelerated filter animations

### Logo Animation (Mark)
- **Duration:** 4.5 seconds
- **Gradient shift:** Smooth color transitions
- **Glow pulse:** 0.6 → 0.9 opacity
- **Scale:** 1.0 → 1.015 → 1.0 (subtle breathing)
- **Grain:** 3% opacity overlay
- **Accessibility:** Disabled for `prefers-reduced-motion`

## Accessibility

All Lumina components respect user preferences:

- Animations are disabled when `prefers-reduced-motion: reduce` is set
- Logo mark includes proper `aria-label` for screen readers
- All animations are decorative and do not affect functionality
- Color contrasts meet WCAG AA standards

## Do Not

❌ **Never:**
- Use multiple Core instances on the same page
- Override wrapper dimensions directly
- Modify animation parameters outside tokens
- Apply custom positioning to the component
- Use as a decorative element
- Spin, bounce, or morph the logo mark

✅ **Always:**
- Use as a brand asset
- Respect sizing constraints
- Maintain one-per-page rule
- Use tokens for any customization
- Consider accessibility

## Migration from Inline Implementation

**Before:**
```tsx
<div style={{ width: 'min(94vw, 1200px)', ... }}>
  <div style={{ backgroundImage: 'url("/lumina.png")', ... }} />
  {/* content */}
</div>
```

**After:**
```tsx
<LuminaCore>
  {/* content */}
</LuminaCore>
```

All specifications are now managed centrally through the token system.
