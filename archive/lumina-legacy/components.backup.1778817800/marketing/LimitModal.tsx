'use client';

import { useState } from 'react';
import { LuminaMark } from './brand/LuminaMark';
import { LuminaThinking } from './brand/LuminaThinking';

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  used: number;
  limit: number;
}

export function LimitModal({ isOpen, onClose, used, limit }: LimitModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!isOpen) return null;

  async function handleUpgrade() {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Upgrade failed:', error);
      setIsUpgrading(false);
      alert('Failed to start upgrade. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-[#05070B] to-[#0A0F1C] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <LuminaMark size={64} variant="static" />
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#F5A623] to-[#C85BFF] rounded-full p-2">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-3">
          Execution Limit Reached
        </h2>

        {/* Description */}
        <p className="text-white/70 text-center mb-6">
          You&apos;ve used all <span className="font-semibold text-white">{used}</span> of your{' '}
          <span className="font-semibold text-white">{limit}</span> free executions.
        </p>

        <p className="text-white/60 text-sm text-center mb-8">
          Free plans include {limit} builder executions. Upgrade to Pro for unlimited builds,
          faster execution, and priority support.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#4A90E2] to-[#C85BFF] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isUpgrading ? (
              <>
                <LuminaThinking mode="pulse" size={16} />
                <span>Redirecting...</span>
              </>
            ) : (
              'Upgrade to Pro'
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isUpgrading}
            className="w-full px-6 py-3 text-white/60 hover:text-white/80 font-medium transition-colors disabled:opacity-50"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
