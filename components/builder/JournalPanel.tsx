"use client";

import { useEffect, useState } from "react";

type JournalEntry = {
  timestamp?: string;
  message?: string;
  action?: string;
  [key: string]: unknown;
};

export type JournalPanelProps = {
  projectId: string;
  refreshTick?: number;
};

export default function JournalPanel({
  projectId,
  refreshTick = 0,
}: JournalPanelProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          projectId,
          v: String(refreshTick),
        });

        const res = await fetch(
          `/api/dev/journal?${params.toString()}`,
          { cache: "no-store" },
        );

        const data = await res.json();

        if (!cancelled) {
          setEntries(
            Array.isArray(data?.entries)
              ? data.entries
              : [],
          );
        }
      } catch (error) {
        console.error(
          "[JournalPanel] load failed:",
          error,
        );

        if (!cancelled) {
          setEntries([]);
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

  if (loading && entries.length === 0) {
    return (
      <div className="p-3 text-sm text-gray-500">
        Loading journal...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-3 text-sm text-gray-500">
        No journal entries.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold">
          Journal
        </h2>
      </div>

      <div className="p-3 space-y-3">
        {entries.map((entry, index) => (
          <div
            key={index}
            className="rounded border border-gray-200 dark:border-gray-800 p-3"
          >
            {entry.timestamp && (
              <div className="text-xs text-gray-500 mb-1">
                {entry.timestamp}
              </div>
            )}

            <pre className="text-xs whitespace-pre-wrap break-words">
              {entry.message ||
                entry.action ||
                JSON.stringify(
                  entry,
                  null,
                  2,
                )}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
