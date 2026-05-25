'use client';

export default function FilesTab() {
  return (
    <div className="p-6 flex items-center justify-center min-h-full">
      <div className="text-center max-w-2xl">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#5DE2E7] to-[#4A90E2] rounded-2xl flex items-center justify-center">
          <span className="text-3xl">📁</span>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-3">
          Files will appear here
        </h2>
        <p className="text-white/60 mb-6">
          Once you generate a project, you&apos;ll see all your files and folders here.
          You can browse, search, and view file contents.
        </p>
        <div className="bg-black/30 rounded-lg border border-white/10 p-6 text-left">
          <p className="text-sm text-white/70 mb-3 font-semibold">What you&apos;ll see:</p>
          <ul className="space-y-2 text-sm text-white/60">
            <li>• Project file tree structure</li>
            <li>• File contents with syntax highlighting</li>
            <li>• Quick search through files</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
