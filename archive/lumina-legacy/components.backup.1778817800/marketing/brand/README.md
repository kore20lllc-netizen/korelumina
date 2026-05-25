# Kore Lumina Brand Components

## Overview

This directory contains the Kore Lumina brand system components:
- **LuminaMark** - Animated brand logo
- **LuminaThinking** - Premium thinking/loading indicator

## Files

### LuminaMark
- `public/brand/lumina-mark.svg` - Standalone SVG asset
- `components/brand/LuminaMark.tsx` - React component
- `components/brand/lumina-mark.module.css` - Component styles

### LuminaThinking
- `components/brand/LuminaThinking.tsx` - React component
- `components/brand/lumina-thinking.module.css` - Component styles

### Shared
- `components/brand/index.ts` - Exports

## Usage

### LuminaMark

```tsx
import { LuminaMark } from '@/components/brand';

// Default 32px animated logo
<LuminaMark />

// Custom size
<LuminaMark size={48} />

// Static (no animation)
<LuminaMark variant="static" />

// All options
<LuminaMark 
  size={96} 
  variant="animated"
  className="my-custom-class" 
/>
```

### LuminaThinking

```tsx
import { LuminaThinking } from '@/components/brand';

// Default pulse mode
<LuminaThinking />

// Orbit mode with visible label
<LuminaThinking mode="orbit" showLabel />

// Custom size and label
<LuminaThinking size={32} label="Processing…" />

// Chat interface
<LuminaThinking mode="pulse" size={20} />

// Button loading state
<button disabled>
  <LuminaThinking mode="pulse" size={16} />
  Processing...
</button>
```

## Props

### LuminaMark

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `32` | Logo size in pixels |
| `className` | `string` | `''` | Additional CSS classes |
| `variant` | `'static' \| 'animated'` | `'animated'` | Animation variant |

### LuminaThinking

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | `24` | Indicator size in pixels |
| `mode` | `'pulse' \| 'orbit'` | `'pulse'` | Animation mode |
| `label` | `string` | `'Thinking…'` | Screen reader label |
| `showLabel` | `boolean` | `false` | Show label visually |
| `className` | `string` | `''` | Additional CSS classes |

## Features

### LuminaMark

#### Animations
- **Gradient drift:** 4.5s smooth color transitions
- **Glow pulse:** Opacity 0.6 → 0.9 breathing effect
- **Grain overlay:** 3% opacity texture for depth
- **No rotation, bouncing, or morphing** - calm motion only

#### Colors
- **Royal Blue:** `#4A90E2`
- **Warm Gold:** `#F5A623`
- **Cyan Glow:** `#5DE2E7`
- **Magenta Accent:** `#C85BFF`

#### Accessibility
- Respects `prefers-reduced-motion`
- ARIA label: "Kore Lumina"
- Static variant available

#### Performance
- Pure CSS/SVG animations (no JavaScript)
- GPU-accelerated
- Scales perfectly at any size

### LuminaThinking

#### Animation Modes
- **Pulse mode:** Gentle scale (1.00 → 1.03) and opacity pulse over 1.4s
- **Orbit mode:** 3 colored dots orbit around mark (2.4s cycle)

#### Accessibility
- `role="status"` with `aria-live="polite"`
- Visually-hidden label for screen readers
- Respects `prefers-reduced-motion` (renders static)

#### Use Cases
- Chat interfaces (AI typing indicators)
- Button loading states
- Inline processing indicators
- Loading screens

#### Colors
- Uses the same brand color palette
- Background-agnostic for dark UI

## Tested Sizes

Works perfectly at:
- 24px (compact navbar)
- 32px (standard navbar)
- 48px (large navbar / small loader)
- 96px (loading screen / splash)

## Test Pages

- `/test-brand-lumina` - LuminaMark showcase and examples
- `/test-lumina-thinking` - LuminaThinking showcase and examples

## Technical Details

**SVG Structure:**
- Single blob silhouette path
- Clip path keeps gradient inside shape
- Animated radial gradient
- Soft glow SVG filter
- Grain texture filter at 3% opacity

**Animation Cycle:**
Cyan → Blue → Magenta → Gold → Cyan (4.5s)

**No Changes To:**
- `lumina.png` (existing Lumina background asset remains unchanged)
- Any other existing components
