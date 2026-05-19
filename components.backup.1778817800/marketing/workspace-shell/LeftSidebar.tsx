'use client';

import { useWorkspaceMode } from '@/lib/WorkspaceModeContext';

export default function LeftSidebar() {
  const { mode, requestModeSwitch } = useWorkspaceMode();

  const handleModeSwitch = async (targetMode: 'builder' | 'preview' | 'deployment') => {
    await requestModeSwitch(targetMode);
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0 border-r border-white/10">
      <div className="p-6">
        <h2 className="text-lg font-bold text-white/90">Navigation</h2>
        <p className="text-gray-400 text-sm mt-1">Workspace</p>
      </div>
      
      <nav className="flex-1 px-4">
        <div className="space-y-2">
          <button
            onClick={() => handleModeSwitch('builder')}
            className={`w-full text-left block px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'builder'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
            title="Build and describe your project"
          >
            Builder
          </button>
          <button
            onClick={() => handleModeSwitch('preview')}
            className={`w-full text-left block px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'preview'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
            title="Preview your build (read-only)"
          >
            Preview
          </button>
          <button
            onClick={() => handleModeSwitch('deployment')}
            className={`w-full text-left block px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'deployment'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
            title="Deploy to production"
          >
            Deployment
          </button>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">Version 0.1.0</p>
      </div>
    </aside>
  );
}
