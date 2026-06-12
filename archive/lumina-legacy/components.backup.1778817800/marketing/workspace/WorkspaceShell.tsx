'use client';

import WorkspaceSidebar from './WorkspaceSidebar';
import WorkspaceMain from './WorkspaceMain';
import WorkspacePanel from './WorkspacePanel';

/**
 * WorkspaceShell - Root Container
 * 3-panel workspace layout with CSS Grid
 * 
 * Layout:
 * ┌────────────┬─────────────────────────┬────────────────────┐
 * │ Left       │ Center                  │ Right              │
 * │ Sidebar    │ Builder / Chat Area     │ Preview / Files    │
 * │ (Projects) │ (Main Work Surface)     │ (Tabbed Panel)     │
 * └────────────┴─────────────────────────┴────────────────────┘
 */
export default function WorkspaceShell() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#05070B] grid grid-cols-1 sm:grid-cols-[280px_1fr_400px]">
      {/* Left Sidebar - Fixed Width */}
      <WorkspaceSidebar />

      {/* Center Panel - Flexible */}
      <WorkspaceMain />

      {/* Right Panel - Fixed Width */}
      <WorkspacePanel />
    </div>
  );
}
