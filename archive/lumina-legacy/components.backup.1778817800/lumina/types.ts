import { ReactNode } from 'react';

/**
 * LUMINA COMPONENT TYPES
 * Brand system component interfaces
 */

export interface LuminaCoreProps {
  /**
   * Content to render inside the Lumina hero frame
   */
  children: ReactNode;

  /**
   * Optional CSS class for the content wrapper
   */
  className?: string;

  /**
   * Disable animation (useful for accessibility or performance)
   * @default false
   */
  disableAnimation?: boolean;
}

export interface LuminaAmbientProps {
  /**
   * Content to render over the ambient background
   */
  children: ReactNode;

  /**
   * Optional CSS class for the container
   */
  className?: string;

  /**
   * Disable animation (useful for accessibility or performance)
   * @default false
   */
  disableAnimation?: boolean;

  /**
   * Adjust opacity of the ambient background
   * @default 0.15
   */
  opacity?: number;
}

/**
 * Usage tracking to enforce one Lumina per page
 */
export interface LuminaUsageContext {
  coreUsed: boolean;
  ambientUsed: boolean;
}
