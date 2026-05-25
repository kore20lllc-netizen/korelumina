'use client';

import { ReactNode } from 'react';
import { useWorkspaceMode } from '@/lib/WorkspaceModeContext';
import ChatTab from './tabs/ChatTab';
import PreviewTab from './tabs/PreviewTab';
import DeploymentTab from './tabs/DeploymentTab';

interface MainCanvasProps {
  children?: ReactNode;
}

export default function MainCanvas({ children }: MainCanvasProps) {
  const { mode, config } = useWorkspaceMode();

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Mode indicator banner */}
      <div className={`flex-shrink-0 bg-gradient-to-r ${config.topBarColor} px-6 py-2`}>
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-semibold">
            {config.topBarLabel}
          </span>
          {!config.allowEditing && (
            <span className="text-white/80 text-xs bg-white/10 px-2 py-1 rounded">
              🔒 Read-Only
            </span>
          )}
        </div>
      </div>

      {/* Content Area - Only scrolling region */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'builder' && <ChatTab>{children}</ChatTab>}
        {mode === 'preview' && <PreviewTab />}
        {mode === 'deployment' && <DeploymentTab />}
      </div>
    </main>
  );
}
