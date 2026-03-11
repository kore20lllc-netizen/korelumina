'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function BuilderPage() {
  const [projectId] = useState('demo-project');
  const [previewRunning, setPreviewRunning] = useState(false);

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r p-3">
        <div className="font-semibold mb-2">Builder</div>

        {!previewRunning ? (
          <button onClick={() => setPreviewRunning(true)}>
            Start Preview
          </button>
        ) : (
          <button onClick={() => setPreviewRunning(false)}>
            Stop Preview
          </button>
        )}
      </aside>

      <main className="flex-1">
        {previewRunning ? (
          <iframe
            src={`/preview?projectId=${projectId}`}
            className="w-full h-full border-none"
          />
        ) : (
          <div className="p-6 text-muted-foreground">
            Preview not running
          </div>
        )}
      </main>
    </div>
  );
}
