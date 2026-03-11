"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  projectId: string;
};

export default function PreviewFrame({ projectId }: Props) {
  const [stamp, setStamp] = useState("init");
  const lastStamp = useRef<string>("");

  useEffect(() => {
    let dead = false;

    async function check() {
      try {
        const res = await fetch(`/api/dev/preview/stamp?projectId=${encodeURIComponent(projectId)}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (dead) return;

        const nextStamp = String(json?.stamp ?? "none");

        if (lastStamp.current === "") {
          lastStamp.current = nextStamp;
          setStamp(nextStamp);
          return;
        }

        if (nextStamp !== lastStamp.current) {
          lastStamp.current = nextStamp;
          setStamp(nextStamp);
        }
      } catch {}
    }

    check();
    const id = window.setInterval(check, 1500);

    return () => {
      dead = true;
      window.clearInterval(id);
    };
  }, [projectId]);

  const src = useMemo(() => {
    return `/preview?projectId=${encodeURIComponent(projectId)}&v=${encodeURIComponent(stamp)}`;
  }, [projectId, stamp]);

  return (
    <div className="h-full w-full">
      <iframe
        key={src}
        src={src}
        title={`preview-${projectId}`}
        className="h-full w-full border-0 bg-white"
      />
    </div>
  );
}
