'use client';

import { useState } from 'react';
import { LuminaThinking } from '@/components/brand';

export interface Deployment {
  id: string;
  version: number;
  environment: string;
  status: 'live' | 'rolled_back' | 'failed';
  commit_sha?: string;
  file_count?: number;
  deployed_at: string;
  rolled_back_at?: string;
  rollback_reason?: string;
}

interface DeploymentHistoryProps {
  deployments: Deployment[];
  isLoading: boolean;
  onRollback: (deployment: Deployment) => void;
  isRollingBack: boolean;
}

export function DeploymentHistory({
  deployments,
  isLoading,
  onRollback,
  isRollingBack,
}: DeploymentHistoryProps) {
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);

  const liveDeployment = deployments.find(d => d.status === 'live');
  const hasMultipleDeployments = deployments.length > 1;

  const handleRollbackClick = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setShowRollbackModal(true);
  };

  const confirmRollback = () => {
    if (selectedDeployment) {
      onRollback(selectedDeployment);
      setShowRollbackModal(false);
      setSelectedDeployment(null);
    }
  };

  const cancelRollback = () => {
    setShowRollbackModal(false);
    setSelectedDeployment(null);
  };

  // Helper to format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LuminaThinking mode="orbit" size={32} />
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className="bg-black/20 rounded-lg border border-white/10 p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-white/5 rounded-lg flex items-center justify-center">
          <span className="text-2xl">🚀</span>
        </div>
        <p className="text-white/60">This project has not been deployed yet.</p>
      </div>
    );
  }

  if (!hasMultipleDeployments) {
    return (
      <div className="bg-black/20 rounded-lg border border-white/10 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={deployments[0].status} />
              <span className="font-mono text-sm text-white/90">
                Version v{deployments[0].version}
              </span>
            </div>
            <p className="text-sm text-white/60">
              Deployed to {deployments[0].environment} • {getRelativeTime(deployments[0].deployed_at)}
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-white/50">No previous versions available for rollback.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deployments.map((deployment) => {
        const isLive = deployment.status === 'live';
        const canRollback = !isLive && deployment.status !== 'failed' && liveDeployment;

        return (
          <div
            key={deployment.id}
            className={`bg-black/20 rounded-lg border border-white/10 p-4 ${
              isLive ? 'ring-1 ring-green-500/30' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={deployment.status} />
                  <span className="font-mono text-sm text-white/90">
                    Version v{deployment.version}
                  </span>
                  {isLive && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-green-400">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/60 mb-1">
                  Deployed to {deployment.environment} • {getRelativeTime(deployment.deployed_at)}
                </p>
                {deployment.commit_sha && (
                  <p className="text-xs text-white/40 font-mono">
                    {deployment.commit_sha.substring(0, 7)}
                  </p>
                )}
                {deployment.rollback_reason && (
                  <p className="text-xs text-white/50 mt-2 italic">
                    {deployment.rollback_reason}
                  </p>
                )}
              </div>

              {canRollback && !isRollingBack && (
                <button
                  onClick={() => handleRollbackClick(deployment)}
                  className="px-4 py-2 text-sm bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Rollback
                </button>
              )}

              {isRollingBack && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <LuminaThinking mode="pulse" size={16} />
                  <span>Rolling back...</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Rollback Confirmation Modal */}
      {showRollbackModal && selectedDeployment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0A0E14] border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Rollback to Version v{selectedDeployment.version}
            </h3>
            <p className="text-white/70 mb-6">
              This will restore a previous production version. The current version will remain available for future rollback.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmRollback}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg hover:opacity-90"
              >
                Confirm Rollback
              </button>
              <button
                onClick={cancelRollback}
                className="px-4 py-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: 'live' | 'rolled_back' | 'failed' }) {
  const styles = {
    live: 'bg-green-500/20 border-green-500/30 text-green-400',
    rolled_back: 'bg-gray-500/20 border-gray-500/30 text-gray-400',
    failed: 'bg-red-500/20 border-red-500/30 text-red-400',
  };

  const labels = {
    live: 'Live',
    rolled_back: 'Rolled Back',
    failed: 'Failed',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
