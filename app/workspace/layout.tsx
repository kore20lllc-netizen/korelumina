import type { ReactNode } from 'react';

/**
 * Workspace Layout
 * Wraps workspace pages with minimal structure
 * All styling and layout is handled by WorkspaceShell component
 */
export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
