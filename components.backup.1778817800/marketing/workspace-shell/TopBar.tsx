'use client';

import Link from 'next/link';
import { useWorkspaceMode } from '@/lib/WorkspaceModeContext';

interface TopBarProps {
  workspaceName: string;
  activeProject?: string;
  buildStatus: 'Idle' | 'Generating' | 'Ready for Preview' | 'Live' | 'Failed';
  isAdminUser?: boolean;
}

export default function TopBar({
  workspaceName,
  activeProject,
  buildStatus,
  isAdminUser = false,
}: TopBarProps) {
  const { mode, config } = useWorkspaceMode();

  return (
    <header className="border-b border-white/10 bg-black/50 flex-shrink-0">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Product Logo + Name */}
          <div className="w-8 h-8 bg-gradient-to-br from-[#4A90E2] to-[#C85BFF] rounded-lg" />
          <h1 className="text-xl font-semibold text-white">{workspaceName}</h1>
          
          {/* Mode Indicator */}
          <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${config.topBarColor} text-white border border-white/20`}>
            {config.topBarLabel}
          </span>
          
          {/* Admin Badge */}
          {isAdminUser && (
            <span 
              className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-full text-purple-300 font-medium"
              title="You have full platform privileges"
            >
              Founder Access
            </span>
          )}
          
          {/* Active Project */}
          {activeProject && (
            <span className="text-xs text-white/40 font-mono">
              {activeProject}
            </span>
          )}
          
          {/* Status Badge - Only show in Builder mode */}
          {mode === 'builder' && (
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              buildStatus === 'Idle' ? 'bg-gray-500/20 border border-gray-400/30 text-gray-300' :
              buildStatus === 'Generating' ? 'bg-blue-500/20 border border-blue-400/30 text-blue-300' :
              buildStatus === 'Ready for Preview' ? 'bg-green-500/20 border border-green-400/30 text-green-300' :
              buildStatus === 'Live' ? 'bg-purple-500/20 border border-purple-400/30 text-purple-300' :
              'bg-red-500/20 border border-red-400/30 text-red-300'
            }`}>
              {buildStatus}
            </span>
          )}

          {/* Production Warning - Show in Deployment mode */}
          {mode === 'deployment' && (
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-500/30 border border-red-400/50 text-red-200 animate-pulse">
              ⚠️ PRODUCTION MODE
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </header>
  );
}
