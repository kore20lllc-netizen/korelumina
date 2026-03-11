'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface WorkspaceLayoutProps {
  children: ReactNode;
  workspaceName?: string;
  activeProject?: string;
  buildStatus?: 'Idle' | 'Generating' | 'Ready for Preview' | 'Live' | 'Failed';
  isAdminUser?: boolean;
  onNewProject?: () => void;
}

export default function WorkspaceLayout({
  children,
  workspaceName = 'KoreLumina',
  activeProject,
  buildStatus = 'Idle',
  isAdminUser = false,
  onNewProject,
}: WorkspaceLayoutProps) {
  return (
    <div className="min-h-screen bg-[#05070B] flex flex-col">
      {/* Fixed Top Bar */}
      <header className="border-b border-white/10 bg-black/50 flex-shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#4A90E2] to-[#C85BFF] rounded-lg" />
            <h1 className="text-xl font-semibold text-white">{workspaceName}</h1>
            {isAdminUser && (
              <span 
                className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-full text-purple-300 font-medium"
                title="You have full platform privileges"
              >
                Founder Access
              </span>
            )}
            {activeProject && (
              <span className="text-xs text-white/40 font-mono">
                {activeProject}
              </span>
            )}
            {/* Status Badge */}
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              buildStatus === 'Idle' ? 'bg-gray-500/20 border border-gray-400/30 text-gray-300' :
              buildStatus === 'Generating' ? 'bg-blue-500/20 border border-blue-400/30 text-blue-300' :
              buildStatus === 'Ready for Preview' ? 'bg-green-500/20 border border-green-400/30 text-green-300' :
              buildStatus === 'Live' ? 'bg-purple-500/20 border border-purple-400/30 text-purple-300' :
              'bg-red-500/20 border border-red-400/30 text-red-300'
            }`}>
              {buildStatus}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {onNewProject && (
              <button
                onClick={onNewProject}
                className="px-4 py-2 text-sm bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                + New Project
              </button>
            )}
            <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Left Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0 border-r border-white/10">
          <div className="p-6">
            <h2 className="text-lg font-bold text-white/90">{workspaceName}</h2>
            <p className="text-gray-400 text-sm mt-1">Workspace</p>
          </div>
          
          <nav className="flex-1 px-4">
            <div className="space-y-2">
              <Link
                href="/builder"
                className="block px-4 py-2 rounded-lg bg-gray-800 text-white font-medium"
                title="Build and describe your project"
              >
                Builder
              </Link>
              <button
                className="w-full text-left block px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-not-allowed opacity-60"
                disabled
                title="Review generated files and structure"
              >
                Files
              </button>
              <button
                className="w-full text-left block px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-not-allowed opacity-60"
                disabled
                title="Track previews and production releases"
              >
                Deployments
              </button>
            </div>
          </nav>
          
          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">Version 0.1.0</p>
          </div>
        </aside>

        {/* Main Content Area - Single Scrolling Region */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
