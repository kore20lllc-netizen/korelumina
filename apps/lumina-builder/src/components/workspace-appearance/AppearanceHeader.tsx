import { Pin, X } from "lucide-react";

export function AppearanceHeader() {
  return (
    <header className="flex items-start justify-between">
      <div>
        <h2 className="text-lg font-semibold">
          Workspace Appearance
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          Personalize this workspace.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          className="rounded-xl border border-white/10 p-2 hover:bg-white/5"
          type="button"
        >
          <Pin className="h-4 w-4" />
        </button>

        <button
          className="rounded-xl border border-white/10 p-2 hover:bg-white/5"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
