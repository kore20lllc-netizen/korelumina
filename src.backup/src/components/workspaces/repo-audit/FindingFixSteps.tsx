import { useState } from "react";
import { ChevronDown, Check, Copy, ExternalLink, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FixGuide } from "./fixSteps";

/** Renders markdown-style `code` spans inside an explanation string. */
function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((p, i) =>
    p.startsWith("`") && p.endsWith("`") ? (
      <code key={i} className="px-1 py-0.5 rounded bg-surface-2 text-foreground/90 font-mono text-[11px]">
        {p.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

interface Props {
  id: string;
  guide: FixGuide;
  defaultOpen?: boolean;
}

export function FindingFixSteps({ id, guide, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [done, setDone] = useState<Set<number>>(new Set());
  const completed = done.size;
  const total = guide.steps.length;

  const toggle = (i: number) => {
    const next = new Set(done);
    next.has(i) ? next.delete(i) : next.add(i);
    setDone(next);
  };

  const copy = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const allDone = completed === total && total > 0;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`fix-${id}`}
        className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition"
      >
        <ListChecks className="h-3 w-3" />
        Fix steps
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border", allDone ? "border-cyan/30 bg-cyan/10 text-cyan" : "border-border bg-surface-1")}>
          {completed}/{total}
        </span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div id={`fix-${id}`} className="mt-2 rounded-xl border border-white/10 bg-surface-1/60 p-3 space-y-3">
          <p className="text-[12px] text-muted-foreground leading-relaxed">{renderInline(guide.explanation)}</p>

          <ul className="space-y-1.5">
            {guide.steps.map((step, i) => {
              const checked = done.has(i);
              return (
                <li key={i}>
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-start gap-2 text-left group"
                  >
                    <span
                      className={cn(
                        "mt-0.5 h-4 w-4 rounded border grid place-items-center shrink-0 transition",
                        checked
                          ? "bg-cyan/20 border-cyan/50 text-cyan"
                          : "border-border group-hover:border-white/25"
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className={cn("text-[12px] leading-relaxed", checked ? "text-muted-foreground line-through" : "text-foreground/90")}>
                      {renderInline(step)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {guide.commands && guide.commands.length > 0 && (
            <div className="space-y-1.5">
              {guide.commands.map((cmd) => (
                <div key={cmd} className="flex items-center gap-2 rounded-md bg-background/60 border border-border px-2.5 py-1.5">
                  <code className="flex-1 font-mono text-[11px] text-foreground/90 truncate">$ {cmd}</code>
                  <button
                    onClick={() => copy(cmd)}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition"
                    aria-label="Copy command"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              ))}
            </div>
          )}

          {guide.docsUrl && (
            <a
              href={guide.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-cyan hover:underline"
            >
              {guide.docsLabel ?? "Learn more"} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}