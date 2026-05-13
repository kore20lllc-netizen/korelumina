"use client";

import { useMemo } from "react";

type PreviewFrameProps = {
  projectId: string;
};

export default function PreviewFrame({
  projectId,
}: PreviewFrameProps) {
  const src = useMemo(() => {
    if (!projectId) {
      return "about:blank";
    }

    const params = new URLSearchParams();
    params.set("projectId", projectId);
    params.set("v", String(Date.now()));

    return `/api/dev/preview?${params.toString()}`;
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
        No project selected
      </div>
    );
  }

  return (
    <iframe
      key={src}
      src={src}
      title={`Preview: ${projectId}`}
      className="h-full w-full border-0 bg-white"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
    />
  );
}
