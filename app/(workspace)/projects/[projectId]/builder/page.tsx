"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Health = "idle" | "building" | "error" | "ready";

export default function BuilderPage() {
  const params = useParams();
  const projectId = params?.projectId as string | undefined;

  const workspaceId = "default";

  const [health, setHealth] = useState<Health>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const stateUrl = useMemo(() => {
    if (!projectId) return null;
    return `/api/workspaces/${workspaceId}/projects/${projectId}/state`;
  }, [projectId]);

  const eventsUrl = useMemo(() => {
    if (!projectId) return null;
    return `/api/workspaces/${workspaceId}/projects/${projectId}/events`;
  }, [projectId]);

  async function refreshState() {
    if (!stateUrl) return;
    const r = await fetch(stateUrl, { cache: "no-store" });
    const d = await r.json();
    setHealth(d.health);
    setPreviewUrl(d.previewUrl ?? null);
  }

  useEffect(() => {
    if (!projectId) return;

    refreshState();

    if (!eventsUrl) return;
    const es = new EventSource(eventsUrl);

    es.onmessage = (e) => {
      setLogs((prev) => [...prev.slice(-800), e.data]);
    };

    return () => {
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!projectId) {
    return <div className="p-6">No project selected</div>;
  }

  async function triggerBuild() {
    await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/build`, {
      method: "POST",
    });
    await refreshState();
  }

  async function triggerPreview() {
    await fetch(
      `/api/workspaces/${workspaceId}/projects/${projectId}/preview/start`,
      { method: "POST" }
    );
    await refreshState();
    setIframeKey((k) => k + 1);
  }

  function reloadIframe() {
    setIframeKey((k) => k + 1);
  }

  return (
    <div className="h-screen w-screen bg-black text-green-300 font-mono flex flex-col">
      {/* Top Bar */}
      <div className="h-14 px-4 border-b border-green-900 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-lg font-bold">Korelumina Builder</div>
          <div className="text-xs opacity-70">
            {workspaceId}/{projectId} • health={health}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshState}
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-green-200"
          >
            Refresh
          </button>

          <button
            onClick={triggerBuild}
            className="px-3 py-1 rounded bg-green-800 hover:bg-green-700 text-green-100"
          >
            Build
          </button>

          <button
            onClick={triggerPreview}
            className="px-3 py-1 rounded bg-blue-800 hover:bg-blue-700 text-blue-100"
          >
            Start Preview
          </button>

          <button
            onClick={reloadIframe}
            disabled={!previewUrl}
            className="px-3 py-1 rounded bg-purple-800 hover:bg-purple-700 disabled:opacity-40 text-purple-100"
          >
            Reload Preview
          </button>

          <a
            href={previewUrl ?? "#"}
            target="_blank"
            className={`px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-green-200 ${
              previewUrl ? "" : "pointer-events-none opacity-40"
            }`}
          >
            Open
          </a>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Console */}
        <div className="w-[45%] border-r border-green-900 flex flex-col">
          <div className="h-10 px-3 flex items-center border-b border-green-900 text-xs opacity-80">
            Console (events)
          </div>
          <div className="flex-1 overflow-auto p-3 text-xs whitespace-pre-wrap">
            {logs.length ? logs.join("\n") : "Waiting for logs..."}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 flex flex-col">
          <div className="h-10 px-3 flex items-center border-b border-green-900 text-xs opacity-80">
            Preview {previewUrl ? `• ${previewUrl}` : "• not running"}
          </div>

          <div className="flex-1 bg-zinc-950">
            {previewUrl ? (
              <iframe
                key={iframeKey}
                src={previewUrl}
                className="w-full h-full"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm opacity-70">
                Preview not running. Click “Start Preview”.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
