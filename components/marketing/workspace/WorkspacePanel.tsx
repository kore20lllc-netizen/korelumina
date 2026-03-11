'use client';

import { useState } from 'react';

type TabType = 'preview' | 'files' | 'logs';

/**
 * WorkspacePanel - Right Panel
 * Placeholder for preview/files/logs with interactive tabs
 * 
 * Features:
 * - Clickable tabs (Preview, Files, Logs)
 * - Switches visible placeholder based on active tab
 * - NO real data (UI only)
 * - No animations, no spinners, no loaders
 */
export default function WorkspacePanel() {
  const [activeTab, setActiveTab] = useState<TabType>('preview');

  return (
    <aside className="bg-[#0A0C12] border-l border-white/10 flex flex-col">
      {/* Tab Header - Interactive */}
      <div className="border-b border-white/10 flex" role="tablist">
        <button 
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'text-white/70 border-b-2 border-white/20'
              : 'text-white/40 hover:text-white/70'
          }`}
          role="tab"
          aria-selected={activeTab === 'preview'}
          aria-controls="preview-panel"
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
        <button 
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'files'
              ? 'text-white/70 border-b-2 border-white/20'
              : 'text-white/40 hover:text-white/70'
          }`}
          role="tab"
          aria-selected={activeTab === 'files'}
          aria-controls="files-panel"
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
        <button 
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'logs'
              ? 'text-white/70 border-b-2 border-white/20'
              : 'text-white/40 hover:text-white/70'
          }`}
          role="tab"
          aria-selected={activeTab === 'logs'}
          aria-controls="logs-panel"
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
      </div>

      {/* Panel Content - Switches based on activeTab */}
      <div className="flex-1 flex items-center justify-center p-6">
        {activeTab === 'preview' && (
          <div className="text-center" role="tabpanel" id="preview-panel">
            <div className="text-white/50 text-sm font-medium mb-2">
              Preview Panel
            </div>
            <div className="text-white/30 text-xs">
              Preview placeholder
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="text-center" role="tabpanel" id="files-panel">
            <div className="text-white/50 text-sm font-medium mb-2">
              Files Panel
            </div>
            <div className="text-white/30 text-xs">
              Files placeholder
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="text-center" role="tabpanel" id="logs-panel">
            <div className="text-white/50 text-sm font-medium mb-2">
              Logs Panel
            </div>
            <div className="text-white/30 text-xs">
              Logs placeholder
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
