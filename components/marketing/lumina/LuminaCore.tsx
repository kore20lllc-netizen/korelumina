/**
 * LUMINA CORE COMPONENT
 * =====================================================
 * Hero variant of the Lumina brand system
 * 
 * USAGE RULES:
 * - Only ONE Lumina Core per page
 * - Use for hero sections only
 * - Do not override sizing props
 * - Animation is GPU-accelerated and verified
 * 
 * @example
 * ```tsx
 * <LuminaCore>
 *   <YourHeroContent />
 * </LuminaCore>
 * ```
 */

import React from 'react';
import { LUMINA_TOKENS } from '@/lib/lumina-tokens';
import { LuminaCoreProps } from './types';

export const LuminaCore: React.FC<LuminaCoreProps> = ({
  children,
  className = '',
  disableAnimation = false,
}) => {
  const { core, animation, asset } = LUMINA_TOKENS;

  const animationStyle = disableAnimation
    ? {}
    : { animation: `${animation.name} ${animation.duration} ${animation.timing} ${animation.iteration}` };

  return (
    <div
      className={`relative ${className}`}
      style={{
        aspectRatio: core.wrapper.aspectRatio,
        width: core.wrapper.width,
        height: 'auto',
        minHeight: core.wrapper.minHeight,
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: core.wrapper.paddingLeft,
        paddingRight: core.wrapper.paddingRight,
        overflow: core.wrapper.overflow,
      }}
      data-lumina-variant="core"
    >
      {/* Layer 1: Lumina Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("${asset.image}")`,
          backgroundSize: core.background.size,
          backgroundPosition: core.background.position,
          backgroundRepeat: core.background.repeat,
          opacity: core.background.opacity,
          zIndex: core.background.zIndex,
          ...animationStyle,
        }}
        aria-hidden="true"
      />

      {/* Layer 2: Subtle Dark Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: core.overlay.gradient,
          zIndex: core.overlay.zIndex,
        }}
        aria-hidden="true"
      />

      {/* Layer 3: Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};

LuminaCore.displayName = 'LuminaCore';
