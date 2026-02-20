"use client";

import * as React from "react";

type Props = { workspaceId: string; projectId: string };

type StateResp = {
  workspaceId: string;
  projectId: string;
  manifest?: any;
  latestJob?: any;
  isBuilding?: boolean;
  canBuild?: boolean;
  logExists?: boolean;
  health?: "idle" | "building" | "error" | "ready";
  previewUrl?: string | null;
  logs?: string[];
};

async function getState(workspaceId: string, projectId: string): Promise<StateResp> {
  const r = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/state`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function startPreview(workspaceId: string, projectId: string): Promise<any> {
  const r = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/preview/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function BuilderShell({ workspaceId, projectId }: Props) {
  const [state, setState] = React.useState<StateResp | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setErr(null);
    try {
      const s = await getState(workspaceId, projectId);
      setState(s);
      if (s.previewUrl) setPreviewUrl(s.previewUrl);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load state");
    }
  }, [workspaceId, projectId]);

  React.useEffect(() => {
    refresh();
    const t = setInterval(refresh, 1500);
    return () => clearInterval(t);
  }, [refresh]);

  async function onStartPreview() {
    setLoading(true);
    setErr(null);
    try {
      const res = await startPreview(workspaceId, projectId);
      const url = res?.preview?.url ?? res?.url ?? null;
      if (url) setPreviewUrl(url);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Preview start failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      {/* Left: Project info / file tree placeholder */}
      <aside className="w-72 border-r p-3 flex flex-col gap-3">
        <div className="font-semibold">Korelumina Builder</div>
        <div className="text-sm text-muted-foreground">
          Workspace: <span className="font-mono">{workspaceId}</span><br />
          Project: <span className="font-mono">{projectId}</span>
        </div>

        <div className="text-sm">
          Health: <span className="font-mono">{state?.health ?? "..."}</span>
        </div>

        <button
          onClick={onStartPreview}
          disabled={loading}
          className="px-3 py-2 rounded border text-sm"
        >
          {loading ? "Starting preview..." : "Start / Ensure Preview"}
        </button>

        {err ? (
          <div className="text-sm text-red-600 whitespace-pre-wrap">{err}</div>
        ) : null}

        <div className="mt-2 text-xs text-muted-foreground">
          (File tree next)
        </div>
      </aside>

      {/* Middle: Editor placeholder */}
      <main className="flex-1 border-r p-3">
        <div className="font-semibold mb-2">Editor</div>
        <div className="text-sm text-muted-foreground">
          (Editor next — Monaco / file read-write pipeline)
        </div>
      </main>

      {/* Right: Live Preview */}
      <section className="w-[48%] min-w-[520px] p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Preview</div>
          <div className="text-xs text-muted-foreground font-mono">
            {previewUrl ?? "(not running)"}
          </div>
        </div>

        <div className="flex-1 border rounded overflow-hidden bg-black/5">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full"
              allow="clipboard-read; clipboard-write"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
              Click “Start / Ensure Preview”
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
