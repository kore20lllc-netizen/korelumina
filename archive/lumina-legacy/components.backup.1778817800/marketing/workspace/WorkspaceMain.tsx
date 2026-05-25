'use client';

/**
 * WorkspaceMain - Center Panel
 * Placeholder for builder/chat area (main work surface)
 * 
 * Props:
 * - projectId?: string - Optional project ID to display context
 */
export default function WorkspaceMain({ projectId }: { projectId?: string }) {
  return (
    <main className="bg-[#05070B] flex flex-col items-center justify-center">
      <div className="text-center">
        {projectId ? (
          <>
            <div className="text-white/50 text-lg font-medium mb-2">
              Building project: {projectId}
            </div>
            <div className="text-white/30 text-sm">
              Chat area placeholder
            </div>
          </>
        ) : (
          <>
            <div className="text-white/50 text-lg font-medium mb-2">
              Builder
            </div>
            <div className="text-white/30 text-sm">
              Main work surface placeholder
            </div>
          </>
        )}
      </div>
    </main>
  );
}
