"use client";

import { useBuilderState } from "@/lib/builder/state";

export default function ModeToggle() {
  const mode = useBuilderState((s) => s.mode);
  const setMode = useBuilderState((s) => s.setMode);

  return (
    <div className="inline-flex rounded-md border overflow-hidden">
      <button
        className={`px-3 py-1 text-sm ${
          mode === "dev" ? "bg-muted font-medium" : ""
        }`}
        onClick={() => setMode("dev")}
        type="button"
      >
        Dev
      </button>
      <button
        className={`px-3 py-1 text-sm ${
          mode === "designer" ? "bg-muted font-medium" : ""
        }`}
        onClick={() => setMode("designer")}
        type="button"
      >
        Designer
      </button>
    </div>
  );
}
