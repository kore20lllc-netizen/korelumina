'use client';

import React from 'react';
import { LuminaMark } from './LuminaMark';
import styles from './lumina-thinking.module.css';

interface LuminaThinkingProps {
  /**
   * Size of the indicator in pixels
   * @default 24
   */
  size?: number;
  
  /**
   * Indicator animation mode
   * - 'pulse': Gently pulses glow/opacity and scales (1.00 → 1.03 → 1.00) over 1.4s
   * - 'orbit': 3 tiny dots orbit around the mark (2.4s)
   * @default 'pulse'
   */
  mode?: 'pulse' | 'orbit';
  
  /**
   * Label text for screen readers and optional display
   * @default 'Thinking…'
   */
  label?: string;
  
  /**
   * Whether to show the label text visually
   * @default false
   */
  showLabel?: boolean;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * LuminaThinking - Premium thinking/loading indicator
 * 
 * A minimal, premium indicator that uses the LuminaMark as its core element.
 * Designed for chat interfaces and buttons where activity needs to be communicated.
 * 
 * Features:
 * - Two modes: pulse (gentle scale/glow) and orbit (3 circling dots)
 * - Accessible with role="status" and aria-live
 * - Respects prefers-reduced-motion (renders static)
 * - Background-agnostic styling for dark UI
 * 
 * @example
 * ```tsx
 * // Default pulse mode
 * <LuminaThinking />
 * 
 * // Orbit mode with visible label
 * <LuminaThinking mode="orbit" showLabel />
 * 
 * // Custom size and label
 * <LuminaThinking size={32} label="Processing…" />
 * ```
 */
export function LuminaThinking({
  size = 24,
  mode = 'pulse',
  label = 'Thinking…',
  showLabel = false,
  className = '',
}: LuminaThinkingProps) {
  const containerClass = `${styles.container} ${
    mode === 'pulse' ? styles.modePulse : styles.modeOrbit
  } ${className}`;

  return (
    <div
      className={containerClass}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {/* Core LuminaMark element */}
      <div className={styles.mark}>
        <LuminaMark size={size} variant="animated" />
      </div>

      {/* Orbit mode: 3 dots circling the mark */}
      {mode === 'orbit' && (
        <div className={styles.orbitContainer} style={{ width: size * 2, height: size * 2 }}>
          <div className={`${styles.orbitDot} ${styles.dot1}`} />
          <div className={`${styles.orbitDot} ${styles.dot2}`} />
          <div className={`${styles.orbitDot} ${styles.dot3}`} />
        </div>
      )}

      {/* Label text */}
      <span className={showLabel ? styles.labelVisible : styles.labelHidden}>
        {label}
      </span>
    </div>
  );
}
