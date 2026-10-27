const PROMPT_PHRASES = [
  "Describe what you want to build…",
  "Paste a GitHub repository URL…",
  "A SaaS dashboard for analytics…",
  "An AI copilot for customer support…",
  "A mobile-first portfolio site…",
];
const STATIC_PLACEHOLDER = "Describe what you want to build or paste a repository URL.";

import { useTypewriter, usePrefersReducedMotion } from "@/hooks/useTypewriter";
import { Sparkles, Send, Wand2, Image as ImageIcon, Layers, Square } from "lucide-react";
import { pillButton, quietButton, panelEyebrow } from "../developer/shared/surfaces";
import { electricContour, premiumSurfaces } from "@/components/design-system/lumina";
import { cn } from "@/lib/utils";

type PromptComposerProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  generating: boolean;
  onStop?: () => void;
};

export function PromptComposer({ prompt, onPromptChange, onGenerate, generating, onStop }: PromptComposerProps) {

  const reducedMotion = usePrefersReducedMotion();

  const animatedPlaceholder = useTypewriter(
    PROMPT_PHRASES,
    {
      /* These were typingSpeed, deletingSpeed and pauseMs, which the hook does not read. */
      typeMs: 28,
      deleteMs: 16,
      holdMs: 2200,
    },
  );

  return (
    <>
      <div className={cn(panelEyebrow, "mb-3 flex items-center gap-2")}>
        <Sparkles className="h-3 w-3 text-violet" />
        AI Mode · describe anything
      </div>
      <h2 className="text-2xl font-semibold tracking-[-0.025em] leading-tight text-sky-50">
        What do you want to <span className="text-gradient-lumina">build</span>?
      </h2>

      <div className="mt-6 relative">
        <div className={cn("rounded-[20px] p-1.5", premiumSurfaces.base.inset, electricContour.strength.subtle)}>
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={
              reducedMotion
                ? STATIC_PLACEHOLDER
                : (animatedPlaceholder || " ")
            }
            aria-label="Build prompt"
            rows={4}
            className="w-full resize-none bg-transparent outline-none px-4 py-3 text-sm leading-relaxed text-sky-50 placeholder:text-sky-300/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 rounded-2xl"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-3">
            <div className="flex items-center gap-1.5">
              <button className={quietButton}>
                <ImageIcon className="h-3 w-3" />
                Attach
              </button>
              <button className={quietButton}>
                <Layers className="h-3 w-3" />
                Style
              </button>
            </div>
            <div className="flex items-center gap-2">
              {generating && onStop && (
                <button type="button" className={pillButton("warning")} onClick={onStop} aria-label="Stop generation">
                  <Square className="h-3 w-3" />
                  Stop
                </button>
              )}
              <button type="button" className={pillButton("active")} onClick={onGenerate} disabled={!prompt.trim() || generating}>
                <Wand2 className={cn("h-3.5 w-3.5", generating && "animate-pulse")} />
                {generating ? "Generating…" : "Generate"}
                {!generating && <Send className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}