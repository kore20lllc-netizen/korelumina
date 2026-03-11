'use client';

import { ReactNode } from 'react';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import MainCanvas from './MainCanvas';
import { WorkspaceModeProvider } from '@/lib/WorkspaceModeContext';

interface WorkspaceShellProps {
  children?: ReactNode;
  workspaceName?: string;
  activeProject?: string;
  buildStatus?: 'Idle' | 'Generating' | 'Ready for Preview' | 'Live' | 'Failed';
  isAdminUser?: boolean;
}

export default function WorkspaceShell({
  children,
  workspaceName = 'KoreLumina',
  activeProject,
  buildStatus = 'Idle',
  isAdminUser = false,
}: WorkspaceShellProps) {
  return (
    <WorkspaceModeProvider>
      <div className="min-h-screen bg-[#05070B] flex flex-col">
        {/* Fixed Top Bar */}
        <TopBar
          workspaceName={workspaceName}
          activeProject={activeProject}
          buildStatus={buildStatus}
          isAdminUser={isAdminUser}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Fixed Left Sidebar */}
          <LeftSidebar />

          {/* Main Canvas - Only scrolling region */}
          <MainCanvas>
            {children}
          </MainCanvas>
        </div>
      </div>
    </WorkspaceModeProvider>
  );
}
