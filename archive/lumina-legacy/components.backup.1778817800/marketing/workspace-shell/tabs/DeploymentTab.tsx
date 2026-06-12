'use client';

/**
 * DeploymentTab - Isolated deployment mode
 * 
 * ENFORCES:
 * - Deployment actions are explicit and isolated
 * - No preview mixing
 * - No editor access
 * - Clear production warnings
 */

export default function DeploymentTab() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* WARNING BANNER */}
      <div className="mb-6 bg-red-900/20 border-2 border-red-500/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-red-400 font-bold text-lg mb-1">
              Production Deployment Mode
            </h3>
            <p className="text-red-300/80 text-sm">
              You are in deployment mode. Actions taken here will affect your LIVE PRODUCTION environment.
              GitHub main branch is the ONLY production source.
            </p>
          </div>
        </div>
      </div>

      {/* DEPLOYMENT STATUS */}
      <div className="bg-black/30 rounded-lg border border-white/10 p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Deployment Status
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <p className="text-white font-medium">Current Production Status</p>
              <p className="text-white/60 text-sm">Live on Vercel</p>
            </div>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm font-medium">
              Live
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <p className="text-white font-medium">Last Deployment</p>
              <p className="text-white/60 text-sm">Placeholder - No deployments yet</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Production URL</p>
              <p className="text-white/60 text-sm">Not configured</p>
            </div>
          </div>
        </div>
      </div>

      {/* DEPLOYMENT ACTIONS */}
      <div className="bg-black/30 rounded-lg border border-white/10 p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Deployment Actions
        </h2>
        
        <div className="space-y-3">
          <button
            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg hover:from-green-500 hover:to-green-400 transition-all"
            disabled
          >
            Deploy to Production
          </button>
          <p className="text-white/50 text-sm text-center">
            TODO: Connect to actual deployment logic from builder state
          </p>
        </div>
      </div>

      {/* DEPLOYMENT HISTORY */}
      <div className="bg-black/30 rounded-lg border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Deployment History
        </h2>
        <div className="text-center py-8">
          <p className="text-white/60">No deployment history available</p>
          <p className="text-white/40 text-sm mt-2">
            Deployments will appear here once you deploy to production
          </p>
        </div>
      </div>

      {/* RULES REMINDER */}
      <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-semibold mb-2 text-sm">Deployment Rules</h3>
        <ul className="text-blue-300/70 text-xs space-y-1">
          <li>• Deployment actions are explicit and require confirmation</li>
          <li>• GitHub main branch is the only production source</li>
          <li>• Preview must be tested before deploying</li>
          <li>• No automatic deployments on file changes</li>
        </ul>
      </div>
    </div>
  );
}
