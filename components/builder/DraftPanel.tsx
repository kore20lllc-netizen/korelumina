"use client";

import { useEffect, useState } from "react";

export type DraftPanelProps = {
  projectId: string;
  refreshTick?: number;
  onAccepted?: () => void;
};

type Draft = {
  file: string;
  code: string;
};

export default function DraftPanel({
  projectId,
  refreshTick = 0,
  onAccepted,
}: DraftPanelProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!projectId) return;

      setLoading(true);

      try {
        const res = await fetch(
          `/api/ai/draft?projectId=${encodeURIComponent(projectId)}&v=${refreshTick}`,
          { cache: "no-store" }
        );

        const json = await res.json();

        if (!cancelled) {
          setDrafts(Array.isArray(json?.drafts) ? json.drafts : []);
        }
      } catch (error) {
        console.error("[DraftPanel] load failed:", error);

        if (!cancelled) {
          setDrafts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [projectId, refreshTick]);

  async function acceptDraft() {
    try {
      const res = await fetch("/api/ai/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        throw new Error(json?.error || "Apply failed");
      }

      onAccepted?.();
    } catch (error) {
      console.error("[DraftPanel] apply failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to apply draft"
      );
    }
  }

  return (
    <div className="h-full overflow-auto border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold">Drafts</h2>
      </div>

      {loading ? (
        <div className="p-3 text-sm text-gray-500">
          Loading drafts...
        </div>
      ) : drafts.length === 0 ? (
        <div className="p-3 text-sm text-gray-500">
          No pending drafts.
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {drafts.map((draft, index) => (
            <div
              key={`${draft.file}-${index}`}
              className="rounded border border-gray-200 dark:border-gray-800"
            >
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 text-xs font-medium break-all">
                {draft.file}
              </div>
              <pre className="p-3 text-xs overflow-auto max-h-64 bg-gray-50 dark:bg-gray-900 whitespace-pre-wrap">
                {draft.code}
              </pre>
            </div>
          ))}

          <button
            type="button"
            onClick={acceptDraft}
            className="w-full rounded bg-black text-white dark:bg-white dark:text-black px-3 py-2 text-sm font-medium"
          >
            Apply Drafts
          </button>
        </div>
      )}
    </div>
  );
}
