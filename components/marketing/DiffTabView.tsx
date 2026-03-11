'use client';

import { useState } from 'react';
import type { FileDiff } from '@/lib/parseDiff';

export type FileStatus = 'added' | 'modified' | 'deleted';

export interface FileChange {
  fileName: string;
  status: FileStatus;
  diff: FileDiff;
}

interface DiffTabViewProps {
  fileChanges: FileChange[];
  emptyState?: 'no-build' | 'build-failed' | 'no-previous' | 'no-changes';
}

const MAX_FILE_SIZE = 10000; // Max lines to show before truncating

export function DiffTabView({ fileChanges, emptyState }: DiffTabViewProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(
    fileChanges.length > 0 ? fileChanges[0].fileName : null
  );

  // Handle empty states
  if (emptyState) {
    return (
      <div className="flex items-center justify-center h-96 bg-black/20 rounded-lg border border-white/10">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-lg flex items-center justify-center">
            <span className="text-3xl">📄</span>
          </div>
          <p className="text-white/60 mb-2">
            {emptyState === 'no-build' && 'Generate a build to see changes.'}
            {emptyState === 'build-failed' && 'No diff available for failed builds.'}
            {emptyState === 'no-previous' && 'No previous build to compare.'}
            {emptyState === 'no-changes' && 'No file changes detected.'}
          </p>
        </div>
      </div>
    );
  }

  if (fileChanges.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-black/20 rounded-lg border border-white/10">
        <div className="text-center">
          <p className="text-white/60">No file changes detected.</p>
        </div>
      </div>
    );
  }

  const selectedFileChange = fileChanges.find(f => f.fileName === selectedFile);

  return (
    <div className="flex gap-4 h-[600px] bg-black/20 rounded-lg border border-white/10 overflow-hidden">
      {/* File List - Left Side */}
      <div className="w-80 border-r border-white/10 overflow-y-auto">
        <div className="p-4 border-b border-white/10 bg-black/30">
          <h3 className="text-sm font-semibold text-white/80">Files Changed</h3>
          <p className="text-xs text-white/50 mt-1">{fileChanges.length} file(s)</p>
        </div>
        <div className="p-2">
          {fileChanges.map((file) => (
            <button
              key={file.fileName}
              onClick={() => setSelectedFile(file.fileName)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                selectedFile === file.fileName
                  ? 'bg-white/10 border border-white/20'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileStatusBadge status={file.status} />
                <span className="text-xs font-mono text-white/70 truncate">
                  {file.fileName}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Diff Content - Right Side */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedFileChange ? (
          <div>
            <div className="mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <FileStatusBadge status={selectedFileChange.status} />
                <h3 className="font-mono text-sm text-white/90">
                  {selectedFileChange.fileName}
                </h3>
              </div>
            </div>
            
            <DiffContent diff={selectedFileChange.diff} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/50">
            Select a file to view changes
          </div>
        )}
      </div>
    </div>
  );
}

function FileStatusBadge({ status }: { status: FileStatus }) {
  const styles = {
    added: 'bg-green-500/20 border-green-500/30 text-green-400',
    modified: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    deleted: 'bg-red-500/20 border-red-500/30 text-red-400',
  };

  const labels = {
    added: 'Added',
    modified: 'Modified',
    deleted: 'Deleted',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function DiffContent({ diff }: { diff: FileDiff }) {
  // Check if diff is too large
  const totalLines = diff.changes.length;
  const shouldTruncate = totalLines > MAX_FILE_SIZE;
  const displayedChanges = shouldTruncate ? diff.changes.slice(0, MAX_FILE_SIZE) : diff.changes;

  return (
    <div>
      {shouldTruncate && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400">
            ⚠️ File truncated for performance. Showing {MAX_FILE_SIZE} of {totalLines} lines.
          </p>
        </div>
      )}
      
      <div className="bg-black/50 rounded-lg border border-white/10 p-4 font-mono text-sm overflow-x-auto">
        {displayedChanges.map((line, idx) => {
          const typeStyles = {
            add: 'text-green-400 bg-green-500/5',
            remove: 'text-red-400 bg-red-500/5',
            context: 'text-gray-400',
          };

          const prefix = {
            add: '+ ',
            remove: '- ',
            context: '  ',
          };

          return (
            <div
              key={idx}
              className={`flex gap-4 px-2 py-0.5 rounded ${typeStyles[line.type]}`}
            >
              <span className="text-white/30 select-none w-12 text-right flex-shrink-0">
                {idx + 1}
              </span>
              <span className="whitespace-pre flex-1 overflow-x-auto">
                {prefix[line.type]}{line.content}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
