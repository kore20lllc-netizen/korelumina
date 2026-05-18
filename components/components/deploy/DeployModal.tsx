import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Rocket, Loader2, Check } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const providers = [
  { id: "vercel",     name: "Vercel",     desc: "Edge network, previews, instant rollback." },
  { id: "netlify",    name: "Netlify",    desc: "JAMstack with build plugins." },
  { id: "cloudflare", name: "Cloudflare", desc: "Pages + Workers, global edge." },
];

export function DeployModal() {
  const { deployOpen, setDeployOpen } = useWorkspace();
  const [provider, setProvider] = useState("vercel");
  const [domain, setDomain] = useState("");
  const [stage, setStage] = useState<"idle" | "deploying" | "done">("idle");

  const close = () => { setDeployOpen(false); setStage("idle"); };
  const deploy = () => {
    setStage("deploying");
    setTimeout(() => { setStage("done"); toast.success(`Deployed to ${provider}`); }, 1500);
  };

  return (
    <Dialog open={deployOpen} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="glass-strong border-border max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-border">
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Rocket className="h-5 w-5 text-violet" /> Deploy project
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Provider</div>
            <div className="grid grid-cols-3 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={cn(
                    "p-3 text-left rounded-xl glass transition",
                    provider === p.id ? "ring-1 ring-violet/60" : "hover:bg-surface-1",
                  )}
                >
                  <div className="text-[12px] font-medium">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Custom domain (optional)</div>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="app.yourdomain.com"
              className="w-full h-10 px-3 rounded-lg bg-surface-1 border border-border text-[13px] outline-none focus:border-violet/50"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <LuminaButton variant="ghost" size="md" onClick={close}>Cancel</LuminaButton>
            <LuminaButton size="md" onClick={deploy} disabled={stage === "deploying"}>
              {stage === "deploying" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
               stage === "done"      ? <Check className="h-3.5 w-3.5" /> :
                                       <Rocket className="h-3.5 w-3.5" />}
              {stage === "done" ? "Deployed" : "Deploy"}
            </LuminaButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}