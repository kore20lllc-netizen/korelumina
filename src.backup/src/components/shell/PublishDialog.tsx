import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Rocket, Globe, Check, Copy, Loader2 } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PublishDialog() {
  const { publishOpen, setPublishOpen, activeProject } = useWorkspace();
  const [stage, setStage] = useState<"idle" | "publishing" | "done">("idle");
  const slug = (activeProject?.name ?? "lumina-project").toLowerCase().replace(/\s+/g, "-");
  const url = `https://${slug}.korelumina.app`;

  const handlePublish = () => {
    setStage("publishing");
    setTimeout(() => { setStage("done"); toast.success("Project published"); }, 1600);
  };

  const reset = () => { setStage("idle"); setPublishOpen(false); };

  return (
    <Dialog open={publishOpen} onOpenChange={(o) => { if (!o) reset(); }}>
      <DialogContent className="glass-strong border-border max-w-lg p-0 overflow-hidden">
        <div className="relative p-6 border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-aurora opacity-30" />
          <div className="relative flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-button-lumina grid place-items-center shadow-[0_0_24px_-4px_hsl(var(--violet)/0.7)]">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <DialogHeader className="text-left">
              <DialogTitle className="font-display text-xl">Publish to the world</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{activeProject?.name ?? "Untitled"} · production deploy</p>
            </DialogHeader>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Public URL</div>
            <div className="flex items-center gap-2 px-3 h-11 rounded-xl bg-surface-1 border border-border">
              <Globe className="h-4 w-4 text-cyan" />
              <span className="flex-1 text-sm truncate font-mono">{url}</span>
              <button
                onClick={() => { navigator.clipboard?.writeText(url); toast("Copied"); }}
                className="h-7 w-7 grid place-items-center rounded-md hover:bg-surface-2"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "SSL", on: true },
              { label: "CDN", on: true },
              { label: "SEO", on: true },
            ].map((f) => (
              <div key={f.label} className="px-3 py-2 rounded-xl bg-surface-1 border border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{f.label}</span>
                <Check className={cn("h-3.5 w-3.5", f.on ? "text-cyan" : "text-muted-foreground/40")} />
              </div>
            ))}
          </div>

          {stage === "done" && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-cyan/10 border border-cyan/30 text-sm text-cyan">
              <Check className="h-4 w-4" /> Live in production. Share the link.
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <LuminaButton variant="ghost" size="md" className="flex-1" onClick={reset}>
              {stage === "done" ? "Close" : "Cancel"}
            </LuminaButton>
            <LuminaButton
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handlePublish}
              disabled={stage !== "idle"}
            >
              {stage === "publishing" && <Loader2 className="h-4 w-4 animate-spin" />}
              {stage === "done" && <Check className="h-4 w-4" />}
              {stage === "idle" && <Rocket className="h-4 w-4" />}
              {stage === "publishing" ? "Publishing…" : stage === "done" ? "Published" : "Publish now"}
            </LuminaButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}