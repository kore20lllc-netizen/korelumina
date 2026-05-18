"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function StudioRuntime() {
  const params = useParams();

  const projectId =
    typeof params?.projectId === "string"
      ? params.projectId
      : Array.isArray(params?.projectId)
      ? params.projectId[0]
      : "korelumina-dogfood";

  const [html, setHtml] = useState<string>("Loading runtime...");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/dev/preview?projectId=${encodeURIComponent(projectId)}`
        );

        const text = await res.text();
        setHtml(text);
      } catch (error) {
        console.error("Studio runtime failed:", error);
        setHtml("<div>Failed to load runtime.</div>");
      }
    }

    load();
  }, [projectId]);

  return (
    <iframe
      title={`Studio Runtime - ${projectId}`}
      srcDoc={html}
      className="w-full h-screen border-0"
    />
  );
}
