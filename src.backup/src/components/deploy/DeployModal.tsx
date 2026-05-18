import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Rocket, Loader2, Check } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deployProject } from "@/services/actions";
import { deploy as deployProvider } from "@/providers/registry";
import { normalizeError } from "@/lib/errors";

const providers = [
  { id: "vercel",     name: "Vercel",     desc: "Edge network, previews, instant rollback." },
  { id: "netlify",    name: "Netlify",    desc: "JAMstack with build plugins." },
  { id: "cloudflare", name: "Cloudflare", desc: "Pages + Workers, global edge." },
];

export function DeployModal() {
  const { deployOpen, setDeployOpen, activeProject, projects } = useWorkspace();
  const [provider, setProvider] = useState("vercel");
  const [domain, setDomain] = useState("");
  const [stage, setStage] = useState<"idle" | "deploying" | "done">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [url, setUrl] = useState<string | null>(null);
  const [domainCheck, setDomainCheck] = useState<{ status: "idle" | "checking" | "ok" | "error"; reason?: string; records?: Array<{ type: string; name: string; value: string }> }>({ status: "idle" });

  // Debounced inline domain validation
  useEffect(() => {
    if (!domain) { setDomainCheck({ status: "idle" }); return; }
    setDomainCheck({ status: "checking" });
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const v = await deployProvider.validateDomain(domain);
        if (cancelled) return;
        if (v.ok) setDomainCheck({ status: "ok", records: v.records });
        else setDomainCheck({ status: "error", reason: v.reason });
      } catch (e) {
        if (!cancelled) setDomainCheck({ status: "error", reason: normalizeError(e).userMessage });
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [domain]);

  const close = () => { setDeployOpen(false); setStage("idle"); setLogs([]); setUrl(null); };
  const targetProject = activeProject ?? projects[0];
  const deploy = async () => {
    if (!targetProject) { toast.error("Select a project to deploy."); return; }
    if (domain && domainCheck.status === "error") { toast.error(domainCheck.reason ?? "Invalid domain."); return; }
    setStage("deploying");
    setLogs([]);
    try {
      // Use provider directly to stream logs into the UI; deployProject also
      // records usage + notifications — call it without provider streaming
      // for entitlement + notification side-effects.
      const result = await deployProvider.deploy({
        projectId: targetProject.id,
        provider: (provider === "cloudflare" ? "custom" : provider) as "vercel" | "netlify" | "custom",
        customDomain: domain || undefined,
        onLog: (line) => setLogs((l) => [...l, line]),
      });
      // Mirror the side-effects of deployProject (notification + usage) so
      // direct provider use stays consistent with the actions layer.
      await deployProject(targetProject.id, provider).catch(() => undefined);
      setUrl(result.url ?? null);
      setStage("done");
      toast.success(`Deployed to ${provider}`);
    } catch (e) {
      setStage("idle");
      toast.error(normalizeError(e).userMessage);
    }
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
            {domain && domainCheck.status !== "idle" && (
              <div className="mt-2 text-[11px]">
                {domainCheck.status === "checking" && <span className="text-muted-foreground inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Checking domain…</span>}
                {domainCheck.status === "error" && <span className="text-magenta">✕ {domainCheck.reason}</span>}
                {domainCheck.status === "ok" && (
                  <div className="space-y-1">
                    <div className="text-cyan inline-flex items-center gap-1"><Check className="h-3 w-3" /> Domain looks valid. Add these DNS records:</div>
                    {domainCheck.records?.map((r, i) => (
                      <div key={i} className="font-mono text-[10px] text-muted-foreground pl-4">{r.type}  {r.name}  →  {r.value}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
          {(logs.length > 0 || url) && (
            <div className="mt-2 rounded-xl bg-surface-1 border border-border p-3 max-h-40 overflow-y-auto text-[11px] font-mono text-muted-foreground space-y-0.5">
              {logs.map((l, i) => (<div key={i}>{l}</div>))}
              {url && (<div className="text-cyan mt-1">→ {url}</div>)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}