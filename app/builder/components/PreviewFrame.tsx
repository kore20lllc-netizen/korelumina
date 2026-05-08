"use client";

import { useEffect, useState } from "react";

export default function PreviewFrame({
  projectId,
}: {
  projectId: string;
}) {
  const [src, setSrc] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setError("");

        const res = await fetch(
          `/api/dev/preview?projectId=${projectId}`,
        );

        const data =
          await res.json();

        if (!mounted) {
          return;
        }

        if (
          !data?.ok ||
          !data?.url
        ) {
          setError(
            data?.error ||
              "Preview failed",
          );

          return;
        }

        setSrc(data.url);
      } catch (err) {
        console.error(
          "[PreviewFrame]",
          err,
        );

        if (!mounted) {
          return;
        }

        setError(
          "Failed to connect to preview",
        );
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-red-400 bg-black">
        {error}
      </div>
    );
  }

  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-neutral-400 bg-black">
        Starting preview...
      </div>
    );
  }

  return (
    <iframe
      src={src}
      className="w-full h-full border-0 bg-white"
    />
  );
}
