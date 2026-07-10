import {
  Lightbulb,
  RotateCcw,
  X,
} from "lucide-react";

export interface WorkspaceAppearanceHeaderProps {
  onClose(): void;
}

export function WorkspaceAppearanceHeader({
  onClose,
}: WorkspaceAppearanceHeaderProps) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-5 border-b border-white/10 px-6 py-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-amber-300/25 bg-amber-300/10 shadow-[0_0_24px_rgba(251,191,36,.12)]">
          <Lightbulb
            className="h-5 w-5 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,.55)]"
            aria-hidden
          />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,.32)]">
            Workspace Appearance
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Personalize every workspace.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled
          aria-label="Reset workspace appearance"
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs text-foreground/55 opacity-70"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <button
          type="button"
          aria-label="Close workspace appearance"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-foreground/70 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
