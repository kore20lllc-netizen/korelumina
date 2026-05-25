'use client';

import { use, type ReactNode } from 'react';
import WorkspaceSidebar from './WorkspaceSidebar';
import WorkspaceMain from './WorkspaceMain';
import WorkspacePanel from './WorkspacePanel';

/**
 * ProjectShell - Project-scoped Workspace Container
 * Wraps the 3-panel workspace layout with project context
 * 
 * Layout:
 * ┌─────────────────────────────────────────────────────────┐
 * │ Project Header: Untitled Project                        │
 * ├────────────┬─────────────────────────┬──────────────────┤
 * │ Left       │ Center                  │ Right            │
 * │ Sidebar    │ Builder / Chat Area     │ Preview / Files  │
 * │ (Projects) │ (Main Work Surface)     │ (Tabbed Panel)   │
 * └────────────┴─────────────────────────┴──────────────────┘
 * 
 * Props:
 * - params: Promise containing workspaceId and projectId
 * 
 * Responsibilities:
 * - Receives projectId from route params
 * - Renders project header (name placeholder)
 * - Renders 3-panel workspace layout
 * - No state, no data fetching
 */
export default function ProjectShell({
  params,
  children,
}: {
  params: Promise<{
    workspaceId: string;
    projectId: string;
  }>;
  children?: ReactNode;
}) {
  const { projectId } = use(params);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#05070B] flex flex-col">
      {/* Project Header - Subtle, not loud */}
      <header className="bg-[#0A0C12] border-b border-white/10 px-6 py-3 flex items-center">
        <h1 className="text-white/70 text-sm font-medium">
          Untitled Project
        </h1>
        <span className="text-white/30 text-xs ml-2">
          ({projectId})
        </span>
      </header>

      {/* 3-Panel Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-[280px_1fr_400px] overflow-hidden">
        {/* Left Sidebar - Fixed Width */}
        <WorkspaceSidebar />

        {/* Center Panel - Flexible */}
        <WorkspaceMain projectId={projectId} />

        {/* Right Panel - Fixed Width */}
        <WorkspacePanel />
      </div>

      {children}
    </div>
  );
}
