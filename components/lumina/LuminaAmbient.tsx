/**
 * LUMINA AMBIENT COMPONENT
 * =====================================================
 * Background variant of the Lumina brand system
 * 
 * USAGE RULES:
 * - Use for non-hero sections requiring subtle brand presence
 * - Maximum one per page (in addition to LuminaCore if needed)
 * - Provides atmosphere without dominating the content
 * - Lower opacity and heavier overlay for subtlety
 * 
 * @example
 * ```tsx
 * <LuminaAmbient>
 *   <YourSectionContent />
 * </LuminaAmbient>
 * ```
 */

import React from 'react';
import { LUMINA_TOKENS } from '@/lib/lumina-tokens';
import { LuminaAmbientProps } from './types';

export const LuminaAmbient: React.FC<LuminaAmbientProps> = ({
  children,
  className = '',
  disableAnimation = false,
  opacity,
}) => {
  const { ambient, animation, asset } = LUMINA_TOKENS;

  const animationStyle = disableAnimation
    ? {}
    : { animation: `${animation.name} ${animation.duration} ${animation.timing} ${animation.iteration}` };

  const backgroundOpacity = opacity ?? ambient.background.opacity;

  return (
    <div
      className={`relative min-h-screen ${className}`}
      data-lumina-variant="ambient"
    >
      {/* Layer 1: Subtle Lumina Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("${asset.image}")`,
          backgroundSize: ambient.background.size,
          backgroundPosition: ambient.background.position,
          backgroundRepeat: ambient.background.repeat,
          opacity: backgroundOpacity,
          zIndex: ambient.background.zIndex,
          ...animationStyle,
        }}
        aria-hidden="true"
      />

      {/* Layer 2: Heavy Dark Overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: ambient.overlay.gradient,
          zIndex: ambient.overlay.zIndex,
        }}
        aria-hidden="true"
      />

      {/* Layer 3: Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

LuminaAmbient.displayName = 'LuminaAmbient';
