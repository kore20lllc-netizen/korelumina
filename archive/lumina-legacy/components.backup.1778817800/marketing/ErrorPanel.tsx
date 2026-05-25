'use client';

import { useState } from 'react';
import type { ClassifiedError } from '@/lib/errorClassifier';

interface ErrorPanelProps {
  error: ClassifiedError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorPanel({ error, onRetry, onDismiss }: ErrorPanelProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="my-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
      {/* Header with icon and title */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl flex-shrink-0">⚠️</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-red-400 mb-1">
            {error.title}
          </h3>
          <p className="text-sm text-red-300/90 leading-relaxed">
            {error.message}
          </p>
        </div>
      </div>

      {/* Next steps */}
      {error.nextSteps && error.nextSteps.length > 0 && (
        <div className="mb-3 pl-10">
          <p className="text-xs font-medium text-red-300/80 mb-2">What you can do next:</p>
          <ul className="space-y-1">
            {error.nextSteps.map((step, index) => (
              <li key={index} className="text-xs text-red-300/70 flex items-start gap-2">
                <span className="text-red-400/60 mt-0.5">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pl-10">
        {error.canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-sm text-red-300/60 hover:text-red-300 underline"
          >
            Dismiss
          </button>
        )}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="ml-auto text-xs text-red-300/60 hover:text-red-300 underline"
        >
          {showDetails ? 'Hide' : 'Show'} details
        </button>
      </div>

      {/* Collapsible details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-red-500/20 pl-10">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-red-300/60 font-medium">Category:</span>
              <span className="text-red-300/80 font-mono">{error.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-300/60 font-medium">Reference ID:</span>
              <span className="text-red-300/80 font-mono">{error.referenceId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-300/60 font-medium">Timestamp:</span>
              <span className="text-red-300/80 font-mono">
                {new Date(error.timestamp).toLocaleString()}
              </span>
            </div>
            {error.technicalDetails && (
              <div className="flex flex-col gap-1 mt-3">
                <span className="text-red-300/60 font-medium">Technical details:</span>
                <div className="text-red-300/70 font-mono text-xs bg-black/20 rounded p-2 break-words">
                  {error.technicalDetails}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
