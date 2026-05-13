"use client";

import { useEffect, useState } from "react";

type Props = {
  projectId: string;
  workspaceId?: string;
  refreshTick?: number;
  onSelect?: (file: string) => void;
};

export default function FileTree({
  projectId,
  workspaceId = "default",
  refreshTick = 0,
  onSelect = () => {},
}: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          workspaceId,
          projectId,
        });

        const response = await fetch(
          `/api/dev/fs/list?${params.toString()}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!cancelled) {
          setFiles(
            Array.isArray(data.files)
              ? data.files
              : [],
          );
        }
      } catch (error) {
        console.error(
          "[FileTree] load failed:",
          error,
        );

        if (!cancelled) {
          setFiles([]);
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
  }, [
    workspaceId,
    projectId,
    refreshTick,
  ]);

  if (loading && files.length === 0) {
    return (
      <div className="p-3 text-sm text-gray-500">
        Loading files...
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-3 text-sm text-gray-500">
        No files found.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {files.map((file) => (
        <button
          key={file}
          type="button"
          onClick={() => onSelect(file)}
          className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {file}
        </button>
      ))}
    </div>
  );
}
