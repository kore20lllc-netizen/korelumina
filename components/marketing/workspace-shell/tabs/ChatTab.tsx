'use client';

import { ReactNode } from 'react';

interface ChatTabProps {
  children?: ReactNode;
}

export default function ChatTab({ children }: ChatTabProps) {
  // If children are provided (from builder page), render them
  // Otherwise show the placeholder
  if (children) {
    return <div className="p-6">{children}</div>;
  }

  return (
    <div className="p-6 flex items-center justify-center min-h-full">
      <div className="text-center max-w-2xl">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#4A90E2] to-[#C85BFF] rounded-2xl flex items-center justify-center">
          <span className="text-3xl">💬</span>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-3">
          Describe what you want to build
        </h2>
        <p className="text-white/60 mb-6">
          Start a conversation with KoreLumina to build your application. 
          Describe your idea, and we&apos;ll generate the code for you.
        </p>
        <div className="bg-black/30 rounded-lg border border-white/10 p-6 text-left">
          <p className="text-sm text-white/70 mb-3 font-semibold">Try examples like:</p>
          <ul className="space-y-2 text-sm text-white/60">
            <li>• &quot;Build a landing page with email signup&quot;</li>
            <li>• &quot;Create a task management dashboard&quot;</li>
            <li>• &quot;Make a portfolio website with contact form&quot;</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
