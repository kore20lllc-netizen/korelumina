'use client';

import { useState } from 'react';
import type { FileDiff, DiffLine } from '@/lib/parseDiff';

interface DiffViewerProps {
  diffs: FileDiff[];
}

export function DiffViewer({ diffs }: DiffViewerProps) {
  if (diffs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {diffs.map((diff, idx) => (
        <FileDiffView key={`${diff.fileName}-${idx}`} diff={diff} />
      ))}
    </div>
  );
}

interface FileDiffViewProps {
  diff: FileDiff;
}

function FileDiffView({ diff }: FileDiffViewProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      {/* File Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-black/30 hover:bg-black/40 transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-lg">📄</span>
          <span className="font-mono text-sm text-white/80">{diff.fileName}</span>
        </div>
        <span className="text-white/40 text-xs">
          {expanded ? '▼' : '▶'}
        </span>
      </button>

      {/* Diff Content */}
      {expanded && (
        <div className="bg-black/50 p-4 font-mono text-sm overflow-x-auto">
          {diff.changes.map((line, idx) => (
            <DiffLineView key={idx} line={line} lineNumber={idx + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface DiffLineViewProps {
  line: DiffLine;
  lineNumber: number;
}

function DiffLineView({ line, lineNumber }: DiffLineViewProps) {
  const typeStyles = {
    add: 'text-green-400',
    remove: 'text-red-400',
    context: 'text-gray-400',
  };

  const prefix = {
    add: '+ ',
    remove: '- ',
    context: '  ',
  };

  return (
    <div className="flex gap-4 hover:bg-white/5 px-2 py-0.5 rounded">
      <span className="text-white/30 select-none w-12 text-right flex-shrink-0">
        {lineNumber}
      </span>
      <span className={`${typeStyles[line.type]} whitespace-pre flex-1 overflow-x-auto`}>
        {prefix[line.type]}{line.content}
      </span>
    </div>
  );
}
