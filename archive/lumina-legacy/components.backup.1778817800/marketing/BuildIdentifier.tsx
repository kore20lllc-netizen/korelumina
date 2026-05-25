'use client';

/**
 * BuildIdentifier - Shows the Git commit SHA in production only
 * 
 * Purpose: Verify which commit is live on production deployments
 * Displays: "Build: abc1234" in bottom-right corner
 * Visibility: Production only (hidden in dev/preview)
 * 
 * Note: Uses NEXT_PUBLIC_BUILD_SHA user-defined variable.
 * DO NOT use NEXT_PUBLIC_VERCEL_* variables directly.
 */
export default function BuildIdentifier() {
  // Only show in production environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Get commit SHA from user-defined environment variable
  // This should be set at build time, NOT derived from VERCEL_GIT_COMMIT_SHA
  const commitSha = process.env.NEXT_PUBLIC_BUILD_SHA;
  
  // Don't render if not production or no commit SHA
  if (!isProduction || !commitSha) {
    return null;
  }
  
  // Extract first 7 characters
  const shortSha = commitSha.substring(0, 7);
  
  return (
    <div
      className="fixed bottom-4 right-4 text-xs text-white/20 pointer-events-none select-none"
      style={{ zIndex: 9999 }}
    >
      Build: {shortSha}
    </div>
  );
}
