import { Sparkles, Send, Wand2, Image as ImageIcon, Layers, Square } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { cn } from "@/lib/utils";

type PromptComposerProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  generating: boolean;
  onStop?: () => void;
};

export function PromptComposer({ prompt, onPromptChange, onGenerate, generating, onStop }: PromptComposerProps) {
  return (
    <>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-4">
        <Sparkles className="h-3 w-3 text-violet" />
        AI Mode · describe anything
      </div>
      <h1 className="font-display text-2xl md:text-[34px] font-semibold tracking-[-0.025em] leading-[1.1]">
        What do you want to <span className="text-gradient-lumina">build</span>?
      </h1>

      <div className="mt-6 relative">
        <div className="relative glass-strong rounded-2xl p-1.5">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="A serene meditation app with calming gradients, daily streaks, and audio sessions…"
            rows={4}
            className="w-full resize-none bg-transparent outline-none px-4 py-3 text-[14px] leading-relaxed placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center justify-between gap-2 px-3 pb-3">
            <div className="flex items-center gap-1.5">
              <button className="h-8 px-2.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-surface-2 transition flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" />
                Attach
              </button>
              <button className="h-8 px-2.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-surface-2 transition flex items-center gap-1.5">
                <Layers className="h-3 w-3" />
                Style
              </button>
            </div>
            <div className="flex items-center gap-2">
              {generating && onStop && (
                <LuminaButton variant="ghost" size="md" onClick={onStop} aria-label="Stop generation">
                  <Square className="h-3 w-3" />
                  Stop
                </LuminaButton>
              )}
              <LuminaButton onClick={onGenerate} disabled={!prompt.trim() || generating} size="md">
                <Wand2 className={cn("h-3.5 w-3.5", generating && "animate-pulse")} />
                {generating ? "Generating…" : "Generate"}
                {!generating && <Send className="h-3 w-3" />}
              </LuminaButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}