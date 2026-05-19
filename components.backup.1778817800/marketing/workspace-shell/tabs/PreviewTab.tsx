'use client';

/**
 * PreviewTab - Isolated preview mode
 * 
 * ENFORCES:
 * - Preview is READ-ONLY
 * - No deployment actions in preview
 * - No editor access
 * - Clear preview-only state
 */

export default function PreviewTab() {
  // TODO: Connect to actual preview state from builder
  const hasPreview = false;

  if (!hasPreview) {
    return (
      <div className="p-6 flex items-center justify-center min-h-full">
        <div className="text-center max-w-2xl">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#C85BFF] to-[#4A90E2] rounded-2xl flex items-center justify-center">
            <span className="text-3xl">👁️</span>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">
            No Preview Available
          </h2>
          <p className="text-white/60 mb-6">
            Switch to Builder mode and create a build first. Once your project is built,
            return here to see a live preview of your application.
          </p>
          <div className="bg-black/30 rounded-lg border border-white/10 p-6 text-left">
            <p className="text-sm text-white/70 mb-3 font-semibold">Preview mode rules:</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li>• Preview is read-only - no editing allowed</li>
              <li>• Test your build before deploying</li>
              <li>• Cannot deploy directly from preview mode</li>
              <li>• Return to Builder to make changes</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Preview Controls */}
      <div className="mb-4 bg-black/30 rounded-lg border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Live Preview</h3>
            <p className="text-white/60 text-sm">Read-only mode - Switch to Builder to make changes</p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded hover:bg-white/20 transition-colors"
              title="Refresh preview"
            >
              Refresh
            </button>
            <button
              className="px-3 py-1.5 bg-white/10 text-white text-sm rounded hover:bg-white/20 transition-colors"
              title="Open in new tab"
            >
              Open ↗
            </button>
          </div>
        </div>
      </div>

      {/* Preview Iframe */}
      <div className="flex-1 bg-black rounded-lg border border-white/10 overflow-hidden">
        <iframe
          src="about:blank" // TODO: Connect to actual preview URL from builder state
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin"
          title="Preview"
        />
      </div>

      {/* Bottom Info Bar */}
      <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <p className="text-blue-300 text-xs">
          🔒 Preview is read-only. To make changes, return to Builder mode.
        </p>
      </div>
    </div>
  );
}
