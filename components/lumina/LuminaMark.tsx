/**
 * LUMINA MARK COMPONENT
 * =====================================================
 * Animated brand logo for Kore Lumina
 * 
 * USAGE:
 * - Navbar branding
 * - Loading indicators
 * - Splash screens
 * - Brand touchpoints
 * 
 * FEATURES:
 * - Animated gradient shifts (4.5s)
 * - Soft glow pulse (0.6 → 0.9)
 * - Subtle scale breathing (1.015 max)
 * - Respects prefers-reduced-motion
 * - SVG-based (scalable, crisp)
 * 
 * @example
 * ```tsx
 * // Navbar usage
 * <LuminaMark size="sm" />
 * 
 * // Loading screen
 * <LuminaMark size="lg" />
 * 
 * // Splash screen
 * <LuminaMark size="xl" />
 * ```
 */

import React from 'react';

export type LuminaMarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface LuminaMarkProps {
  /**
   * Size variant for the logo mark
   * - xs: 24px (compact navbar)
   * - sm: 32px (standard navbar)
   * - md: 48px (large navbar / small loader)
   * - lg: 96px (loading screen)
   * - xl: 128px (splash screen)
   * - number: custom size in pixels
   * @default 'md'
   */
  size?: LuminaMarkSize;

  /**
   * Optional CSS class for the container
   */
  className?: string;

  /**
   * Optional aria-label for accessibility
   * @default 'Kore Lumina'
   */
  ariaLabel?: string;
}

/**
 * Get CSS class for predefined size
 */
const getSizeClass = (size: LuminaMarkSize): string => {
  if (typeof size === 'number') {
    return '';
  }
  return `lumina-mark-${size}`;
};

/**
 * Get inline style for custom numeric size
 */
const getCustomSize = (size: LuminaMarkSize): React.CSSProperties | undefined => {
  if (typeof size === 'number') {
    return {
      width: `${size}px`,
      height: `${size}px`,
    };
  }
  return undefined;
};

export const LuminaMark: React.FC<LuminaMarkProps> = ({
  size = 'md',
  className = '',
  ariaLabel = 'Kore Lumina',
}) => {
  const sizeClass = getSizeClass(size);
  const customSize = getCustomSize(size);

  return (
    <div 
      className={`lumina-mark ${sizeClass} ${className}`}
      style={customSize}
      role="img"
      aria-label={ariaLabel}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        {/* Definitions */}
        <defs>
          {/* Animated radial gradient */}
          <radialGradient id="lumina-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5DE2E7" stopOpacity="1">
              <animate attributeName="stop-color" 
                values="#5DE2E7;#4A90E2;#C85BFF;#F5A623;#5DE2E7" 
                dur="4.5s" 
                repeatCount="indefinite"/>
            </stop>
            <stop offset="35%" stopColor="#4A90E2" stopOpacity="1">
              <animate attributeName="stop-color" 
                values="#4A90E2;#C85BFF;#F5A623;#5DE2E7;#4A90E2" 
                dur="4.5s" 
                repeatCount="indefinite"/>
            </stop>
            <stop offset="70%" stopColor="#C85BFF" stopOpacity="0.8">
              <animate attributeName="stop-color" 
                values="#C85BFF;#F5A623;#5DE2E7;#4A90E2;#C85BFF" 
                dur="4.5s" 
                repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0.6">
              <animate attributeName="stop-color" 
                values="#F5A623;#5DE2E7;#4A90E2;#C85BFF;#F5A623" 
                dur="4.5s" 
                repeatCount="indefinite"/>
            </stop>
            {/* Gradient position animation */}
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              values="0 0; 0.02 0.02; 0 0"
              dur="4.5s"
              repeatCount="indefinite"/>
          </radialGradient>
          
          {/* Soft glow filter */}
          <filter id="lumina-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feFlood floodColor="#4A90E2" floodOpacity="0.75">
              <animate attributeName="flood-opacity" 
                values="0.6;0.9;0.6" 
                dur="3s" 
                repeatCount="indefinite"/>
            </feFlood>
            <feComposite in2="blur" operator="in" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Noise texture for grain effect */}
          <filter id="lumina-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="2" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0 0 0 0 0.03"/>
            </feComponentTransfer>
            <feBlend mode="overlay" in="SourceGraphic"/>
          </filter>
        </defs>
        
        {/* Organic blob shape - single silhouette */}
        <path 
          d="M100,20 
             C140,20 160,40 170,70 
             C180,100 175,130 160,150 
             C145,170 120,180 100,180 
             C80,180 55,170 40,150 
             C25,130 20,100 30,70 
             C40,40 60,20 100,20 Z"
          fill="url(#lumina-gradient)"
          filter="url(#lumina-glow) url(#lumina-grain)"
          className="lumina-mark-blob">
          {/* Subtle scale pulse */}
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1;1.015;1"
            dur="4.5s"
            repeatCount="indefinite"
            additive="sum"
            calcMode="spline"
            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
            keyTimes="0;0.5;1"/>
          <animate
            attributeName="transform"
            type="translate"
            from="100 100"
            to="100 100"
            dur="0.01s"/>
        </path>
      </svg>
    </div>
  );
};

LuminaMark.displayName = 'LuminaMark';
