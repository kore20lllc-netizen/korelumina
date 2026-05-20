import { lazy, Suspense } from "react";

const PreviewFrame = lazy(
  () => import("@/components/preview/PreviewFrame")
);

function PreviewFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-sm text-white/70">
        Loading preview...
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<PreviewFallback />}>
      <PreviewFrame />
    </Suspense>
  );
}
