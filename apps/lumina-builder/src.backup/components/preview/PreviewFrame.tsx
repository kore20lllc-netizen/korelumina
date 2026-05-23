"use client";

import { useEffect, useRef } from "react";

type PreviewFrameProps = {
  html: string;
  className?: string;
};

export default function PreviewFrame({
  html,
  className = "",
}: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      title="Preview"
      className={className}
      sandbox="allow-scripts allow-same-origin"
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        background: "#ffffff",
      }}
    />
  );
}
