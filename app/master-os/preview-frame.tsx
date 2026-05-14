"use client";

interface PreviewFrameProps {
  projectId: string;
}

export default function PreviewFrame({
  projectId,
}: PreviewFrameProps) {
  const src = `/api/dev/preview?projectId=${encodeURIComponent(
    projectId,
  )}`;

  return (
    <iframe
      src={src}
      title={`Preview: ${projectId}`}
      className="h-full w-full border-0 bg-white"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
    />
  );
}
