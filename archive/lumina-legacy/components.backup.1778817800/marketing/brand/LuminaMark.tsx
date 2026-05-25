'use client';

import React from 'react';
import styles from './lumina-mark.module.css';

interface LuminaMarkProps {
  /**
   * Size of the logo mark in pixels
   * @default 32
   */
  size?: number;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Variant of the logo mark
   * - 'animated': Full animated version with gradient drift and glow pulse (default)
   * - 'static': Static version without animations
   * @default 'animated'
   */
  variant?: 'static' | 'animated';
}

/**
 * LuminaMark - Animated Kore Lumina brand logo
 * 
 * A premium animated logo mark with calm motion. Features:
 * - Gradient color drift animation (4.5s)
 * - Glow opacity pulse (0.6 → 0.9)
 * - Subtle grain texture overlay (3% opacity)
 * - Respects prefers-reduced-motion
 * 
 * Colors:
 * - Royal Blue: #4A90E2
 * - Warm Gold: #F5A623
 * - Cyan Glow: #5DE2E7
 * - Magenta Accent: #C85BFF
 * 
 * @example
 * ```tsx
 * // Default 32px animated logo
 * <LuminaMark />
 * 
 * // Large static logo
 * <LuminaMark size={96} variant="static" />
 * 
 * // Custom size with className
 * <LuminaMark size={48} className="my-custom-class" />
 * ```
 */
export function LuminaMark({ 
  size = 32, 
  className = '', 
  variant = 'animated' 
}: LuminaMarkProps) {
  const variantClass = variant === 'static' ? styles.static : styles.animated;
  
  return (
    <div 
      className={`${styles.luminaMark} ${variantClass} ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Kore Lumina"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
        {/* Definitions */}
        <defs>
          {/* Clip path to keep gradient inside blob silhouette */}
          <clipPath id={`lumina-blob-clip-${size}`}>
            <path d="M100,20 
                     C140,20 160,40 170,70 
                     C180,100 175,130 160,150 
                     C145,170 120,180 100,180 
                     C80,180 55,170 40,150 
                     C25,130 20,100 30,70 
                     C40,40 60,20 100,20 Z"/>
          </clipPath>
          
          {/* Animated radial gradient */}
          <radialGradient id={`lumina-gradient-${size}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5DE2E7" stopOpacity="1">
              {variant === 'animated' && (
                <animate attributeName="stop-color" 
                  values="#5DE2E7;#4A90E2;#C85BFF;#F5A623;#5DE2E7" 
                  dur="4.5s" 
                  repeatCount="indefinite"/>
              )}
            </stop>
            <stop offset="35%" stopColor="#4A90E2" stopOpacity="1">
              {variant === 'animated' && (
                <animate attributeName="stop-color" 
                  values="#4A90E2;#C85BFF;#F5A623;#5DE2E7;#4A90E2" 
                  dur="4.5s" 
                  repeatCount="indefinite"/>
              )}
            </stop>
            <stop offset="70%" stopColor="#C85BFF" stopOpacity="0.8">
              {variant === 'animated' && (
                <animate attributeName="stop-color" 
                  values="#C85BFF;#F5A623;#5DE2E7;#4A90E2;#C85BFF" 
                  dur="4.5s" 
                  repeatCount="indefinite"/>
              )}
            </stop>
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0.6">
              {variant === 'animated' && (
                <animate attributeName="stop-color" 
                  values="#F5A623;#5DE2E7;#4A90E2;#C85BFF;#F5A623" 
                  dur="4.5s" 
                  repeatCount="indefinite"/>
              )}
            </stop>
            
            {/* Gradient drift animation */}
            {variant === 'animated' && (
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="0 0; 0.02 0.02; 0 0"
                dur="4.5s"
                repeatCount="indefinite"/>
            )}
          </radialGradient>
          
          {/* Soft glow filter with pulsing opacity */}
          <filter id={`lumina-glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feFlood floodColor="#4A90E2" floodOpacity="0.75">
              {variant === 'animated' && (
                <animate attributeName="flood-opacity" 
                  values="0.6;0.9;0.6" 
                  dur="4.5s" 
                  repeatCount="indefinite"/>
              )}
            </feFlood>
            <feComposite in2="blur" operator="in" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Subtle grain texture overlay at 3% opacity */}
          <filter id={`lumina-grain-${size}`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="2" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0 0 0 0 0.03"/>
            </feComponentTransfer>
            <feBlend mode="overlay" in="SourceGraphic"/>
          </filter>
        </defs>
        
        {/* Single blob silhouette with gradient fill */}
        <g clipPath={`url(#lumina-blob-clip-${size})`}>
          <rect 
            width="200" 
            height="200" 
            fill={`url(#lumina-gradient-${size})`} 
            filter={`url(#lumina-glow-${size}) url(#lumina-grain-${size})`}
          />
        </g>
        
        {/* Blob outline path for subtle definition */}
        <path 
          d="M100,20 
             C140,20 160,40 170,70 
             C180,100 175,130 160,150 
             C145,170 120,180 100,180 
             C80,180 55,170 40,150 
             C25,130 20,100 30,70 
             C40,40 60,20 100,20 Z"
          fill="none"
          stroke={`url(#lumina-gradient-${size})`}
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}
