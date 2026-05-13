"use client";

import { useMemo } from "react";

export type PreviewFrameProps = {
  projectId: string;
  refreshTick?: number;
};

export default function PreviewFrame({
  projectId,
  refreshTick = 0,
}: PreviewFrameProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams({
      projectId,
      v: String(refreshTick),
    });

    return `/api/dev/preview?${params.toString()}`;
  }, [projectId, refreshTick]);

  return (
    <iframe
      key={`${projectId}-${refreshTick}`}
      src={src}
      title={`Preview: ${projectId}`}
      className="w-full h-full border-0 bg-white"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
    />
  );
}
