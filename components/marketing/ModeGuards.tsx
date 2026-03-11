'use client';

import { useWorkspaceMode } from '@/lib/WorkspaceModeContext';

interface ModeSwitchPromptProps {
  targetMode: 'preview' | 'deployment';
  reason: string;
  children?: React.ReactNode;
}

/**
 * ModeSwitchPrompt - Guides users to switch modes instead of showing
 * forbidden UI elements in the current mode
 */
export function ModeSwitchPrompt({ targetMode, reason, children }: ModeSwitchPromptProps) {
  const { mode, requestModeSwitch } = useWorkspaceMode();

  const handleSwitch = async () => {
    await requestModeSwitch(targetMode);
  };

  // Only show if not already in target mode
  if (mode === targetMode) {
    return <>{children}</>;
  }

  return (
    <div className="mt-3 p-4 rounded-lg bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30">
      <div className="flex items-start gap-3">
        <span className="text-2xl">
          {targetMode === 'preview' ? '👁️' : '🚀'}
        </span>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">
            {targetMode === 'preview' ? 'Ready for Preview' : 'Ready to Deploy'}
          </h3>
          <p className="text-white/70 text-sm mb-3">
            {reason}
          </p>
          <button
            onClick={handleSwitch}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              targetMode === 'preview'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
            }`}
          >
            Switch to {targetMode === 'preview' ? 'Preview' : 'Deployment'} Mode →
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ModeGuard - Prevents rendering of mode-inappropriate UI
 */
interface ModeGuardProps {
  allowedModes: Array<'builder' | 'preview' | 'deployment'>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ModeGuard({ allowedModes, fallback, children }: ModeGuardProps) {
  const { mode } = useWorkspaceMode();

  if (!allowedModes.includes(mode)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
